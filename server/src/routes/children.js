import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth.js';
import { 
  generateChildrenExcel, 
  pushChildToGoogleSheetWebhook, 
  syncFromGoogleSheet, 
  EXCEL_PATH, 
  CSV_PATH 
} from '../utils/excelSync.js';
import { sendExcelBackupToAdmin } from '../services/notificationService.js';
import { broadcastSyncEvent } from '../services/syncService.js';
import fs from 'fs';

const router = express.Router();

// Initialize Excel and CSV file on load
try {
  generateChildrenExcel();
} catch (e) {
  console.warn('Initial Excel generation:', e.message);
}

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

// GET /api/children/export/excel - Direct Excel download (.xlsx) (Protected / Admin Only)
router.get('/export/excel', (req, res) => {
  let token = req.query.token;
  if (!token && req.headers['authorization']) {
    token = req.headers['authorization'].split(' ')[1];
  }
  
  const authorized = isAuthorized({ headers: { authorization: token ? `Bearer ${token}` : undefined } });
  if (!authorized) {
    return res.status(401).json({ 
      error: 'Access Denied: Children directory download is private and only accessible to authorized hostel administrators.' 
    });
  }

  try {
    const { buffer } = generateChildrenExcel(true);
    
    // Automatically archive & dispatch copy to official email pn9059491777@gmail.com
    sendExcelBackupToAdmin({
      buffer,
      filename: 'RISE_A_CHILD_Children_Records.xlsx',
      reportType: 'Resident Children Dossier (Downloaded)'
    }).catch(err => console.warn('[EXCEL EMAIL DISPATCH WARN]', err.message));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="RISE_A_CHILD_Children_Records.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate Excel file: ' + err.message });
  }
});

