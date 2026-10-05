import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';
import { sendPasswordResetOtpEmail } from '../services/notificationService.js';

const router = express.Router();

// Memory store for basic request rate limiting
const otpRateLimitMap = new Map(); // ip/key -> { count, lastRequest }

function checkRateLimit(key, maxRequests = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const entry = otpRateLimitMap.get(key) || { count: 0, lastRequest: now };
  if (now - entry.lastRequest > windowMs) {
    entry.count = 1;
    entry.lastRequest = now;
  } else {
    entry.count += 1;
  }
  otpRateLimitMap.set(key, entry);
  return entry.count <= maxRequests;
}

// 1. Admin Login (Hardened with rate-limiting against brute-force attacks)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'ip';
  const loginRateKey = `login_attempts_${clientIp}`;

  if (!checkRateLimit(loginRateKey, 10, 15 * 60 * 1000)) {
    return res.status(429).json({ 
      error: 'Security Notice: Too many login attempts. Access is temporarily locked. Please try again in 15 minutes.' 
    });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Clear rate limit on successful authentication
  otpRateLimitMap.delete(loginRateKey);

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

// 2. Verify Token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// 3. Forgot Password — Initiate OTP Flow
router.post('/forgot-password', async (req, res) => {
  const { username_or_email, identifier } = req.body;
  const input = (username_or_email || identifier || '').trim();

  if (!input) {
    return res.status(400).json({ error: 'Please enter your username or registered admin email address.' });
  }

  // Rate limit by client IP / input to prevent abuse
  const clientKey = `${req.ip || 'ip'}_${input.toLowerCase()}`;
  if (!checkRateLimit(clientKey, 5, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many OTP requests. Please wait 15 minutes before requesting again.' });
  }

  // Locate admin user by username or email
  let user = db.prepare('SELECT * FROM admin_users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)').get(input, input);

  // If not found by input, and input is 'admin', find primary admin
  if (!user && (input.toLowerCase() === 'admin' || input.toLowerCase() === 'pn9059491777@gmail.com')) {
    user = db.prepare('SELECT * FROM admin_users LIMIT 1').get();
  }

  if (!user) {
    // Return friendly generic response to prevent account enumeration
    return res.json({
      success: true,
      message: 'If an authorized administrator account exists for this username or email, a 6-digit recovery OTP has been dispatched to pn9059491777@gmail.com.',
      email_hint: 'p***7@gmail.com'
    });
  }

  // Generate cryptographically secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 999999).toString();
  const otpHash = bcrypt.hashSync(rawOtp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

  // Invalidate any previous unused OTPs for this admin
  try {
    db.prepare('UPDATE password_reset_otps SET used = 1 WHERE admin_id = ? AND used = 0').run(user.id);
  } catch {}

  // Store new OTP in database
  const targetEmail = user.email || 'pn9059491777@gmail.com';
  db.prepare(`
    INSERT INTO password_reset_otps (admin_id, email, otp_hash, expires_at, attempts, used)
    VALUES (?, ?, ?, ?, 0, 0)
  `).run(user.id, targetEmail, otpHash, expiresAt);

  // Dispatch OTP email to pn9059491777@gmail.com
  try {
    await sendPasswordResetOtpEmail({
      email: targetEmail,
      otp: rawOtp,
      username: user.username
    });
  } catch (err) {
    console.error('[FORGOT PASSWORD EMAIL ERR]', err.message);
  }

  res.json({
    success: true,
    message: 'A 6-digit verification code (OTP) has been dispatched to pn9059491777@gmail.com. It is valid for 10 minutes.',
    email_hint: 'pn9059491777@gmail.com',
    username: user.username
  });
});

// 4. Verify OTP Code
router.post('/verify-otp', (req, res) => {
  const { username_or_email, identifier, otp } = req.body;
  const input = (username_or_email || identifier || '').trim();
  const code = (otp || '').trim();

  if (!input || !code) {
    return res.status(400).json({ error: 'Username/email and 6-digit OTP code are required.' });
  }

  let user = db.prepare('SELECT * FROM admin_users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)').get(input, input);
  if (!user && (input.toLowerCase() === 'admin' || input.toLowerCase() === 'pn9059491777@gmail.com')) {
    user = db.prepare('SELECT * FROM admin_users LIMIT 1').get();
  }

  if (!user) {
    return res.status(400).json({ error: 'Invalid verification request.' });
  }

  const otpRecord = db.prepare(`
    SELECT * FROM password_reset_otps 
    WHERE admin_id = ? AND used = 0 
    ORDER BY id DESC LIMIT 1
  `).get(user.id);

  if (!otpRecord) {
    return res.status(400).json({ error: 'No active OTP request found. Please request a new code.' });
  }

  // Check expiration
  if (new Date(otpRecord.expires_at) < new Date()) {
    db.prepare('UPDATE password_reset_otps SET used = 1 WHERE id = ?').run(otpRecord.id);
    return res.status(400).json({ error: 'This verification code has expired (10 min limit). Please request a fresh OTP.' });
  }

  // Check attempt rate limiting (max 5 tries)
  if (otpRecord.attempts >= 5) {
    db.prepare('UPDATE password_reset_otps SET used = 1 WHERE id = ?').run(otpRecord.id);
    return res.status(429).json({ error: 'Maximum verification attempts exceeded. For security, this OTP has been cancelled. Please request a new code.' });
  }

  // Compare OTP
  const isValid = bcrypt.compareSync(code, otpRecord.otp_hash);
  if (!isValid) {
    const updatedAttempts = (otpRecord.attempts || 0) + 1;
    db.prepare('UPDATE password_reset_otps SET attempts = ? WHERE id = ?').run(updatedAttempts, otpRecord.id);
    const remaining = Math.max(0, 5 - updatedAttempts);
    return res.status(400).json({ 
      error: `Invalid OTP code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` 
    });
  }

  // Issue temporary password reset token valid for 15 minutes
  const resetToken = jwt.sign(
    { id: user.id, username: user.username, purpose: 'admin_password_reset', otp_id: otpRecord.id },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.json({
    success: true,
    message: 'OTP verified successfully! You may now set your new administrator password.',
    reset_token: resetToken,
    username: user.username
  });
});

// 5. Complete Password Reset
router.post('/reset-password', (req, res) => {
  const { reset_token, new_password, confirm_password, username_or_email, otp } = req.body;

  if (!new_password) {
    return res.status(400).json({ error: 'New password is required.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  if (confirm_password && new_password !== confirm_password) {
    return res.status(400).json({ error: 'Passwords do not match. Please verify.' });
  }

  let adminId = null;
  let otpId = null;

  // Path A: Verified via Reset Token JWT
  if (reset_token) {
    try {
      const decoded = jwt.verify(reset_token, JWT_SECRET);
      if (decoded.purpose !== 'admin_password_reset') {
        return res.status(400).json({ error: 'Invalid reset authorization token.' });
      }
      adminId = decoded.id;
      otpId = decoded.otp_id;
    } catch {
      return res.status(400).json({ error: 'Reset session has expired. Please request a new OTP.' });
    }
  } 
  // Path B: Direct combined OTP verification
  else if (username_or_email && otp) {
    const input = username_or_email.trim();
    let user = db.prepare('SELECT * FROM admin_users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)').get(input, input);
    if (!user && (input.toLowerCase() === 'admin' || input.toLowerCase() === 'pn9059491777@gmail.com')) {
      user = db.prepare('SELECT * FROM admin_users LIMIT 1').get();
    }
    if (!user) return res.status(400).json({ error: 'Invalid user.' });

    const otpRecord = db.prepare(`SELECT * FROM password_reset_otps WHERE admin_id = ? AND used = 0 ORDER BY id DESC LIMIT 1`).get(user.id);
    if (!otpRecord || new Date(otpRecord.expires_at) < new Date() || !bcrypt.compareSync(otp.trim(), otpRecord.otp_hash)) {
      return res.status(400).json({ error: 'Invalid or expired OTP code.' });
    }
    adminId = user.id;
    otpId = otpRecord.id;
  } else {
    return res.status(400).json({ error: 'Reset authorization is missing.' });
  }

  const newHash = bcrypt.hashSync(new_password.trim(), 10);
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(newHash, adminId);

  // Invalidate the used OTP and any other open OTPs for this admin
  if (otpId) {
    db.prepare('UPDATE password_reset_otps SET used = 1 WHERE id = ?').run(otpId);
  }
  db.prepare('UPDATE password_reset_otps SET used = 1 WHERE admin_id = ?').run(adminId);

  res.json({
    success: true,
    message: 'Your administrator password has been reset successfully. You can now log in with your new password.'
  });
});

// 6. Update Admin Credentials (Logged in Admin)
router.post('/update-credentials', authenticateToken, (req, res) => {
  const currentPassword = req.body.currentPassword || req.body.current_password;
  const newUsername = req.body.newUsername || req.body.new_username;
  const newPassword = req.body.newPassword || req.body.new_password;

  if (!currentPassword) {
    return res.status(400).json({ error: 'Current password is required to verify authorization.' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.user.id);
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: 'Current password entered is incorrect.' });
  }

  let updatedUsername = user.username;
  let updatedHash = user.password_hash;

  if (newUsername && newUsername.trim() !== '') {
    const trimmedUser = newUsername.trim();
    // Check if another user already has this username
    const existing = db.prepare('SELECT id FROM admin_users WHERE username = ? AND id != ?').get(trimmedUser, user.id);
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken by another account.' });
    }
    updatedUsername = trimmedUser;
  }

  if (newPassword && newPassword.trim() !== '') {
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }
    updatedHash = bcrypt.hashSync(newPassword, 10);
  }

  db.prepare('UPDATE admin_users SET username = ?, password_hash = ? WHERE id = ?').run(
    updatedUsername,
    updatedHash,
    user.id
  );

  const newToken = jwt.sign(
    { id: user.id, username: updatedUsername, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    message: 'Admin credentials updated successfully.',
    token: newToken,
    username: updatedUsername,
    user: { id: user.id, username: updatedUsername, role: user.role }
  });
});

export default router;
