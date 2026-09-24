import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET timetable
router.get('/', (req, res) => {
  const schedule = db.prepare('SELECT * FROM timetable ORDER BY order_num ASC, id ASC').all();
  res.json(schedule);
});

// POST add row (Admin)
router.post('/', authenticateToken, (req, res) => {
  const { time_slot, activity, location_or_notes, icon_name, order_num } = req.body;
  if (!time_slot || !activity) {
    return res.status(400).json({ error: 'Time slot and activity are required.' });
  }

  const result = db.prepare(`
    INSERT INTO timetable (time_slot, activity, location_or_notes, icon_name, order_num)
    VALUES (?, ?, ?, ?, ?)
  `).run(time_slot, activity, location_or_notes || '', icon_name || 'Clock', order_num || 0);

  const newRow = db.prepare('SELECT * FROM timetable WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newRow);
});

// PUT update row (Admin)
router.put('/:id', authenticateToken, (req, res) => {
  const { time_slot, activity, location_or_notes, icon_name, order_num } = req.body;
  db.prepare(`
    UPDATE timetable
    SET time_slot = ?, activity = ?, location_or_notes = ?, icon_name = ?, order_num = ?
    WHERE id = ?
  `).run(time_slot, activity, location_or_notes || '', icon_name || 'Clock', order_num || 0, req.params.id);

  const updated = db.prepare('SELECT * FROM timetable WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// PUT reorder rows (Admin)
router.put('/reorder', authenticateToken, (req, res) => {
  const { ordered_ids } = req.body; // Array of IDs in order
  if (!Array.isArray(ordered_ids)) {
    return res.status(400).json({ error: 'ordered_ids array is required.' });
  }

  const updateOrder = db.prepare('UPDATE timetable SET order_num = ? WHERE id = ?');
  const reorderTx = db.transaction((ids) => {
    ids.forEach((id, index) => {
      updateOrder.run(index + 1, id);
    });
  });

  reorderTx(ordered_ids);
  res.json({ message: 'Timetable reordered successfully.' });
});

// DELETE row (Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM timetable WHERE id = ?').run(req.params.id);
  res.json({ message: 'Timetable row deleted successfully.' });
});

export default router;
