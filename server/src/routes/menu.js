import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { broadcastSyncEvent } from '../services/syncService.js';

const router = express.Router();

// GET all days in the food timetable
router.get('/', (req, res) => {
  const menu = db.prepare('SELECT * FROM menu ORDER BY id ASC').all();
  res.json(menu);
});

// POST add a new day to the food timetable (Admin)
router.post('/', authenticateToken, (req, res) => {
  const { day_of_week, breakfast, lunch, snacks, dinner } = req.body;
  if (!day_of_week || !day_of_week.trim()) {
    return res.status(400).json({ error: 'Day name is required (e.g. Monday, Sunday, Special Festival Day).' });
  }

  const existing = db.prepare('SELECT id FROM menu WHERE LOWER(day_of_week) = LOWER(?)').get(day_of_week.trim());
  if (existing) {
    return res.status(400).json({ error: `A menu record for "${day_of_week.trim()}" already exists. You can edit it instead.` });
  }

  const result = db.prepare(`
    INSERT INTO menu (day_of_week, breakfast, lunch, snacks, dinner)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    day_of_week.trim(),
    breakfast || '',
    lunch || '',
    snacks || '',
    dinner || ''
  );

  const newDay = db.prepare('SELECT * FROM menu WHERE id = ?').get(result.lastInsertRowid);
  broadcastSyncEvent({ type: 'MENU_UPDATED', action: 'create', day: newDay });
  res.status(201).json(newDay);
});

// PUT update single day menu (Admin)
router.put('/:id', authenticateToken, (req, res) => {
  const { day_of_week, breakfast, lunch, snacks, dinner } = req.body;
  db.prepare(`
    UPDATE menu
    SET day_of_week = COALESCE(?, day_of_week),
        breakfast = ?,
        lunch = ?,
        snacks = ?,
        dinner = ?
    WHERE id = ?
  `).run(
    day_of_week ? day_of_week.trim() : null,
    breakfast || '',
    lunch || '',
    snacks || '',
    dinner || '',
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM menu WHERE id = ?').get(req.params.id);
  broadcastSyncEvent({ type: 'MENU_UPDATED', action: 'update', id: req.params.id, day: updated });
  res.json(updated);
});

// DELETE a day from the food timetable (Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT * FROM menu WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Menu day not found.' });
  }

  db.prepare('DELETE FROM menu WHERE id = ?').run(req.params.id);
  broadcastSyncEvent({ type: 'MENU_UPDATED', action: 'delete', id: req.params.id });
  res.json({ success: true, message: `Day "${existing.day_of_week}" removed from food timetable.` });
});

export default router;
