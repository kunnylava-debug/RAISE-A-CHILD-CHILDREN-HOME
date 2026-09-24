import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all donations (Admin only)
router.get('/', authenticateToken, (req, res) => {
  const donations = db.prepare(`
    SELECT d.*, n.item_name as linked_need_title, n.quantity_needed as linked_need_total, n.quantity_received as linked_need_current, n.is_fulfilled as linked_need_fulfilled
    FROM donations d
    LEFT JOIN needed_items n ON d.needed_item_id = n.id
    ORDER BY d.id DESC
  `).all();
  
  const totalAmount = db.prepare('SELECT SUM(amount) as total FROM donations').get().total || 0;
  const count = db.prepare('SELECT COUNT(*) as count FROM donations').get().count || 0;

  res.json({ donations, total_donations_amount: totalAmount, total_count: count });
});

// POST record donation/pledge (Public)
router.post('/', (req, res) => {
  const { 
    donor_name, donor_phone, donor_email, amount, 
    payment_method, transaction_ref, notes, 
    needed_item_id, item_name, quantity_donated 
  } = req.body;

  if (!donor_name || !amount) {
    return res.status(400).json({ error: 'Donor name and amount are required.' });
  }

  const count = db.prepare('SELECT COUNT(*) as count FROM donations').get().count;
  const receipt_no = `REC-${new Date().getFullYear()}-${String(count + 101).padStart(4, '0')}`;

  const qty = parseInt(quantity_donated) || 1;
  const needId = needed_item_id ? parseInt(needed_item_id) : null;
  let targetItemName = item_name || null;
  let updatedNeed = null;

  // Cross-check & automatically update needed_items if matched!
  if (needId) {
    const needItem = db.prepare('SELECT * FROM needed_items WHERE id = ?').get(needId);
    if (needItem) {
      targetItemName = needItem.item_name;
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
      
      console.log(`[DONATION MATCHED NEED] Item "${needItem.item_name}" updated: received ${newReceived}/${needItem.quantity_needed} (Fulfilled: ${isFulfilled})`);
    }
  }

  const result = db.prepare(`
    INSERT INTO donations (
      receipt_no, donor_name, donor_phone, donor_email, amount, 
      payment_method, transaction_ref, notes, needed_item_id, item_name, quantity_donated
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    receipt_no,
    donor_name,
    donor_phone || '',
    donor_email || '',
    parseInt(amount),
    payment_method || 'UPI',
    transaction_ref || '',
    notes || '',
    needId,
    targetItemName,
    qty
  );

  const newDonation = db.prepare('SELECT * FROM donations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({
    success: true,
    message: 'Thank you for supporting Shanti Niketan Children’s Hostel!',
    receipt: newDonation,
    updated_need: updatedNeed
  });
});

export default router;
