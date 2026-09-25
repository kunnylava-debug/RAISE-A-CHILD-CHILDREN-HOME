import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import db, { initDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readData(filename) {
  const fullPath = path.join(__dirname, 'data', filename);
  let raw = fs.readFileSync(fullPath, 'utf-8');
  if (raw.charCodeAt(0) === 0xFEFF) {
    raw = raw.slice(1);
  }
  return JSON.parse(raw);
}

export function seedData() {
  initDatabase();

  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    db.prepare('INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
    console.log('Seeded default admin user: admin / admin123');
  }

  const settingsData = readData('settings.json');
  const rulesData = readData('rules.json');
  const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  
  for (const [k, v] of Object.entries(settingsData)) {
    insertSetting.run(k, v);
  }
  insertSetting.run('instructions_dos', JSON.stringify(rulesData.dos));
  insertSetting.run('instructions_donts', JSON.stringify(rulesData.donts));

  const existingLicence = db.prepare('SELECT id FROM licence LIMIT 1').get();
  if (!existingLicence) {
    db.prepare(`
      INSERT INTO licence (licence_no, licence_type, issuing_authority, issue_date, expiry_date, status, document_url, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'WB-CW-2022/4190-R',
      'Child Care Institution & Residential Hostel Licence (JJ Act 2015)',
      'Department of Women & Child Development and Social Welfare, Govt. of West Bengal',
      '2022-04-12',
      '2029-04-11',
      'Active & Verified',
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
      'Hostel is fully inspected, accredited, and verified compliant with all child safety norms, building codes, sanitation standards, and annual government audits.'
    );
  }

  // Views categories initialized without dummy photos
  const catCount = db.prepare('SELECT COUNT(*) as count FROM views_categories').get().count;
  if (catCount === 0) {
    const categoriesData = readData('categories_and_photos.json');
    const insertCat = db.prepare('INSERT INTO views_categories (slug, name, description, order_num) VALUES (?, ?, ?, ?)');
    for (const c of categoriesData) {
      insertCat.run(c.slug, c.name, c.desc, c.order_num);
    }
  }

  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  if (eventCount === 0) {
    const eventsData = readData('events.json');
    const insertEvent = db.prepare('INSERT INTO events (title, date, category, description, image_url, order_num) VALUES (?, ?, ?, ?, ?, ?)');
    for (const e of eventsData) {
      insertEvent.run(e.title, e.date, e.category, e.description, e.image_url, e.order_num);
    }
  }

  const timeMenuData = readData('timetable_and_menu.json');
  const timetableCount = db.prepare('SELECT COUNT(*) as count FROM timetable').get().count;
  if (timetableCount === 0) {
    const insertTime = db.prepare('INSERT INTO timetable (time_slot, activity, location_or_notes, icon_name, order_num) VALUES (?, ?, ?, ?, ?)');
    for (const r of timeMenuData.timetable) {
      insertTime.run(r.time_slot, r.activity, r.location_or_notes, r.icon_name, r.order_num);
    }
  }

  const menuCount = db.prepare('SELECT COUNT(*) as count FROM menu').get().count;
  if (menuCount === 0) {
    const insertMenu = db.prepare('INSERT INTO menu (day_of_week, breakfast, lunch, snacks, dinner) VALUES (?, ?, ?, ?, ?)');
    for (const m of timeMenuData.menu) {
      insertMenu.run(m.day, m.breakfast, m.lunch, m.snacks, m.dinner);
    }
  }

  const neededSuppData = readData('needed_and_supporters.json');
  const neededCount = db.prepare('SELECT COUNT(*) as count FROM needed_items').get().count;
  if (neededCount === 0) {
    const insertNeed = db.prepare('INSERT INTO needed_items (item_name, category, quantity_needed, quantity_received, estimated_price, urgency, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const n of neededSuppData.needed_items) {
      insertNeed.run(n.item_name, n.category, n.quantity_needed, n.quantity_received, n.estimated_price, n.urgency, n.description);
    }
  }

  const suppCount = db.prepare('SELECT COUNT(*) as count FROM supporters').get().count;
  if (suppCount === 0) {
    const insertSupp = db.prepare('INSERT INTO supporters (name, occupation, support_type, photo_url, message, date_supported) VALUES (?, ?, ?, ?, ?, ?)');
    for (const sp of neededSuppData.supporters) {
      insertSupp.run(sp.name, sp.occupation, sp.support_type, sp.photo_url, sp.message, sp.date_supported);
    }
  }

  const admCount = db.prepare('SELECT COUNT(*) as count FROM admissions').get().count;
  if (admCount === 0) {
    const insertAdm = db.prepare(`
      INSERT INTO admissions (app_no, child_name, age, dob, class_applying, gender, address, guardian_name, phone, email, photo_url, reason, hear_about, previous_school, status, admin_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAdm.run(
      'ADM-2026-0041', 'Rahul Karmakar', 10, '2016-03-12', 'Class 5', 'Male',
      'Vill. Kalinarayanpur, P.O. Taherpur, Dist. Nadia', 'Bimal Karmakar (Uncle)', '+91 98321 45678', 'bimal.karmakar@gmail.com',
      'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=300&q=80',
      'Single parent family needing residential schooling support.', 'Referred by Local Panchayat', 'Taherpur Primary School',
      'Under Review', 'Interview scheduled with Superintendent'
    );
    insertAdm.run(
      'ADM-2026-0042', 'Mitali Sardar', 12, '2014-08-25', 'Class 7', 'Female',
      'Vill. Gosaba, South 24 Parganas', 'Padma Sardar (Mother)', '+91 98321 89012', 'padma.sardar@yahoo.com',
      'https://images.unsplash.com/photo-1595454223600-91fbdd77e58b?auto=format&fit=crop&w=300&q=80',
      'Child is keen on studies and drawing; seeking hostel stay.', 'Alumni Community', 'Gosaba Girls High School',
      'Pending', 'Application received online.'
    );
  }

  const donCount = db.prepare('SELECT COUNT(*) as count FROM donations').get().count;
  if (donCount === 0) {
    const insertDon = db.prepare('INSERT INTO donations (receipt_no, donor_name, donor_phone, donor_email, amount, payment_method, transaction_ref, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertDon.run('REC-2026-108', 'Alok Kumar Sen', '+91 98300 12345', 'alok.sen@gmail.com', 15000, 'UPI', 'UPI/409823412984', 'For winter uniforms and books');
    insertDon.run('REC-2026-109', 'Nandini Dasgupta', '+91 98300 67890', 'nandini.d@gmail.com', 5000, 'Google Pay', 'GPAY-839120938', 'Festive sweets for children');
  }


  console.log('Database seeded successfully with all realistic records!');
}

if (process.argv[1] && process.argv[1].includes('seed.js')) {
  seedData();
  process.exit(0);
}
