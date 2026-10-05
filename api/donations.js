const { getCloudData, setCloudData } = require('./cloudDb');

function extractDonationsRoute(req) {
  const rawUrl = req.url || '';
  const pathOnly = rawUrl.split('?')[0].replace(/\/+$/, '');

  let extraPath = '';
  if (req.query && req.query.path) {
    extraPath = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path);
  } else if (rawUrl.includes('?')) {
    try {
      const sp = new URL(rawUrl, 'http://localhost').searchParams;
      extraPath = sp.get('path') || '';
    } catch {}
  }

  let fullPath = pathOnly;
  if (extraPath && !fullPath.includes(extraPath)) {
    fullPath = fullPath.replace(/\.js$/, '') + '/' + extraPath;
  }

  const tokens = fullPath.split('/').filter(t => Boolean(t) && t !== 'api' && t !== 'donations' && t !== 'donations.js');
  return { rawUrl, fullPath, tokens };
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
    if (d.entry_type === 'Pledge' || String(d.status || '').toLowerCase().includes('pledge')) {
      group.pledge_amount += amt;
    } else {
      group.direct_amount += amt;
    }
    group.donors_count += 1;
    group.donations.push(d);
  }

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

  const { fullPath, tokens } = extractDonationsRoute(req);
  const method = req.method;

  try {
    let donations = await getCloudData('donations', []);

    // 1. GET /api/donations (Returns donations + Total + Monthly Breakdown)
    if (method === 'GET' && (tokens.length === 0 || tokens[0] === '')) {
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

    // 2. Confirm Pledge: PUT /api/donations/:id/confirm
    const isConfirm = ((method === 'PUT' || method === 'POST') && (
      tokens.includes('confirm') || 
      tokens.includes('confirm-pledge') || 
      fullPath.includes('/confirm') ||
      fullPath.includes('confirm-pledge')
    ));

    // 3. Cancel Pledge: PUT /api/donations/:id/cancel
    const isCancel = ((method === 'PUT' || method === 'POST') && (
      tokens.includes('cancel') || 
      tokens.includes('cancel-pledge') || 
      fullPath.includes('/cancel') ||
      fullPath.includes('cancel-pledge')
    ));

    if (isConfirm) {
      const targetId = tokens.find(t => t !== 'confirm' && t !== 'confirm-pledge') || (tokens.length > 0 ? tokens[0] : null);

      let targetDonation = null;
      let wasAlreadyConfirmed = false;
      donations = donations.map(d => {
        if (String(d.id) === String(targetId) || String(d.receipt_no) === String(targetId)) {
          wasAlreadyConfirmed = d.status === 'Confirmed';
          targetDonation = { ...d, status: 'Confirmed', confirmed_at: new Date().toISOString() };
          return targetDonation;
        }
        return d;
      });

      if (!targetDonation) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: `Pledge record ${targetId} not found` }));
      }

      let updatedNeed = null;
      if (!wasAlreadyConfirmed && (targetDonation.needed_item_id || targetDonation.item_name || targetDonation.linked_need_title)) {
        let neededItems = await getCloudData('needed', []);
        neededItems = neededItems.map(item => {
          const matchId = targetDonation.needed_item_id && String(item.id) === String(targetDonation.needed_item_id);
          const donName = (targetDonation.item_name || targetDonation.linked_need_title || '').toLowerCase().trim();
          const matchName = donName && item.item_name && item.item_name.toLowerCase().trim() === donName;
          if (matchId || matchName) {
            const qty = Number(targetDonation.quantity_donated) || 1;
            const newRec = (Number(item.quantity_received) || 0) + qty;
            updatedNeed = {
              ...item,
              quantity_received: newRec,
              is_fulfilled: newRec >= (Number(item.quantity_needed) || 1) ? 1 : 0
            };
            return updatedNeed;
          }
          return item;
        });
        if (updatedNeed) {
          await setCloudData('needed', neededItems, `Increase received for item ${targetDonation.needed_item_id || targetDonation.item_name}`);
        }
      }

      await setCloudData('donations', donations, `Confirm pledge ${targetId}`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ 
        success: true,
        message: updatedNeed 
          ? `Pledge confirmed! Added +${targetDonation.quantity_donated || 1} units to "${updatedNeed.item_name}" (${updatedNeed.quantity_received}/${updatedNeed.quantity_needed} received).`
          : 'Pledge confirmed! Received units have been increased.', 
        donation: targetDonation,
        receipt: targetDonation,
        updated_need: updatedNeed
      }));
    }

    if (isCancel) {
      const targetId = tokens.find(t => t !== 'cancel' && t !== 'cancel-pledge') || (tokens.length > 0 ? tokens[0] : null);

      let targetDonation = null;
      let wasConfirmed = false;
      donations = donations.map(d => {
        if (String(d.id) === String(targetId) || String(d.receipt_no) === String(targetId)) {
          wasConfirmed = d.status === 'Confirmed';
          targetDonation = { ...d, status: 'Cancelled', cancelled_at: new Date().toISOString() };
          return targetDonation;
        }
        return d;
      });

      if (!targetDonation) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: `Pledge record ${targetId} not found` }));
      }

      let updatedNeed = null;
      if (wasConfirmed && (targetDonation.needed_item_id || targetDonation.item_name || targetDonation.linked_need_title)) {
        let neededItems = await getCloudData('needed', []);
        neededItems = neededItems.map(item => {
          const matchId = targetDonation.needed_item_id && String(item.id) === String(targetDonation.needed_item_id);
          const donName = (targetDonation.item_name || targetDonation.linked_need_title || '').toLowerCase().trim();
          const matchName = donName && item.item_name && item.item_name.toLowerCase().trim() === donName;
          if (matchId || matchName) {
            const qty = Number(targetDonation.quantity_donated) || 1;
            const newRec = Math.max(0, (Number(item.quantity_received) || 0) - qty);
            updatedNeed = {
              ...item,
              quantity_received: newRec,
              is_fulfilled: newRec >= (Number(item.quantity_needed) || 1) ? 1 : 0
            };
            return updatedNeed;
          }
          return item;
        });
        if (updatedNeed) {
          await setCloudData('needed', neededItems, `Reduce received for cancelled pledge ${targetId}`);
        }
      }

      await setCloudData('donations', donations, `Cancel pledge ${targetId}`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ 
        success: true,
        message: 'Pledge commitment has been cancelled.',
        donation: targetDonation,
        receipt: targetDonation,
        updated_need: updatedNeed
      }));
    }

    // 4. POST /api/donations (Record new donation or pledge)
    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const isPledge = body.entry_type === 'Pledge' || 
        String(body.status || '').toLowerCase().includes('pledge') ||
        String(body.payment_method || '').toLowerCase().includes('pledge');

      const prefix = isPledge ? 'PLG' : 'REC';
      const receiptNo = `${prefix}-${new Date().getFullYear()}-${String(donations.length + 101).padStart(4, '0')}`;
      const itemName = (body.item_name || body.linked_need_title || '').trim();

      const newDonation = {
        id: Date.now(),
        receipt_no: receiptNo,
        donor_name: (body.donor_name || 'Generous Supporter').trim(),
        donor_phone: (body.donor_phone || '').trim(),
        donor_email: (body.donor_email || '').trim(),
        amount: Number(body.amount) || 0,
        payment_method: body.payment_method || (isPledge ? 'Pledge Commitment' : 'UPI'),
        transaction_ref: (body.transaction_ref || '').trim(),
        notes: (body.notes || '').trim(),
        needed_item_id: body.needed_item_id ? Number(body.needed_item_id) : null,
        item_name: itemName,
        linked_need_title: itemName,
        quantity_donated: Number(body.quantity_donated) || 1,
        entry_type: isPledge ? 'Pledge' : 'Direct Donation',
        status: isPledge ? 'Pledged (Pending Admin Confirmation)' : 'Confirmed',
        created_at: new Date().toISOString()
      };

      // If direct donation: update needed item inventory immediately
      let updatedNeed = null;
      if (!isPledge && (newDonation.needed_item_id || itemName)) {
        let neededItems = await getCloudData('needed', []);
        neededItems = neededItems.map(item => {
          const matchId = newDonation.needed_item_id && String(item.id) === String(newDonation.needed_item_id);
          const donName = itemName.toLowerCase().trim();
          const matchName = donName && item.item_name && item.item_name.toLowerCase().trim() === donName;
          if (matchId || matchName) {
            const qty = newDonation.quantity_donated;
            const newRec = (Number(item.quantity_received) || 0) + qty;
            newDonation.item_name = item.item_name;
            newDonation.linked_need_title = item.item_name;
            updatedNeed = {
              ...item,
              quantity_received: newRec,
              is_fulfilled: newRec >= (Number(item.quantity_needed) || 1) ? 1 : 0
            };
            return updatedNeed;
          }
          return item;
        });
        if (updatedNeed) {
          await setCloudData('needed', neededItems, `Direct donation received for ${newDonation.item_name}`);
        }
      }

      donations.unshift(newDonation);
      await setCloudData('donations', donations, `Record ${newDonation.entry_type} ${newDonation.receipt_no}`);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        message: isPledge ? 'Pledge registered successfully.' : 'Donation recorded and inventory updated.',
        receipt: newDonation,
        donation: newDonation,
        updated_need: updatedNeed
      }));
    }

    // 5. DELETE /api/donations/:id or /api/donations/reset/all
    if (method === 'DELETE') {
      const isReset = tokens.includes('reset') || tokens.includes('all') || fullPath.includes('reset');
      if (isReset) {
        await setCloudData('donations', [], 'Reset all donation records to zero');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, message: 'All donation records cleared and overall income reset to ₹0.' }));
      }

      const targetId = tokens[0];
      const target = donations.find(d => String(d.id) === String(targetId) || String(d.receipt_no) === String(targetId));

      // If deleting a confirmed donation linked to a need item, reduce inventory
      if (target && target.status === 'Confirmed' && (target.needed_item_id || target.item_name)) {
        let neededItems = await getCloudData('needed', []);
        const qty = Number(target.quantity_donated) || 1;
        neededItems = neededItems.map(item => {
          const matchId = target.needed_item_id && String(item.id) === String(target.needed_item_id);
          const donName = (target.item_name || target.linked_need_title || '').toLowerCase().trim();
          const matchName = donName && item.item_name && item.item_name.toLowerCase().trim() === donName;
          if (matchId || matchName) {
            const newRec = Math.max(0, (Number(item.quantity_received) || 0) - qty);
            return {
              ...item,
              quantity_received: newRec,
              is_fulfilled: newRec >= (Number(item.quantity_needed) || 1) ? 1 : 0
            };
          }
          return item;
        });
        await setCloudData('needed', neededItems, `Reduce received for deleted donation ${targetId}`);
      }

      donations = donations.filter(d => String(d.id) !== String(targetId) && String(d.receipt_no) !== String(targetId));
      await setCloudData('donations', donations, `Delete donation ${targetId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: true, message: 'Donation entry removed.' }));
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
};
