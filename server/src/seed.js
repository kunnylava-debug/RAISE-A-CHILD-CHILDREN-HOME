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

  const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff').get().count;
  if (staffCount === 0) {
    const staffMembers = readData('staff.json');
    const insertStaff = db.prepare(`
      INSERT INTO staff (name, role, mobile, email, qualification, experience, description, photo, order_num)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of staffMembers) {
      insertStaff.run(s.name, s.role, s.mobile, s.email, s.qualification, s.experience, s.description, s.photo, s.order_num);
    }
  }

  const childrenCount = db.prepare('SELECT COUNT(*) as count FROM children').get().count;
  if (childrenCount === 0) {
    const insertChild = db.prepare(`
      INSERT INTO children (serial_no, name, age, class, gender, admission_date, photo, guardian_name, guardian_phone, guardian_address, medical_notes, hobbies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleFeatured = [
      { s: 'SN-CH-001', n: 'Aarav Sharma', a: 11, c: 'Class 6', g: 'Male', d: '2023-06-15', p: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=300&q=80', gn: 'Rajesh Sharma', gp: '+91 98765 43210', ga: 'Vill. Raipur, Dist. Bankura', mn: 'No known allergies. Routine immunizations complete.', h: 'Football, Drawing, Science models' },
      { s: 'SN-CH-002', n: 'Pooja Barman', a: 12, c: 'Class 7', g: 'Female', d: '2022-07-01', p: 'https://images.unsplash.com/photo-1595454223600-91fbdd77e58b?auto=format&fit=crop&w=300&q=80', gn: 'Maya Barman', gp: '+91 98765 43211', ga: 'Vill. Karimpur, Dist. Nadia', mn: 'Mild seasonal asthma, monitored with nurse.', h: 'Classical Dance, Reading, Gardening' },
      { s: 'SN-CH-003', n: 'Rohan Mondal', a: 9, c: 'Class 4', g: 'Male', d: '2024-01-10', p: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=300&q=80', gn: 'Subhash Mondal', gp: '+91 98765 43212', ga: 'P.O. Bethuadahari, Nadia', mn: 'Normal health. Enjoys milk and fruits.', h: 'Cricket, Clay modeling, Singing' },
      { s: 'SN-CH-004', n: 'Sneha Sarkar', a: 14, c: 'Class 9', g: 'Female', d: '2021-04-18', p: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', gn: 'Geeta Sarkar', gp: '+91 98765 43213', ga: 'Dist. Murshidabad', mn: 'Normal vision, healthy stamina.', h: 'Debating, Mathematics, Chess' },
      { s: 'SN-CH-005', n: 'Bikram Paul', a: 13, c: 'Class 8', g: 'Male', d: '2022-03-22', p: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80', gn: 'Alok Paul', gp: '+91 98765 43214', ga: 'Vill. Ranaghat, Nadia', mn: 'Excellent physical fitness.', h: 'Athletics, Sketching' },
      { s: 'SN-CH-006', n: 'Ananya Roy', a: 8, c: 'Class 3', g: 'Female', d: '2024-04-05', p: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=300&q=80', gn: 'Kabita Roy', gp: '+91 98765 43215', ga: 'P.O. Krishnanagar, Nadia', mn: 'Healthy child.', h: 'Poetry recitation, Origami' }
    ];

    for (const c of sampleFeatured) {
      insertChild.run(c.s, c.n, c.a, c.c, c.g, c.d, c.p, c.gn, c.gp, c.ga, c.mn, c.h);
    }

    const boyNames = ['Subham', 'Arjun', 'Manish', 'Kunal', 'Abhi', 'Ritwik', 'Debjit', 'Deepak', 'Samir', 'Pranab', 'Nikhil', 'Aniket'];
    const girlNames = ['Mousumi', 'Payel', 'Rumpa', 'Madhura', 'Debjani', 'Ishita', 'Koyel', 'Soma', 'Dipannita', 'Swati', 'Piu'];
    const surnames = ['Sen', 'Dutta', 'Halder', 'Seal', 'Banerjee', 'Chakraborty', 'Karmakar', 'Pramanik', 'Biswas', 'Pal', 'Roy'];

    for (let i = 7; i <= 120; i++) {
      const sNo = `SN-CH-${String(i).padStart(3, '0')}`;
      const isBoy = i % 2 === 1;
      const g = isBoy ? 'Male' : 'Female';
      const firstName = isBoy ? boyNames[i % boyNames.length] : girlNames[i % girlNames.length];
      const lastName = surnames[i % surnames.length];
      const age = 6 + (i % 11);
      const cls = `Class ${Math.min(10, Math.max(1, age - 5))}`;
      const photo = isBoy ? 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=300&q=80' : 'https://images.unsplash.com/photo-1595454223600-91fbdd77e58b?auto=format&fit=crop&w=300&q=80';

      insertChild.run(
        sNo,
        `${firstName} ${lastName}`,
        age,
        cls,
        g,
        '2023-08-01',
        photo,
        'Confidential Guardian',
        '+91 98765 XXXXX',
        'Confidential Address, West Bengal',
        'Routine health checkup normal.',
        'Academics, Outdoor Sports, Craft'
      );
    }
  }

  const catCount = db.prepare('SELECT COUNT(*) as count FROM views_categories').get().count;
  if (catCount === 0) {
    const categoriesData = readData('categories_and_photos.json');
    const insertCat = db.prepare('INSERT INTO views_categories (slug, name, description, order_num) VALUES (?, ?, ?, ?)');
    const insertPhoto = db.prepare('INSERT INTO views_photos (category_id, title, description, image_url, order_num) VALUES (?, ?, ?, ?, ?)');

    for (const c of categoriesData) {
      const res = insertCat.run(c.slug, c.name, c.desc, c.order_num);
      const catId = res.lastInsertRowid;
      c.photos.forEach((p, idx) => {
        insertPhoto.run(catId, p.title, p.desc, p.url, idx + 1);
      });
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

  const alumniCount = db.prepare('SELECT COUNT(*) as count FROM alumni').get().count;
  if (alumniCount === 0) {
    const alumniData = readData('alumni.json');
    const insertAlumni = db.prepare(`
      INSERT INTO alumni (name, stay_years, current_position, location, photo_url, quote, order_num)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const a of alumniData) {
      insertAlumni.run(a.name, a.stay_years, a.current_position, a.location, a.photo_url, a.quote, a.order_num);
    }
    console.log('Seeded alumni success stories');
  }

  console.log('Database seeded successfully with all realistic records!');
}

if (process.argv[1] && process.argv[1].includes('seed.js')) {
  seedData();
  process.exit(0);
}
