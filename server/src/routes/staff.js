import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import * as XLSX from 'xlsx';

const router = express.Router();

// GET all staff members
router.get('/', (req, res) => {
  const staff = db.prepare('SELECT * FROM staff ORDER BY order_num ASC, id ASC').all();
  res.json(staff);
});

// GET /api/staff/export/excel - Direct Excel download (.xlsx)
router.get('/export/excel', (req, res) => {
  try {
    const staff = db.prepare('SELECT * FROM staff ORDER BY order_num ASC, id ASC').all();
    const headers = [
      'S.No', 'Full Name', 'Role / Designation', 'Mobile Number', 'Email Address', 
      'Qualification', 'Experience', 'Responsibilities / Description', 'Display Order'
    ];
    const dataRows = staff.map((s, idx) => [
      idx + 1,
      s.name || '',
      s.role || '',
      s.mobile || '',
      s.email || '',
      s.qualification || '',
      s.experience || '',
      s.description || '',
      s.order_num || (idx + 1)
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    worksheet['!cols'] = [
      { wch: 6 }, { wch: 25 }, { wch: 22 }, { wch: 18 }, 
      { wch: 28 }, { wch: 24 }, { wch: 20 }, { wch: 40 }, { wch: 14 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff Directory');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="RISE_A_CHILD_Staff_Directory.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate staff Excel file: ' + err.message });
  }
});

// GET /api/staff/export/csv - Direct CSV download (.csv)
router.get('/export/csv', (req, res) => {
  try {
    const staff = db.prepare('SELECT * FROM staff ORDER BY order_num ASC, id ASC').all();
    const headers = [
      'S.No', 'Full Name', 'Role / Designation', 'Mobile Number', 'Email Address', 
      'Qualification', 'Experience', 'Responsibilities / Description', 'Display Order'
    ];
    const dataRows = staff.map((s, idx) => [
      idx + 1,
      s.name || '',
      s.role || '',
      s.mobile || '',
      s.email || '',
      s.qualification || '',
      s.experience || '',
      s.description || '',
      s.order_num || (idx + 1)
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const csvData = XLSX.utils.sheet_to_csv(worksheet);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="RISE_A_CHILD_Staff_Directory.csv"');
    res.send('\uFEFF' + csvData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate staff CSV file: ' + err.message });
  }
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
    photo ? photo.trim() : '',
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
  `).run(name, role, mobile, email, qualification, experience, description, photo ? photo.trim() : '', order_num || 0, req.params.id);

  const updated = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE staff (Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
  res.json({ message: 'Staff member removed successfully.' });
});

export default router;
