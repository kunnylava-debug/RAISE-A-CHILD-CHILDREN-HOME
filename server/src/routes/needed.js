import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all needed items
router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM needed_items ORDER BY is_fulfilled ASC, id ASC').all();
  res.json(items);
});

// POST add needed item (Admin)
router.post('/', authenticateToken, (req, res) => {
  const { item_name, category, quantity_needed, quantity_received, estimated_price, urgency, description } = req.body;
  if (!item_name || !quantity_needed || estimated_price === undefined) {
    return res.status(400).json({ error: 'Item name, quantity, and estimated price are required.' });
  }

  const result = db.prepare(`
    INSERT INTO needed_items (item_name, category, quantity_needed, quantity_received, estimated_price, urgency, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    item_name,
    category || 'General',
    parseInt(quantity_needed),
    parseInt(quantity_received || 0),
    parseInt(estimated_price),
    urgency || 'Medium',
    description || ''
  );

  const newItem = db.prepare('SELECT * FROM needed_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newItem);
});

// PUT update needed item (Admin)
router.put('/:id', authenticateToken, (req, res) => {
  const { item_name, category, quantity_needed, quantity_received, estimated_price, urgency, description, is_fulfilled } = req.body;

  db.prepare(`
    UPDATE needed_items
    SET item_name = ?, category = ?, quantity_needed = ?, quantity_received = ?, estimated_price = ?, urgency = ?, description = ?, is_fulfilled = ?
    WHERE id = ?
  `).run(
    item_name,
    category,
    parseInt(quantity_needed),
    parseInt(quantity_received || 0),
    parseInt(estimated_price),
    urgency,
    description,
    is_fulfilled ? 1 : 0,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM needed_items WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE needed item (Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM needed_items WHERE id = ?').run(req.params.id);
  res.json({ message: 'Item deleted successfully.' });
});

export default router;
