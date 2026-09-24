import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'hostel.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT NOT NULL,
      qualification TEXT,
      experience TEXT,
      description TEXT,
      photo TEXT,
      order_num INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS licence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      licence_no TEXT NOT NULL,
      licence_type TEXT NOT NULL,
      issuing_authority TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      status TEXT DEFAULT 'Active & Verified',
      document_url TEXT,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      class TEXT NOT NULL,
      gender TEXT NOT NULL,
      admission_date TEXT NOT NULL,
      photo TEXT,
      guardian_name TEXT,
      guardian_phone TEXT,
      guardian_address TEXT,
      medical_notes TEXT,
      hobbies TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS views_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      order_num INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS views_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      title TEXT,
      description TEXT,
      image_url TEXT NOT NULL,
      order_num INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(category_id) REFERENCES views_categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT,
      category TEXT,
      description TEXT,
      image_url TEXT NOT NULL,
      order_num INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_no TEXT UNIQUE NOT NULL,
      child_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      dob TEXT,
      class_applying TEXT NOT NULL,
      gender TEXT NOT NULL,
      address TEXT NOT NULL,
      guardian_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      photo_url TEXT,
      reason TEXT NOT NULL,
      hear_about TEXT,
      previous_school TEXT,
      status TEXT DEFAULT 'Pending',
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time_slot TEXT NOT NULL,
      activity TEXT NOT NULL,
      location_or_notes TEXT,
      icon_name TEXT DEFAULT 'Clock',
      order_num INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week TEXT UNIQUE NOT NULL,
      breakfast TEXT,
      lunch TEXT,
      snacks TEXT,
      dinner TEXT
    );

    CREATE TABLE IF NOT EXISTS needed_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity_needed INTEGER NOT NULL,
      quantity_received INTEGER DEFAULT 0,
      estimated_price INTEGER NOT NULL,
      urgency TEXT DEFAULT 'Medium',
      description TEXT,
      is_fulfilled INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS supporters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      occupation TEXT,
      support_type TEXT NOT NULL,
      photo_url TEXT,
      message TEXT,
      date_supported TEXT
    );

    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no TEXT UNIQUE NOT NULL,
      donor_name TEXT NOT NULL,
      donor_phone TEXT,
      donor_email TEXT,
      amount INTEGER NOT NULL,
      payment_method TEXT DEFAULT 'UPI',
      transaction_ref TEXT,
      notes TEXT,
      needed_item_id INTEGER,
      item_name TEXT,
      quantity_donated INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alumni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      stay_years TEXT NOT NULL,
      current_position TEXT NOT NULL,
      location TEXT,
      photo_url TEXT,
      quote TEXT,
      order_num INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure donation columns exist if table was already created
  try {
    db.exec(`ALTER TABLE donations ADD COLUMN needed_item_id INTEGER`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE donations ADD COLUMN item_name TEXT`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE donations ADD COLUMN quantity_donated INTEGER DEFAULT 1`);
  } catch (e) {}

  // Ensure admission notification tracking columns exist
  try {
    db.exec(`ALTER TABLE admissions ADD COLUMN notification_sent_at TEXT`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE admissions ADD COLUMN notification_type TEXT`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE admissions ADD COLUMN notification_status TEXT`);
  } catch (e) {}
}

export default db;
