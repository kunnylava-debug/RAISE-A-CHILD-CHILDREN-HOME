import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all settings
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const r of rows) {
    if (r.key === 'instructions_dos' || r.key === 'instructions_donts') {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch (e) {
        settings[r.key] = [];
      }
    } else {
      settings[r.key] = r.value;
    }
  }
  res.json(settings);
});

// PUT update settings (Admin only)
router.put('/', authenticateToken, (req, res) => {
  const updates = req.body;
  const insertOrUpdate = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

  const updateTx = db.transaction((data) => {
    for (const [key, value] of Object.entries(data)) {
      const valStr = (key === 'instructions_dos' || key === 'instructions_donts') && Array.isArray(value)
        ? JSON.stringify(value)
        : String(value);
      insertOrUpdate.run(key, valStr);
    }
  });

  try {
    updateTx(updates);
    res.json({ message: 'Settings saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings: ' + err.message });
  }
});

export default router;
