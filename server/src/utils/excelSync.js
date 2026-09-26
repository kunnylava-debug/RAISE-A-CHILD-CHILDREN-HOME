import * as XLSX from 'xlsx';
import db from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const EXCEL_PATH = path.join(uploadsDir, 'children_records.xlsx');
const CSV_PATH = path.join(uploadsDir, 'children_records.csv');

/**
 * Generates and saves an up-to-date Excel (.xlsx) and CSV (.csv) file
 * containing all active children records.
 */
export function generateChildrenExcel(isAuthorized = true) {
  const children = db.prepare(`
    SELECT serial_no, name, age, gender, class, admission_date, 
           guardian_name, guardian_phone, guardian_address, medical_notes, hobbies
    FROM children 
    WHERE is_active = 1 
    ORDER BY id ASC
  `).all();

  const headers = [
    'S.No',
    'Serial ID',
    'Full Name',
    'Age',
    'Gender',
    'Class / Grade',
    'Admission Date',
    'Guardian / Parent Name',
    'Guardian Phone',
    'Address / Native Place',
    'Medical & Health Notes',
    'Hobbies & Talents'
  ];

  const dataRows = children.map((c, idx) => [
    idx + 1,
    c.serial_no || `SN-CH-${String(idx + 1).padStart(3, '0')}`,
    c.name || '',
    c.age || '',
    c.gender || '',
    c.class || '',
    c.admission_date || '',
    isAuthorized ? (c.guardian_name || '') : 'Protected (Admin Only)',
    isAuthorized ? (c.guardian_phone || '') : 'Protected',
    isAuthorized ? (c.guardian_address || '') : 'Protected',
    isAuthorized ? (c.medical_notes || '') : 'Confidential',
    c.hobbies || ''
  ]);

  const aoaData = [headers, ...dataRows];
  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 6 },   // S.No
    { wch: 14 },  // Serial ID
    { wch: 24 },  // Full Name
    { wch: 8 },   // Age
    { wch: 10 },  // Gender
    { wch: 16 },  // Class
    { wch: 16 },  // Admission Date
    { wch: 25 },  // Guardian Name
    { wch: 18 },  // Guardian Phone
    { wch: 32 },  // Address
    { wch: 28 },  // Medical Notes
    { wch: 28 }   // Hobbies
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Children Directory');

  // Write Excel file (.xlsx)
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  fs.writeFileSync(EXCEL_PATH, excelBuffer);

  // Write CSV file (.csv)
  const csvData = XLSX.utils.sheet_to_csv(worksheet);
  fs.writeFileSync(CSV_PATH, csvData, 'utf8');

  return {
    excelPath: EXCEL_PATH,
    csvPath: CSV_PATH,
    buffer: excelBuffer,
    csvData: csvData,
    count: children.length,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Triggers background webhook push to Google Sheets (via Google Apps Script Web App)
 * whenever a child is added or updated.
 */
export async function pushChildToGoogleSheetWebhook(childData, action = 'add_child') {
  try {
    const webhookSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('children_google_sheet_webhook_url');
    const webhookUrl = webhookSetting ? webhookSetting.value : null;

    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return { skipped: true, reason: 'No webhook URL configured' };
    }

    const payload = {
      action,
      serial_no: childData.serial_no || '',
      name: childData.name || '',
      age: childData.age || '',
      gender: childData.gender || '',
      class: childData.class || '',
      admission_date: childData.admission_date || '',
      guardian_name: childData.guardian_name || '',
      guardian_phone: childData.guardian_phone || '',
      guardian_address: childData.guardian_address || '',
      medical_notes: childData.medical_notes || '',
      hobbies: childData.hobbies || '',
      timestamp: new Date().toISOString()
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    return { success: true, status: res.status, response: text };
  } catch (err) {
    console.error('Google Sheet Webhook push error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Imports/syncs children from the public Google Sheet export URL (CSV)
 */
export async function syncFromGoogleSheet(sheetUrl) {
  // Extract spreadsheet ID if full URL provided
  const match = sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = match ? match[1] : sheetUrl;
  const csvExportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;

  const response = await fetch(csvExportUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet CSV: HTTP ${response.status}`);
  }

  const csvText = await response.text();
  if (!csvText || csvText.trim().length === 0) {
    return { added: 0, message: 'Google Sheet is currently empty (0 rows).' };
  }

  const workbook = XLSX.read(csvText, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) {
    return { added: 0, message: 'No data rows found in Google Sheet.' };
  }

  let addedCount = 0;
  const insertStmt = db.prepare(`
    INSERT INTO children (serial_no, name, age, class, gender, admission_date, photo, guardian_name, guardian_phone, guardian_address, medical_notes, hobbies)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const existingSerials = new Set(
    db.prepare('SELECT serial_no FROM children WHERE is_active = 1').all().map(r => r.serial_no?.toLowerCase().trim())
  );
  const existingNames = new Set(
    db.prepare('SELECT name FROM children WHERE is_active = 1').all().map(r => r.name?.toLowerCase().trim())
  );

  for (const row of rows) {
    // Recognize various possible column names
    const name = row['Full Name'] || row['Name'] || row['Child Name'] || row['name'] || '';
    if (!name.trim()) continue;

    const serial = (row['Serial ID'] || row['Serial No'] || row['serial_no'] || '').trim();
    const age = parseInt(row['Age'] || row['age']) || 10;
    const gender = (row['Gender'] || row['gender'] || 'Male').trim();
    const childClass = row['Class / Grade'] || row['Class'] || row['class'] || 'Class 5';
    const admissionDate = row['Admission Date'] || row['admission_date'] || new Date().toISOString().split('T')[0];
    const guardianName = row['Guardian / Parent Name'] || row['Guardian Name'] || row['guardian_name'] || '';
    const guardianPhone = row['Guardian Phone'] || row['guardian_phone'] || '';
    const guardianAddress = row['Address / Native Place'] || row['Guardian Address'] || row['guardian_address'] || '';
    const medicalNotes = row['Medical & Health Notes'] || row['Medical Notes'] || row['medical_notes'] || 'Normal routine checks.';
    const hobbies = row['Hobbies & Talents'] || row['Hobbies'] || row['hobbies'] || 'Reading, Sports';

    const defaultPhoto = gender.toLowerCase() === 'female'
      ? 'https://images.unsplash.com/photo-1595454223600-91fbdd77e58b?auto=format&fit=crop&w=300&q=80'
      : 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=300&q=80';

    // Avoid duplicates by serial or name
    if (serial && existingSerials.has(serial.toLowerCase())) continue;
    if (existingNames.has(name.toLowerCase())) continue;

    const lastChildRow = db.prepare('SELECT id FROM children ORDER BY id DESC LIMIT 1').get();
    const nextId = (lastChildRow ? lastChildRow.id : 0) + 1;
    const finalSerial = serial || `SN-CH-${String(nextId).padStart(3, '0')}`;

    insertStmt.run(
      finalSerial,
      name,
      age,
      childClass,
      gender,
      admissionDate,
      defaultPhoto,
      guardianName,
      guardianPhone,
      guardianAddress,
      medicalNotes,
      hobbies
    );

    existingSerials.add(finalSerial.toLowerCase());
    existingNames.add(name.toLowerCase());
    addedCount++;
  }

  // Re-generate Excel file with new synced records
  generateChildrenExcel();

  return {
    added: addedCount,
    totalInSheet: rows.length,
    message: `Imported ${addedCount} new children from Google Sheet.`
  };
}

export { EXCEL_PATH, CSV_PATH };