// POST /api/children/export/email - Dispatch Excel records directly to pn9059491777@gmail.com
router.post('/export/email', (req, res) => {
  const authorized = isAuthorized(req);
  if (!authorized) {
    return res.status(401).json({ 
      error: 'Access Denied: Only authorized hostel administrators can trigger email dispatch.' 
    });
  }

  try {
    const { buffer } = generateChildrenExcel(true);
    sendExcelBackupToAdmin({
      buffer,
      filename: 'RISE_A_CHILD_Children_Records.xlsx',
      reportType: 'Resident Children Dossier'
    }).then(result => {
      res.json({
        success: true,
        message: 'Excel spreadsheet has been dispatched directly to ' + result.recipient,
        recipient: result.recipient
      });
    }).catch(err => {
      res.status(500).json({ error: 'Failed to email Excel file: ' + err.message });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate Excel file: ' + err.message });
  }
});

// GET /api/children/export/csv - Direct CSV download (.csv) (Protected / Admin Only)
router.get('/export/csv', (req, res) => {
  let token = req.query.token;
  if (!token && req.headers['authorization']) {
    token = req.headers['authorization'].split(' ')[1];
  }
  
  const authorized = isAuthorized({ headers: { authorization: token ? `Bearer ${token}` : undefined } });
  if (!authorized) {
    return res.status(401).json({ 
      error: 'Access Denied: Children directory download is private and only accessible to authorized hostel administrators.' 
    });
  }

  try {
    const { csvData } = generateChildrenExcel(true);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="RISE_A_CHILD_Children_Records.csv"');
    res.send(csvData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate CSV file: ' + err.message });
  }
});

// GET /api/children/sheet-info - Sheet metadata and connected Google Sheet URL (Protected)
router.get('/sheet-info', (req, res) => {
  const authorized = isAuthorized(req);
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM children WHERE is_active = 1').get().count;

  if (!authorized) {
    return res.json({
      is_authorized: false,
      total_records: totalCount,
      google_sheet_url: null,
      is_webhook_active: false
    });
  }

  const sheetSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('children_google_sheet_url');
  const webhookSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('children_google_sheet_webhook_url');

  const defaultSheetUrl = 'https://docs.google.com/spreadsheets/d/1AiMYO2hMBAXqsWw4R0MZPB_On7-CHIvzxTiiidNrBcQ/edit?usp=sharing';
  const googleSheetUrl = sheetSetting?.value || defaultSheetUrl;
  const webhookUrl = webhookSetting?.value || '';

  let excelStats = null;
  if (fs.existsSync(EXCEL_PATH)) {
    const stat = fs.statSync(EXCEL_PATH);
    excelStats = {
      size: stat.size,
      last_modified: stat.mtime
    };
  }

  res.json({
    is_authorized: true,
    google_sheet_url: googleSheetUrl,
    webhook_url: webhookUrl,
    is_webhook_active: Boolean(webhookUrl && webhookUrl.startsWith('http')),
    total_records: totalCount,
    excel_file: '/uploads/children_records.xlsx',
    csv_file: '/uploads/children_records.csv',
    excel_stats: excelStats
  });
});

// POST /api/children/sync-google-sheet - Sync & import records from the Google Sheet
router.post('/sync-google-sheet', authenticateToken, async (req, res) => {
  try {
    const sheetSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('children_google_sheet_url');
    const defaultSheetUrl = 'https://docs.google.com/spreadsheets/d/1AiMYO2hMBAXqsWw4R0MZPB_On7-CHIvzxTiiidNrBcQ/edit?usp=sharing';
    const sheetUrl = req.body?.sheet_url || sheetSetting?.value || defaultSheetUrl;

    const result = await syncFromGoogleSheet(sheetUrl);
    const updatedCount = db.prepare('SELECT COUNT(*) as count FROM children WHERE is_active = 1').get().count;

    broadcastSyncEvent({
      type: 'CHILDREN_UPDATED',
      action: 'GOOGLE_SHEET_SYNC',
      count: result.added
    });

    res.json({
      success: true,
      message: result.message,
      added_count: result.added,
      total_children: updatedCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Google Sheet Sync failed: ' + err.message });
  }
});

// POST /api/children/setup-google-sheet-webhook - Configure Apps Script webhook
router.post('/setup-google-sheet-webhook', authenticateToken, (req, res) => {
  const { webhook_url, google_sheet_url } = req.body;
  const insertOrReplace = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

  if (webhook_url !== undefined) {
    insertOrReplace.run('children_google_sheet_webhook_url', webhook_url.trim());
  }
  if (google_sheet_url !== undefined) {
    insertOrReplace.run('children_google_sheet_url', google_sheet_url.trim());
  }

  res.json({ message: 'Google Sheet settings updated successfully.' });
});

// Helper to parse RFC4180 CSV text
function parseCsvRows(csvText) {
  const lines = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  const text = (csvText || '').replace(/^\uFEFF/, '');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c.length > 0)) lines.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c.length > 0)) lines.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) lines.push(currentRow);
  }

  return lines;
}

