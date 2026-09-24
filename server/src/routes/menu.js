import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET menu
router.get('/', (req, res) => {
  const menu = db.prepare('SELECT * FROM menu ORDER BY id ASC').all();
  res.json(menu);
});

// PUT update single day menu (Admin)
router.put('/:id', authenticateToken, (req, res) => {
  const { breakfast, lunch, snacks, dinner } = req.body;
  db.prepare(`
    UPDATE menu
    SET breakfast = ?, lunch = ?, snacks = ?, dinner = ?
    WHERE id = ?
  `).run(breakfast, lunch, snacks, dinner, req.params.id);

  const updated = db.prepare('SELECT * FROM menu WHERE id = ?').get(req.params.id);
  res.json(updated);
});

export default router;
