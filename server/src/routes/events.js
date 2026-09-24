import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all events
router.get('/', (req, res) => {
  const events = db.prepare('SELECT * FROM events ORDER BY order_num ASC, id DESC').all();
  res.json(events);
});

// POST add event (Admin)
router.post('/', authenticateToken, (req, res) => {
  const { title, date, category, description, image_url, order_num } = req.body;
  if (!title || !image_url) {
    return res.status(400).json({ error: 'Title and image URL are required.' });
  }

  const result = db.prepare(`
    INSERT INTO events (title, date, category, description, image_url, order_num)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, date || '', category || 'Hostel Event', description || '', image_url, order_num || 0);

  const newEvent = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newEvent);
});

// PUT update event (Admin)
router.put('/:id', authenticateToken, (req, res) => {
  const { title, date, category, description, image_url, order_num } = req.body;
  db.prepare(`
    UPDATE events
    SET title = ?, date = ?, category = ?, description = ?, image_url = ?, order_num = ?
    WHERE id = ?
  `).run(title, date, category, description, image_url, order_num || 0, req.params.id);

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE event (Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ message: 'Event removed successfully.' });
});

export default router;
