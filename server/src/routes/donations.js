import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { broadcastSyncEvent } from '../services/syncService.js';
import { getHostelSettings } from '../services/notificationService.js';

const router = express.Router();

// Helper to notify admin on new donation or pledge
async function notifyAdminNewDonation(donation) {
  try {
    const isPledge = donation.entry_type === 'Pledge';
    const recipient = 'pn9059491777@gmail.com';
    const subject = isPledge
      ? `🤝 New Pledge Received: ${donation.receipt_no} from ${donation.donor_name}`
      : `❤️ New Donation Recorded: ${donation.receipt_no} (₹${donation.amount}) from ${donation.donor_name}`;

    const params = new URLSearchParams();
    params.append('_subject', subject);
    params.append('receipt_no', donation.receipt_no);
    params.append('entry_type', donation.entry_type || 'Direct Donation');
    params.append('donor_name', donation.donor_name);
    params.append('donor_phone', donation.donor_phone || 'Not provided');
    params.append('donor_email', donation.donor_email || 'Not provided');
    params.append('amount', `₹${donation.amount}`);
    params.append('status', donation.status || 'Confirmed');
    if (donation.item_name) params.append('target_need_item', donation.item_name);
    if (donation.quantity_donated) params.append('quantity_units', String(donation.quantity_donated));
    params.append('timestamp', donation.created_at || new Date().toISOString());

    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    console.log(`[DONATION NOTIFICATION DISPATCHED] Sent to ${recipient}`);
  } catch (err) {
    console.warn('[DONATION NOTIFICATION WARN]', err.message);
  }
}

function getMonthlyBreakdown(donations) {
  const map = new Map();
  for (const d of donations) {
    if (d.status === 'Cancelled') continue;
    const dateObj = new Date(d.created_at || Date.now());
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;
    const monthLabel = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    if (!map.has(monthKey)) {
      map.set(monthKey, {
        month_key: monthKey,
        month_label: monthLabel,
        year,
        month_num: dateObj.getMonth() + 1,
        total_amount: 0,
        direct_amount: 0,
        pledge_amount: 0,
        donors_count: 0,
        donations: []
      });
    }

    const group = map.get(monthKey);
    const amt = Number(d.amount) || 0;
    group.total_amount += amt;
    if (d.entry_type === 'Pledge') {
      group.pledge_amount += amt;
    } else {
      group.direct_amount += amt;
    }
    group.donors_count += 1;
    group.donations.push(d);
  }

  return Array.from(map.values()).sort((a, b) => b.month_key.localeCompare(a.month_key));
}

// GET all donations (with total & monthly breakdown)
router.get('/', (req, res) => {
  const donations = db.prepare(`
    SELECT d.*, 
      n.item_name as linked_need_title, 
      n.quantity_needed as linked_need_total, 
      n.quantity_received as linked_need_current, 
      n.is_fulfilled as linked_need_fulfilled
    FROM donations d
    LEFT JOIN needed_items n ON d.needed_item_id = n.id
    ORDER BY d.id DESC
  `).all();
  
  const totalAmount = db.prepare("SELECT SUM(amount) as total FROM donations WHERE status != 'Cancelled'").get().total || 0;
  const count = db.prepare('SELECT COUNT(*) as count FROM donations').get().count || 0;
  const monthlyBreakdown = getMonthlyBreakdown(donations);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthStats = monthlyBreakdown.find(m => m.month_key === currentMonthKey) || {
    month_key: currentMonthKey,
    month_label: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    total_amount: 0,
    direct_amount: 0,
    pledge_amount: 0,
    donors_count: 0
  };

  res.json({
    donations,
    total_donations_amount: totalAmount,
    total_count: count,
    current_month: currentMonthStats,
    monthly_breakdown: monthlyBreakdown
  });
});

