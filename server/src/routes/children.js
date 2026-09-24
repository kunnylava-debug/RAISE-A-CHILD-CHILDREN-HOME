import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// Helper to check if requester is admin/staff
function isAuthorized(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// GET /api/children (Public with Privacy Shield, or full if authorized)
router.get('/', (req, res) => {
  const authorized = isAuthorized(req);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;
  const search = req.query.search ? `%${req.query.search}%` : null;
  const classFilter = req.query.class || null;
  const genderFilter = req.query.gender || null;

  // Aggregate stats
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM children WHERE is_active = 1').get().count;
  const boysCount = db.prepare("SELECT COUNT(*) as count FROM children WHERE is_active = 1 AND gender = 'Male'").get().count;
  const girlsCount = db.prepare("SELECT COUNT(*) as count FROM children WHERE is_active = 1 AND gender = 'Female'").get().count;

  // Build query
  let query = 'SELECT * FROM children WHERE is_active = 1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR serial_no LIKE ?)';
    params.push(search, search);
  }
  if (classFilter && classFilter !== 'all') {
    query += ' AND class = ?';
    params.push(classFilter);
  }
  if (genderFilter && genderFilter !== 'all') {
    query += ' AND gender = ?';
    params.push(genderFilter);
  }

  // Count filtered
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const filteredCount = db.prepare(countQuery).get(...params).count;

  query += ' ORDER BY id ASC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rawRows = db.prepare(query).all(...params);

  // Mask sensitive fields if NOT authorized
  const sanitizedRows = rawRows.map(child => {
    if (authorized) {
      return child;
    }
    return {
      id: child.id,
      serial_no: child.serial_no,
      name: child.name,
      age: child.age,
      class: child.class,
      gender: child.gender,
      admission_date: child.admission_date,
      photo: child.photo,
      hobbies: child.hobbies,
      is_private_protected: true,
      guardian_name: 'Protected (Authorized Staff Only)',
      guardian_phone: '••••••••••',
      guardian_address: 'Protected for Child Privacy',
      medical_notes: 'Encrypted & Confidential'
    };
  });

  res.json({
    total_children: totalCount,
    boys_count: boysCount,
    girls_count: girlsCount,
    filtered_count: filteredCount,
    page,
    limit,
    total_pages: Math.ceil(filteredCount / limit),
    is_authorized: authorized,
    children: sanitizedRows
  });
});

// GET single child
router.get('/:id', (req, res) => {
  const authorized = isAuthorized(req);
  const child = db.prepare('SELECT * FROM children WHERE id = ?').get(req.params.id);
  if (!child) return res.status(404).json({ error: 'Child record not found.' });

  if (!authorized) {
    return res.json({
      id: child.id,
      serial_no: child.serial_no,
      name: child.name,
      age: child.age,
      class: child.class,
      gender: child.gender,
      admission_date: child.admission_date,
      photo: child.photo,
      hobbies: child.hobbies,
      is_private_protected: true,
      guardian_name: 'Protected (Authorized Staff Only)',
      guardian_phone: '••••••••••',
      guardian_address: 'Protected for Child Privacy',
      medical_notes: 'Encrypted & Confidential'
    });
  }

  res.json(child);
});

// POST add child (Admin)
router.post('/', authenticateToken, (req, res) => {
  const { name, age, class: childClass, gender, admission_date, photo, guardian_name, guardian_phone, guardian_address, medical_notes, hobbies } = req.body;
  if (!name || !age || !childClass || !gender) {
    return res.status(400).json({ error: 'Name, age, class, and gender are required.' });
  }

  // Generate unique serial number if not provided
  const lastChild = db.prepare('SELECT id FROM children ORDER BY id DESC LIMIT 1').get();
  const nextNum = lastChild ? lastChild.id + 1 : 1;
  const serial_no = req.body.serial_no || `SN-CH-${String(nextNum).padStart(3, '0')}`;

  const defaultPhoto = gender === 'Female'
    ? 'https://images.unsplash.com/photo-1595454223600-91fbdd77e58b?auto=format&fit=crop&w=300&q=80'
    : 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=300&q=80';

  const result = db.prepare(`
    INSERT INTO children (serial_no, name, age, class, gender, admission_date, photo, guardian_name, guardian_phone, guardian_address, medical_notes, hobbies)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    serial_no,
    name,
    parseInt(age),
    childClass,
    gender,
    admission_date || new Date().toISOString().split('T')[0],
    photo || defaultPhoto,
    guardian_name || '',
    guardian_phone || '',
    guardian_address || '',
    medical_notes || 'Normal routine checks.',
    hobbies || 'Sports, Art, Reading'
  );

  const newChild = db.prepare('SELECT * FROM children WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newChild);
});

// PUT update child (Admin)
router.put('/:id', authenticateToken, (req, res) => {
  const { serial_no, name, age, class: childClass, gender, admission_date, photo, guardian_name, guardian_phone, guardian_address, medical_notes, hobbies } = req.body;

  db.prepare(`
    UPDATE children
    SET serial_no = ?, name = ?, age = ?, class = ?, gender = ?, admission_date = ?, photo = ?, guardian_name = ?, guardian_phone = ?, guardian_address = ?, medical_notes = ?, hobbies = ?
    WHERE id = ?
  `).run(
    serial_no,
    name,
    parseInt(age),
    childClass,
    gender,
    admission_date,
    photo,
    guardian_name,
    guardian_phone,
    guardian_address,
    medical_notes,
    hobbies,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM children WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE child (Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM children WHERE id = ?').run(req.params.id);
  res.json({ message: 'Child record deleted successfully.' });
});

export default router;
