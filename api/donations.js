const { getCloudData, setCloudData } = require('./cloudDb');

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

  // Sort descending by month key (most recent months first)
  return Array.from(map.values()).sort((a, b) => b.month_key.localeCompare(a.month_key));
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const url = req.url || '';
  const method = req.method;

  try {
    let donations = await getCloudData('donations', []);

    // 1. GET /api/donations (Returns donations + Total + Monthly Breakdown)
    if (method === 'GET') {
      const activeDonations = donations.filter(d => d.status !== 'Cancelled');
      const totalAmount = activeDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
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

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        donations,
        total_donations_amount: totalAmount,
        total_count: donations.length,
        current_month: currentMonthStats,
        monthly_breakdown: monthlyBreakdown
      }));
    }

    // 2. Confirm / Cancel Pledge Actions
    if (method === 'POST' && url.includes('/confirm-pledge')) {
      const parts = url.split('?')[0].split('/');
      const targetId = parts[parts.indexOf('confirm-pledge') - 1];

      let targetDonation = null;
      donations = donations.map(d => {
        if (String(d.id) === String(targetId)) {
          targetDonation = { ...d, status: 'Confirmed', confirmed_at: new Date().toISOString() };
          return targetDonation;
        }
        return d;
      });

      if (targetDonation && targetDonation.needed_item_id) {
        let neededItems = await getCloudData('needed', []);
        neededItems = neededItems.map(item => {
          if (String(item.id) === String(targetDonation.needed_item_id)) {
            const qty = Number(targetDonation.quantity_donated) || 1;
            const newRec = (Number(item.quantity_received) || 0) + qty;
            return {
              ...item,
              quantity_received: newRec,
              is_fulfilled: newRec >= (Number(item.quantity_needed) || 1) ? 1 : 0
            };
          }
          return item;
        });
        await setCloudData('needed', neededItems, `Increase received for item ${targetDonation.needed_item_id}`);
      }

      await setCloudData('donations', donations, `Confirm pledge ${targetId}`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Pledge confirmed! Received units have been increased.', donation: targetDonation }));
    }

    if (method === 'POST' && url.includes('/cancel-pledge')) {
      const parts = url.split('?')[0].split('/');
      const targetId = parts[parts.indexOf('cancel-pledge') - 1];

      donations = donations.map(d => {
        if (String(d.id) === String(targetId)) {
          return { ...d, status: 'Cancelled', cancelled_at: new Date().toISOString() };
        }
        return d;
      });

      await setCloudData('donations', donations, `Cancel pledge ${targetId}`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Pledge commitment has been cancelled.' }));
    }

    // 3. POST /api/donations (Record new donation or pledge)
    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      body = body || {};

      const isPledge = body.entry_type === 'Pledge' || String(body.payment_method || '').toLowerCase().includes('pledge');
      const prefix = isPledge ? 'PLG' : 'REC';
      const receiptNo = `${prefix}-${new Date().getFullYear()}-${String(donations.length + 101).padStart(4, '0')}`;

      const newDonation = {
        id: Date.now(),
        receipt_no: receiptNo,
        donor_name: body.donor_name || 'Generous Supporter',
        donor_phone: body.donor_phone || '',
        donor_email: body.donor_email || '',
        amount: Number(body.amount) || 0,
        payment_method: body.payment_method || (isPledge ? 'Pledge Commitment' : 'UPI'),
        transaction_ref: body.transaction_ref || '',
        notes: body.notes || '',
        needed_item_id: body.needed_item_id ? Number(body.needed_item_id) : null,
        item_name: body.item_name || '',
        quantity_donated: Number(body.quantity_donated) || 1,
        entry_type: isPledge ? 'Pledge' : 'Direct Donation',
        status: isPledge ? 'Pledged (Pending Admin Confirmation)' : 'Confirmed',
        created_at: new Date().toISOString()
      };

      // If direct donation: update needed item inventory immediately
      if (!isPledge && newDonation.needed_item_id) {
        let neededItems = await getCloudData('needed', []);
        neededItems = neededItems.map(item => {
          if (String(item.id) === String(newDonation.needed_item_id)) {
            const qty = newDonation.quantity_donated;
            const newRec = (Number(item.quantity_received) || 0) + qty;
            newDonation.item_name = item.item_name;
            return {
              ...item,
              quantity_received: newRec,
              is_fulfilled: newRec >= (Number(item.quantity_needed) || 1) ? 1 : 0
            };
          }
          return item;
        });
        await setCloudData('needed', neededItems, `Direct donation received for ${newDonation.needed_item_id}`);
      }

      donations.unshift(newDonation);
      await setCloudData('donations', donations, `Record ${newDonation.entry_type} ${newDonation.receipt_no}`);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        message: isPledge ? 'Pledge registered successfully.' : 'Donation recorded and inventory updated.',
        donation: newDonation
      }));
    }

    // 4. DELETE /api/donations/:id or /api/donations/reset/all
    if (method === 'DELETE') {
      const parts = url.split('?')[0].split('/');
      const targetId = parts[parts.length - 1];

      if (url.includes('reset') || targetId === 'all') {
        donations = [];
        await setCloudData('donations', [], 'Reset all donation records to zero');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, message: 'All donation records cleared and overall income reset to ₹0.' }));
      }

      donations = donations.filter(d => String(d.id) !== String(targetId));
      await setCloudData('donations', donations, `Delete donation ${targetId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Donation entry removed.' }));
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
};
