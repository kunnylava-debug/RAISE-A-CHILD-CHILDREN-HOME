import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Admin Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

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

// Verify Token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Update Admin Credentials (Username and/or Password)
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
