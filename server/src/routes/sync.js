import express from 'express';
import { handleSyncConnection, broadcastSyncEvent } from '../services/syncService.js';

const router = express.Router();

// GET /api/sync/events - SSE Stream for real-time multi-device sync
router.get('/events', (req, res) => {
  handleSyncConnection(req, res);
});

// POST /api/sync/ping - Trigger manual sync ping across devices
router.post('/ping', (req, res) => {
  const { event = 'PING', payload = {} } = req.body;
  broadcastSyncEvent({ type: event, data: payload });
  res.json({ success: true, timestamp: Date.now() });
});

export default router;
