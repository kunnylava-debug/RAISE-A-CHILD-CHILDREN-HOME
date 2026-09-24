import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all categories with their photos
router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM views_categories ORDER BY order_num ASC, id ASC').all();
  const getPhotos = db.prepare('SELECT * FROM views_photos WHERE category_id = ? ORDER BY order_num ASC, id ASC');

  const result = categories.map(cat => ({
    ...cat,
    photos: getPhotos.all(cat.id)
  }));

  res.json(result);
});

// POST add new category (Admin)
router.post('/categories', authenticateToken, (req, res) => {
  const { name, description, order_num } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required.' });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  const result = db.prepare('INSERT INTO views_categories (slug, name, description, order_num) VALUES (?, ?, ?, ?)').run(
    slug,
    name,
    description || '',
    order_num || 0
  );

  const newCat = db.prepare('SELECT * FROM views_categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...newCat, photos: [] });
});

// PUT update category (Admin)
router.put('/categories/:id', authenticateToken, (req, res) => {
  const { name, description, order_num } = req.body;
  db.prepare('UPDATE views_categories SET name = ?, description = ?, order_num = ? WHERE id = ?').run(
    name,
    description,
    order_num || 0,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM views_categories WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE category (Admin)
router.delete('/categories/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM views_photos WHERE category_id = ?').run(req.params.id);
  db.prepare('DELETE FROM views_categories WHERE id = ?').run(req.params.id);
  res.json({ message: 'Category and its photos deleted successfully.' });
});

// POST add photo to category (Admin)
router.post('/photos', authenticateToken, (req, res) => {
  const { category_id, title, description, image_url, order_num } = req.body;
  if (!category_id || !image_url) {
    return res.status(400).json({ error: 'Category ID and image URL are required.' });
  }

  const result = db.prepare(`
    INSERT INTO views_photos (category_id, title, description, image_url, order_num)
    VALUES (?, ?, ?, ?, ?)
  `).run(category_id, title || '', description || '', image_url, order_num || 0);

  const newPhoto = db.prepare('SELECT * FROM views_photos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newPhoto);
});

// DELETE photo (Admin)
router.delete('/photos/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM views_photos WHERE id = ?').run(req.params.id);
  res.json({ message: 'Photo removed successfully.' });
});

export default router;
