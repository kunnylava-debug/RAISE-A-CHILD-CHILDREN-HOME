import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET licence
router.get('/', (req, res) => {
  const licence = db.prepare('SELECT * FROM licence ORDER BY id DESC LIMIT 1').get();
  res.json(licence || {});
});

// PUT update licence (Admin)
router.put('/', authenticateToken, (req, res) => {
  const { licence_no, licence_type, issuing_authority, issue_date, expiry_date, status, document_url, remarks } = req.body;
  const existing = db.prepare('SELECT id FROM licence ORDER BY id DESC LIMIT 1').get();

  if (existing) {
    db.prepare(`
      UPDATE licence 
      SET licence_no = ?, licence_type = ?, issuing_authority = ?, issue_date = ?, expiry_date = ?, status = ?, document_url = ?, remarks = ?
      WHERE id = ?
    `).run(licence_no, licence_type, issuing_authority, issue_date, expiry_date, status, document_url, remarks, existing.id);
  } else {
    db.prepare(`
      INSERT INTO licence (licence_no, licence_type, issuing_authority, issue_date, expiry_date, status, document_url, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(licence_no, licence_type, issuing_authority, issue_date, expiry_date, status, document_url, remarks);
  }

  const updated = db.prepare('SELECT * FROM licence ORDER BY id DESC LIMIT 1').get();
  res.json(updated);
});

// DELETE clear licence (Admin)
router.delete('/', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM licence').run();
  res.json({ message: 'Licence records cleared successfully' });
});

export default router;