// POST record donation/pledge (Public)
router.post('/', (req, res) => {
  const { 
    donor_name, donor_phone, donor_email, amount, 
    payment_method, transaction_ref, notes, 
    needed_item_id, item_name, quantity_donated,
    entry_type: requestedEntryType
  } = req.body;

  if (!donor_name || amount === undefined) {
    return res.status(400).json({ error: 'Donor name and amount are required.' });
  }

  const isPledge = requestedEntryType === 'Pledge' || 
    payment_method === 'Pledge' || 
    payment_method === 'Pledge Commitment' || 
    String(notes || '').toLowerCase().includes('pledge');

  const entry_type = isPledge ? 'Pledge' : 'Direct Donation';
  const status = isPledge ? 'Pledged (Pending Admin Confirmation)' : 'Confirmed';

  const count = db.prepare('SELECT COUNT(*) as count FROM donations').get().count;
  const prefix = isPledge ? 'PLG' : 'REC';
  const receipt_no = `${prefix}-${new Date().getFullYear()}-${String(count + 101).padStart(4, '0')}`;

  const qty = parseInt(quantity_donated) || 1;
  const needId = needed_item_id ? parseInt(needed_item_id) : null;
  let targetItemName = item_name || null;
  let updatedNeed = null;

  // IMPORTANT: 
  // If Direct Donation: DIRECTLY UPDATE NEEDED ITEMS INVENTORY
  // If Pledge: DO NOT CHANGE RECEIVED UNITS (Admin confirms later)
  if (needId) {
    const needItem = db.prepare('SELECT * FROM needed_items WHERE id = ?').get(needId);
    if (needItem) {
      targetItemName = needItem.item_name;
      if (!isPledge) {
        const newReceived = needItem.quantity_received + qty;
        const isFulfilled = newReceived >= needItem.quantity_needed ? 1 : 0;
        
        db.prepare(`
          UPDATE needed_items 
          SET quantity_received = ?, is_fulfilled = ?
          WHERE id = ?
        `).run(newReceived, isFulfilled, needId);

        updatedNeed = {
          id: needItem.id,
          item_name: needItem.item_name,
          quantity_needed: needItem.quantity_needed,
          quantity_received: newReceived,
          is_fulfilled: isFulfilled
        };

        // Real-time synchronization event for needed item update
        broadcastSyncEvent({ type: 'NEEDED_UPDATED', action: 'UPDATE', data: updatedNeed });
      }
    }
  }

  const result = db.prepare(`
    INSERT INTO donations (
      receipt_no, donor_name, donor_phone, donor_email, amount, 
      payment_method, transaction_ref, notes, needed_item_id, item_name, quantity_donated,
      entry_type, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    receipt_no,
    donor_name.trim(),
    (donor_phone || '').trim(),
    (donor_email || '').trim(),
    parseInt(amount) || 0,
    payment_method || (isPledge ? 'Pledge Commitment' : 'UPI'),
    transaction_ref || '',
    notes || '',
    needId,
    targetItemName,
    qty,
    entry_type,
    status
  );

  const newDonation = db.prepare('SELECT * FROM donations WHERE id = ?').get(result.lastInsertRowid);

  // Real-time synchronization event across all connected devices
  broadcastSyncEvent({ type: 'DONATIONS_UPDATED', action: 'CREATE', data: newDonation });

  // Dispatch email notification to pn9059491777@gmail.com
  notifyAdminNewDonation(newDonation).catch(() => {});

  const hostelName = db.prepare("SELECT value FROM settings WHERE key = 'hostel_name'").get()?.value || 'RISE A CHILD CHILDREN HOME';
  
  res.status(201).json({
    success: true,
    message: isPledge 
      ? `Thank you for pledging to support ${hostelName}! Our administrator will contact you soon to coordinate.`
      : `Thank you for supporting ${hostelName}! Your donation was recorded successfully.`,
    receipt: newDonation,
    updated_need: updatedNeed
  });
});

// PUT /api/donations/:id/confirm - Confirm a pledge (Admin)
router.put('/:id/confirm', authenticateToken, (req, res) => {
  const donation = db.prepare('SELECT * FROM donations WHERE id = ? OR receipt_no = ?').get(req.params.id, req.params.id);
  if (!donation) {
    return res.status(404).json({ error: 'Donation or pledge record not found.' });
  }

  const wasConfirmed = donation.status === 'Confirmed';
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE donations 
    SET status = 'Confirmed', confirmed_at = ?
    WHERE id = ?
  `).run(now, donation.id);

  let updatedNeed = null;

  // If newly confirmed, increase the received units of the linked need item
  if (!wasConfirmed && donation.needed_item_id) {
    const need = db.prepare('SELECT * FROM needed_items WHERE id = ?').get(donation.needed_item_id);
    if (need) {
      const qtyToAdd = donation.quantity_donated || 1;
      const newReceived = need.quantity_received + qtyToAdd;
      const isFulfilled = newReceived >= need.quantity_needed ? 1 : 0;

      db.prepare(`
        UPDATE needed_items 
        SET quantity_received = ?, is_fulfilled = ? 
        WHERE id = ?
      `).run(newReceived, isFulfilled, need.id);

      updatedNeed = {
        id: need.id,
        item_name: need.item_name,
        quantity_needed: need.quantity_needed,
        quantity_received: newReceived,
        is_fulfilled: isFulfilled
      };

      broadcastSyncEvent({ type: 'NEEDED_UPDATED', action: 'UPDATE', data: updatedNeed });
    }
  }

  const updatedDonation = db.prepare('SELECT * FROM donations WHERE id = ?').get(donation.id);

  // Real-time synchronization event across all connected devices
  broadcastSyncEvent({ type: 'DONATIONS_UPDATED', action: 'UPDATE', data: updatedDonation });

  res.json({
    success: true,
    message: updatedNeed 
      ? `Pledge confirmed! Added +${donation.quantity_donated || 1} units to "${updatedNeed.item_name}" (${updatedNeed.quantity_received}/${updatedNeed.quantity_needed} received).`
      : 'Pledge marked as confirmed.',
    donation: updatedDonation,
    updated_need: updatedNeed
  });
});

