import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all staff members
router.get('/', (req, res) => {
  const staff = db.prepare('SELECT * FROM staff ORDER BY order_num ASC, id ASC').all();
  res.json(staff);
});

// GET single staff
router.get('/:id', (req, res) => {
  const member = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Staff member not found.' });
  res.json(member);
});

// POST add staff (Admin)
router.post('/', authenticateToken, (req, res) => {
  const { name, role, mobile, email, qualification, experience, description, photo, order_num } = req.body;
  if (!name || !role || !mobile) {
    return res.status(400).json({ error: 'Name, role, and mobile are required.' });
  }

  const result = db.prepare(`
    INSERT INTO staff (name, role, mobile, email, qualification, experience, description, photo, order_num)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    role,
    mobile,
    email || '',
    qualification || '',
    experience || '',
    description || '',
    photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    order_num || 0
  );

  const newMember = db.prepare('SELECT * FROM staff WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newMember);
});

// PUT update staff (Admin)
router.put('/:id', authenticateToken, (req, res) => {
  const { name, role, mobile, email, qualification, experience, description, photo, order_num } = req.body;

  db.prepare(`
    UPDATE staff 
    SET name = ?, role = ?, mobile = ?, email = ?, qualification = ?, experience = ?, description = ?, photo = ?, order_num = ?
    WHERE id = ?
  `).run(name, role, mobile, email, qualification, experience, description, photo, order_num || 0, req.params.id);

  const updated = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE staff (Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
  res.json({ message: 'Staff member removed successfully.' });
});

export default router;
