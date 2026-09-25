import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { dispatchAdmissionNotification, formatAdmissionMessage } from '../services/notificationService.js';

const router = express.Router();

// GET all admissions (Admin only)
router.get('/', authenticateToken, (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM admissions WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (child_name LIKE ? OR app_no LIKE ? OR guardian_name LIKE ? OR phone LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY id DESC';
  const rows = db.prepare(query).all(...params);

  // Statistics
  const pendingCount = db.prepare("SELECT COUNT(*) as count FROM admissions WHERE status = 'Pending'").get().count;
  const reviewCount = db.prepare("SELECT COUNT(*) as count FROM admissions WHERE status = 'Under Review'").get().count;
  const acceptedCount = db.prepare("SELECT COUNT(*) as count FROM admissions WHERE status = 'Accepted'").get().count;
  const rejectedCount = db.prepare("SELECT COUNT(*) as count FROM admissions WHERE status = 'Rejected'").get().count;

  res.json({
    applications: rows,
    stats: {
      total: rows.length,
      pending: pendingCount,
      under_review: reviewCount,
      accepted: acceptedCount,
      rejected: rejectedCount
    }
  });
});

// POST submit admission application (Public)
router.post('/', (req, res) => {
  const { child_name, age, dob, class_applying, gender, address, guardian_name, phone, email, photo_url, reason, hear_about, previous_school } = req.body;

  if (!child_name || !age || !class_applying || !gender || !address || !guardian_name || !phone || !reason) {
    return res.status(400).json({ error: 'Please fill in all mandatory fields.' });
  }

  // Generate unique application number
  const count = db.prepare('SELECT COUNT(*) as c FROM admissions').get().c;
  const app_no = `ADM-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const result = db.prepare(`
    INSERT INTO admissions (app_no, child_name, age, dob, class_applying, gender, address, guardian_name, phone, email, photo_url, reason, hear_about, previous_school, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
  `).run(
    app_no,
    child_name,
    parseInt(age),
    dob || '',
    class_applying,
    gender,
    address,
    guardian_name,
    phone,
    email || '',
    photo_url || '',
    reason,
    hear_about || 'Website',
    previous_school || ''
  );

  const newApp = db.prepare('SELECT * FROM admissions WHERE id = ?').get(result.lastInsertRowid);

  // Retrieve configured hostel email
  const hostelEmail = db.prepare("SELECT value FROM settings WHERE key = 'contact_email'").get()?.value || 'pn9059491777@gmail.com';

  console.log(`[EMAIL DISPATCH] New application ${app_no} received at RISE A CHILD CHILDREN HOME for ${child_name}`);

  res.status(201).json({
    success: true,
    message: 'Admission application submitted successfully.',
    application_number: app_no,
    email_notification_sent_to: hostelEmail,
    data: newApp
  });
});

// GET status check for public applicants
router.get('/track', (req, res) => {
  const { app_no, phone } = req.query;
  if (!app_no) {
    return res.status(400).json({ error: 'Please provide your Application Number (e.g. ADM-2026-0001).' });
  }

  let row = db.prepare('SELECT id, app_no, child_name, class_applying, guardian_name, phone, status, admin_notes, created_at, notification_sent_at FROM admissions WHERE app_no = ?').get(app_no.trim());
  if (row && phone) {
    const cleanReqPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanDbPhone = (row.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanReqPhone && cleanDbPhone && cleanReqPhone !== cleanDbPhone) {
      row = null;
    }
  }

  if (!row) {
    return res.status(404).json({ error: 'No matching application found. Please verify your Application Number and registered Phone.' });
  }

  res.json({
    success: true,
    application: row
  });
});

// PUT update status and trigger automated notification dispatch (Admin)
router.put('/:id/status', authenticateToken, async (req, res) => {
  const { status, admin_notes } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  db.prepare(`
    UPDATE admissions
    SET status = ?, admin_notes = ?
    WHERE id = ?
  `).run(status, admin_notes || '', req.params.id);

  const updated = db.prepare('SELECT * FROM admissions WHERE id = ?').get(req.params.id);

  if (!updated) {
    return res.status(404).json({ error: 'Application not found' });
  }

  // Trigger automated notification (Email + WhatsApp format generation)
  let dispatchResult = null;
  try {
    dispatchResult = await dispatchAdmissionNotification(updated, status, admin_notes || '');
  } catch (err) {
    console.error('Notification dispatch error:', err.message);
  }

  const finalRecord = db.prepare('SELECT * FROM admissions WHERE id = ?').get(req.params.id);

  res.json({
    ...finalRecord,
    notification_dispatch: dispatchResult
  });
});

// POST trigger manual notification dispatch (Admin)
router.post('/:id/notify', authenticateToken, async (req, res) => {
  const app = db.prepare('SELECT * FROM admissions WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found.' });

  const result = await dispatchAdmissionNotification(app, app.status, app.admin_notes || '');
  res.json({
    success: true,
    message: 'Notification generated successfully',
    data: result
  });
});

// DELETE application (Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM admissions WHERE id = ?').run(req.params.id);
  res.json({ message: 'Application deleted successfully.' });
});

export default router;
