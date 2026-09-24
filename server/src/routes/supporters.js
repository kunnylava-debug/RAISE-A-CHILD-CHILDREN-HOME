import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all supporters
router.get('/', (req, res) => {
  const supporters = db.prepare('SELECT * FROM supporters ORDER BY id DESC').all();
  res.json(supporters);
});

// POST add supporter (Admin)
router.post('/', authenticateToken, (req, res) => {
  const { name, occupation, support_type, photo_url, message, date_supported } = req.body;
  if (!name || !support_type) {
    return res.status(400).json({ error: 'Supporter name and support type are required.' });
  }

  const result = db.prepare(`
    INSERT INTO supporters (name, occupation, support_type, photo_url, message, date_supported)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    name,
    occupation || '',
    support_type,
    photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    message || '',
    date_supported || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  );

  const newSupp = db.prepare('SELECT * FROM supporters WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newSupp);
});

// PUT update supporter (Admin)
router.put('/:id', authenticateToken, (req, res) => {
  const { name, occupation, support_type, photo_url, message, date_supported } = req.body;

  db.prepare(`
    UPDATE supporters
    SET name = ?, occupation = ?, support_type = ?, photo_url = ?, message = ?, date_supported = ?
    WHERE id = ?
  `).run(name, occupation, support_type, photo_url, message, date_supported, req.params.id);

  const updated = db.prepare('SELECT * FROM supporters WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE supporter (Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM supporters WHERE id = ?').run(req.params.id);
  res.json({ message: 'Supporter removed successfully.' });
});

export default router;
