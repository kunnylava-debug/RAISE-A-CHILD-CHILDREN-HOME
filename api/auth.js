const { getCloudData, setCloudData } = require('./cloudDb');
const crypto = require('crypto');

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(String(pwd)).digest('hex');
}

const DEFAULT_CREDS = {
  username: 'admin',
  custom_password_set: false,
  password_hash: hashPassword('admin123'),
  custom_password: null
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const url = req.url || '';
  const method = req.method;

  try {
    let creds = await getCloudData('credentials', DEFAULT_CREDS);
    if (!creds || typeof creds !== 'object') creds = DEFAULT_CREDS;

    // 1. POST /api/auth/login
    if (method === 'POST' && url.includes('/login')) {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const inputUser = (body.username || '').trim();
      const inputPass = String(body.password || '').trim();

      const storedUser = creds.username || 'admin';
      const isCustomSet = Boolean(creds.custom_password_set && (creds.custom_password || creds.password_hash));

      let isPasswordValid = false;
      let isUserValid = inputUser === storedUser;

      if (isCustomSet) {
        // STRICT CHECK: Custom password is active. DEFAULT 'admin123' IS NEVER ACCEPTED!
        if (creds.custom_password) {
          isPasswordValid = inputPass === creds.custom_password;
        } else if (creds.password_hash) {
          isPasswordValid = hashPassword(inputPass) === creds.password_hash;
        }
      } else {
        // No custom password set yet: accept default 'admin123'
        isPasswordValid = inputPass === 'admin123' || hashPassword(inputPass) === creds.password_hash;
      }

      if (!isUserValid || !isPasswordValid) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          error: 'Invalid username or password. Please verify your credentials.'
        }));
      }

      const token = 'rac_session_' + crypto.randomBytes(24).toString('hex');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        token,
        user: { id: 1, username: storedUser, role: 'admin' },
        message: 'Authenticated successfully'
      }));
    }

    // 2. GET /api/auth/verify
    if (url.includes('/verify')) {
      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();

      if (token && token.length > 5) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          valid: true,
          user: { id: 1, username: creds.username || 'admin', role: 'admin' }
        }));
      }

      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ valid: false, error: 'Unauthorized session' }));
    }

    // 3. POST /api/auth/update-credentials
    if (method === 'POST' && (url.includes('/update-credentials') || url.includes('/change-password'))) {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const currentPass = String(body.current_password || body.currentPassword || '').trim();
      const newUsername = (body.new_username || body.newUsername || creds.username || 'admin').trim();
      const newPassword = String(body.new_password || body.newPassword || '').trim();

      // Verify current password
      const isCustomSet = Boolean(creds.custom_password_set && (creds.custom_password || creds.password_hash));
      let isCurrentValid = false;

      if (isCustomSet) {
        if (creds.custom_password) {
          isCurrentValid = currentPass === creds.custom_password;
        } else if (creds.password_hash) {
          isCurrentValid = hashPassword(currentPass) === creds.password_hash;
        }
      } else {
        isCurrentValid = currentPass === 'admin123' || hashPassword(currentPass) === creds.password_hash;
      }

      if (!isCurrentValid) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          error: 'Current password entered is incorrect.'
        }));
      }

      const updatedCreds = {
        username: newUsername || creds.username || 'admin',
        custom_password_set: true,
        custom_password: newPassword ? newPassword : (creds.custom_password || null),
        password_hash: newPassword ? hashPassword(newPassword) : creds.password_hash,
        updated_at: new Date().toISOString()
      };

      await setCloudData('credentials', updatedCreds, `Update administrator credentials [skip ci]`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        message: 'Admin username and password updated successfully.'
      }));
    }

    res.statusCode = 404;
    return res.end(JSON.stringify({ error: 'Auth endpoint not found' }));
  } catch (err) {
    console.error('[API Auth Error]:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err.message || 'Authentication service error' }));
  }
};