// PUT /api/donations/:id/cancel - Cancel a pledge (Admin)
router.put('/:id/cancel', authenticateToken, (req, res) => {
  const donation = db.prepare('SELECT * FROM donations WHERE id = ? OR receipt_no = ?').get(req.params.id, req.params.id);
  if (!donation) {
    return res.status(404).json({ error: 'Donation or pledge record not found.' });
  }

  const wasConfirmed = donation.status === 'Confirmed';
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE donations 
    SET status = 'Cancelled', cancelled_at = ?
    WHERE id = ?
  `).run(now, donation.id);

  let updatedNeed = null;

  // If it was previously counted as confirmed, decrease received units
  if (wasConfirmed && donation.needed_item_id) {
    const need = db.prepare('SELECT * FROM needed_items WHERE id = ?').get(donation.needed_item_id);
    if (need) {
      const qtyToSubtract = donation.quantity_donated || 1;
      const newReceived = Math.max(0, need.quantity_received - qtyToSubtract);
      const isFulfilled = newReceived >= need.quantity_needed ? 1 : 0;

      db.prepare(`
        UPDATE needed_items 
        SET quantity_received = ?, is_fulfilled = ? 
        WHERE id = ?
      `).run(newReceived, isFulfilled, need.id);

      updatedNeed = {
        id: need.id,
        item_name: need.item_name,
        quantity_needed: need.quantity_needed,
        quantity_received: newReceived,
        is_fulfilled: isFulfilled
      };

      broadcastSyncEvent({ type: 'NEEDED_UPDATED', action: 'UPDATE', data: updatedNeed });
    }
  }

  const updatedDonation = db.prepare('SELECT * FROM donations WHERE id = ?').get(donation.id);

  // Real-time synchronization event across all connected devices
  broadcastSyncEvent({ type: 'DONATIONS_UPDATED', action: 'UPDATE', data: updatedDonation });

  res.json({
    success: true,
    message: updatedNeed 
      ? `Pledge cancelled. Received count on "${updatedNeed.item_name}" adjusted to ${updatedNeed.quantity_received}/${updatedNeed.quantity_needed}.`
      : 'Pledge cancelled.',
    donation: updatedDonation,
    updated_need: updatedNeed
  });
});

// DELETE donation record (Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  const donation = db.prepare('SELECT * FROM donations WHERE id = ? OR receipt_no = ?').get(req.params.id, req.params.id);
  if (!donation) {
    return res.status(404).json({ error: 'Donation record not found.' });
  }

  // If deleting a confirmed record linked to a need item, decrease received count
  if (donation.status === 'Confirmed' && donation.needed_item_id) {
    const need = db.prepare('SELECT * FROM needed_items WHERE id = ?').get(donation.needed_item_id);
    if (need) {
      const qtyToSubtract = donation.quantity_donated || 1;
      const newReceived = Math.max(0, need.quantity_received - qtyToSubtract);
      const isFulfilled = newReceived >= need.quantity_needed ? 1 : 0;

      db.prepare(`
        UPDATE needed_items 
        SET quantity_received = ?, is_fulfilled = ? 
        WHERE id = ?
      `).run(newReceived, isFulfilled, need.id);

      broadcastSyncEvent({ 
        type: 'NEEDED_UPDATED', 
        action: 'UPDATE', 
        data: { id: need.id, item_name: need.item_name, quantity_needed: need.quantity_needed, quantity_received: newReceived, is_fulfilled: isFulfilled }
      });
    }
  }

  db.prepare('DELETE FROM donations WHERE id = ?').run(donation.id);

  // Real-time synchronization event across all connected devices
  broadcastSyncEvent({ type: 'DONATIONS_UPDATED', action: 'DELETE', id: donation.id });

  res.json({ message: 'Donation record deleted successfully.' });
});

export default router;