function normalizeCsvHeader(h) {
  const clean = (h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (['fullname', 'name', 'childname', 'studentname', 'student'].includes(clean)) return 'name';
  if (['age', 'years'].includes(clean)) return 'age';
  if (['gender', 'sex'].includes(clean)) return 'gender';
  if (['class', 'grade', 'classgrade', 'standard'].includes(clean)) return 'class';
  if (['admissiondate', 'admitteddate', 'dateofadmission', 'doadm'].includes(clean)) return 'admission_date';
  if (['guardianname', 'guardianparentname', 'parentname', 'fathername', 'guardian'].includes(clean)) return 'guardian_name';
  if (['guardianphone', 'phone', 'contactnumber', 'mobilenumber', 'mobile', 'parentphone'].includes(clean)) return 'guardian_phone';
  if (['guardianaddress', 'address', 'nativeplace', 'addressnativeplace', 'residence'].includes(clean)) return 'guardian_address';
  if (['medicalnotes', 'healthnotes', 'medicalhealthnotes', 'health', 'medical'].includes(clean)) return 'medical_notes';
  if (['hobbies', 'talents', 'hobbiestalents', 'interest'].includes(clean)) return 'hobbies';
  if (['serialid', 'serialno', 'serialnumber', 'id', 'sno'].includes(clean)) return 'serial_no';
  return clean;
}

// POST /api/children/import-csv - Validate and import student records from CSV
router.post('/import-csv', authenticateToken, async (req, res) => {
  try {
    const { csv_text, records } = req.body;
    let parsedRecords = [];
    const errors = [];

    if (Array.isArray(records) && records.length > 0) {
      parsedRecords = records;
    } else if (typeof csv_text === 'string' && csv_text.trim()) {
      const rows = parseCsvRows(csv_text.trim());
      if (rows.length < 2) {
        return res.status(400).json({ error: 'CSV file is empty or missing data rows.' });
      }

      const rawHeaders = rows[0];
      const headers = rawHeaders.map(normalizeCsvHeader);

      // Validate required columns
      const hasName = headers.includes('name');
      const hasAge = headers.includes('age');
      const hasGender = headers.includes('gender');
      const hasClass = headers.includes('class');

      if (!hasName || !hasAge || !hasGender || !hasClass) {
        const missing = [];
        if (!hasName) missing.push("'Full Name' or 'Name'");
        if (!hasAge) missing.push("'Age'");
        if (!hasGender) missing.push("'Gender'");
        if (!hasClass) missing.push("'Class'");
        return res.status(400).json({
          error: `CSV column validation failed. Missing required column(s): ${missing.join(', ')}. Found headers: [${rawHeaders.join(', ')}]`
        });
      }

      // Parse data rows
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowObj = {};
        headers.forEach((h, colIdx) => {
          rowObj[h] = row[colIdx] || '';
        });
        rowObj._rowNumber = i + 1; // 1-indexed Excel row
        parsedRecords.push(rowObj);
      }
    } else {
      return res.status(400).json({ error: 'Please provide CSV content or validated student records.' });
    }

    if (parsedRecords.length === 0) {
      return res.status(400).json({ error: 'No data rows found in the CSV.' });
    }

    // Row-by-row validation & preparation
    const validRows = [];
    let nextSerialNum = 1;
    const lastChild = db.prepare('SELECT id FROM children ORDER BY id DESC LIMIT 1').get();
    if (lastChild && lastChild.id) {
      nextSerialNum = lastChild.id + 1;
    }

    parsedRecords.forEach((item, idx) => {
      const lineNum = item._rowNumber || (idx + 2);
      const name = (item.name || '').trim();
      const ageRaw = item.age !== undefined ? String(item.age).trim() : '';
      const childClass = (item.class || '').trim();
      const genderRaw = (item.gender || '').trim();

      // Check name
      if (!name) {
        errors.push(`Row ${lineNum}: Child Full Name is required.`);
        return;
      }

      // Check age
      const age = parseInt(ageRaw, 10);
      if (isNaN(age) || age < 1 || age > 30) {
        errors.push(`Row ${lineNum} (${name}): Age "${ageRaw}" must be a valid number between 1 and 30.`);
        return;
      }

      // Check class
      if (!childClass) {
        errors.push(`Row ${lineNum} (${name}): Class/Grade is required.`);
        return;
      }

      // Normalize gender
      let gender = 'Male';
      if (/^f/i.test(genderRaw)) gender = 'Female';
      else if (/^o/i.test(genderRaw)) gender = 'Other';
      else if (/^m/i.test(genderRaw)) gender = 'Male';
      else gender = genderRaw || 'Male';

      const serial_no = item.serial_no && item.serial_no.startsWith('SN-CH-') 
        ? item.serial_no 
        : `SN-CH-${String(nextSerialNum++).padStart(3, '0')}`;

      validRows.push({
        serial_no,
        name,
        age,
        class: childClass,
        gender,
        admission_date: item.admission_date || new Date().toISOString().split('T')[0],
        photo: (item.photo || '').trim(),
        guardian_name: (item.guardian_name || '').trim(),
        guardian_phone: (item.guardian_phone || '').trim(),
        guardian_address: (item.guardian_address || '').trim(),
        medical_notes: item.medical_notes || 'Normal routine checks.',
        hobbies: item.hobbies || 'Sports, Art, Reading'
      });
    });

    if (validRows.length === 0) {
      return res.status(400).json({
        error: 'No valid student records could be imported from the CSV.',
        details: errors
      });
    }

    // Insert valid rows in a single atomic transaction
    const insertStmt = db.prepare(`
      INSERT INTO children (serial_no, name, age, class, gender, admission_date, photo, guardian_name, guardian_phone, guardian_address, medical_notes, hobbies)
      VALUES (@serial_no, @name, @age, @class, @gender, @admission_date, @photo, @guardian_name, @guardian_phone, @guardian_address, @medical_notes, @hobbies)
    `);

    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        insertStmt.run(row);
      }
    });

    insertMany(validRows);

    // Regenerate Excel and CSV backups
    try {
      generateChildrenExcel();
    } catch (err) {
      console.warn('Excel regeneration warn:', err.message);
    }

    // Real-time synchronization event across all connected devices
    broadcastSyncEvent({
      type: 'CHILDREN_UPDATED',
      action: 'CSV_IMPORT',
      count: validRows.length
    });

    res.json({
      success: true,
      imported_count: validRows.length,
      skipped_count: errors.length,
      errors: errors,
      message: `Successfully validated and imported ${validRows.length} student records into the database.${errors.length ? ` ${errors.length} row(s) were skipped due to formatting errors.` : ''}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to import CSV: ' + err.message });
  }
});

// GET single child
router.get('/:id', (req, res) => {
  const authorized = isAuthorized(req);
  const identifier = req.params.id;
  const num = parseInt(identifier, 10);
  const serialCandidate = !isNaN(num) ? `SN-CH-${String(num).padStart(3, '0')}` : identifier;
  const child = db.prepare('SELECT * FROM children WHERE id = ? OR serial_no = ? OR serial_no = ?').get(identifier, identifier, serialCandidate);
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
router.post('/', authenticateToken, async (req, res) => {
  const { name, age, class: childClass, gender, admission_date, photo, guardian_name, guardian_phone, guardian_address, medical_notes, hobbies } = req.body;
  if (!name || !age || !childClass || !gender) {
    return res.status(400).json({ error: 'Name, age, class, and gender are required.' });
  }

  // Generate unique serial number if not provided
  const lastChild = db.prepare('SELECT id FROM children ORDER BY id DESC LIMIT 1').get();
  const nextNum = lastChild ? lastChild.id + 1 : 1;
  const serial_no = req.body.serial_no || `SN-CH-${String(nextNum).padStart(3, '0')}`;

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
    photo ? photo.trim() : '',
    guardian_name || '',
    guardian_phone || '',
    guardian_address || '',
    medical_notes || 'Normal routine checks.',
    hobbies || 'Sports, Art, Reading'
  );

  const newChild = db.prepare('SELECT * FROM children WHERE id = ?').get(result.lastInsertRowid);

  // Automatically update the Excel form (.xlsx and .csv)
  try {
    generateChildrenExcel();
  } catch (err) {
    console.error('Failed to regenerate Excel file after adding child:', err);
  }

  // Asynchronously trigger Google Sheet Webhook if configured
  pushChildToGoogleSheetWebhook(newChild, 'add_child').catch(console.error);

  broadcastSyncEvent({ type: 'CHILDREN_UPDATED', action: 'CREATE', data: newChild });

  res.status(201).json({
    ...newChild,
    excel_synced: true,
    excel_url: '/uploads/children_records.xlsx'
  });
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
    photo ? photo.trim() : '',
    guardian_name,
    guardian_phone,
    guardian_address,
    medical_notes,
    hobbies,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM children WHERE id = ?').get(req.params.id);

  // Update Excel file
  try {
    generateChildrenExcel();
  } catch (err) {
    console.error('Failed to regenerate Excel file after update:', err);
  }

  // Push update to Google Sheet webhook
  pushChildToGoogleSheetWebhook(updated, 'update_child').catch(console.error);

  broadcastSyncEvent({ type: 'CHILDREN_UPDATED', action: 'UPDATE', data: updated });

  res.json(updated);
});

// DELETE child (Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM children WHERE id = ?').run(req.params.id);

  // Update Excel file
  try {
    generateChildrenExcel();
  } catch (err) {
    console.error('Failed to regenerate Excel file after delete:', err);
  }

  broadcastSyncEvent({ type: 'CHILDREN_UPDATED', action: 'DELETE', id: req.params.id });

  res.json({ message: 'Child record deleted successfully.' });
});

export default router;
