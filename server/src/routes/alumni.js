import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all alumni (public)
router.get('/', (req, res) => {
  const alumni = db.prepare('SELECT * FROM alumni ORDER BY order_num ASC, id DESC').all();
  res.json(alumni);
});

// POST add alumnus (admin)
router.post('/', authenticateToken, (req, res) => {
  const { name, stay_years, current_position, location, photo_url, quote, order_num } = req.body;
  if (!name || !current_position) {
    return res.status(400).json({ error: 'Name and current position are required.' });
  }

  const result = db.prepare(`
    INSERT INTO alumni (name, stay_years, current_position, location, photo_url, quote, order_num)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    stay_years || 'Alumni Member',
    current_position,
    location || 'West Bengal, India',
    photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    quote || '',
    order_num || 0
  );

  const newAlumnus = db.prepare('SELECT * FROM alumni WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newAlumnus);
});

// PUT update alumnus (admin)
router.put('/:id', authenticateToken, (req, res) => {
  const { name, stay_years, current_position, location, photo_url, quote, order_num } = req.body;
  db.prepare(`
    UPDATE alumni
    SET name = ?, stay_years = ?, current_position = ?, location = ?, photo_url = ?, quote = ?, order_num = ?
    WHERE id = ?
  `).run(name, stay_years, current_position, location, photo_url, quote, order_num || 0, req.params.id);

  const updated = db.prepare('SELECT * FROM alumni WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE alumnus (admin)
router.delete('/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM alumni WHERE id = ?').run(req.params.id);
  res.json({ message: 'Alumnus record removed successfully.' });
});

export default router;
