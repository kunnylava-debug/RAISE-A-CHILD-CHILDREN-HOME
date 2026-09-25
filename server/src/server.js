import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { seedData } from './seed.js';

import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import staffRoutes from './routes/staff.js';
import licenceRoutes from './routes/licence.js';
import childrenRoutes from './routes/children.js';
import viewsRoutes from './routes/views.js';
import eventsRoutes from './routes/events.js';
import admissionsRoutes from './routes/admissions.js';
import timetableRoutes from './routes/timetable.js';
import menuRoutes from './routes/menu.js';
import neededRoutes from './routes/needed.js';
import supportersRoutes from './routes/supporters.js';
import donationsRoutes from './routes/donations.js';
import uploadRoutes from './routes/upload.js';
import alumniRoutes from './routes/alumni.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize and seed database if not already done
seedData();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads folder
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/licence', licenceRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/views', viewsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/admissions', admissionsRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/needed', neededRoutes);
app.use('/api/supporters', supportersRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/alumni', alumniRoutes);

// Serve frontend dist build if present
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred.'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RAISE A CHILD CHILDREN HOME Backend & Web App running on:`);
  console.log(`  - Local:   http://localhost:${PORT}`);
  console.log(`  - Network: http://192.168.1.53:${PORT}`);
});

