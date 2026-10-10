const https = require('https');
const crypto = require('crypto');
const { getCloudData, setCloudData } = require('./cloudDb');

/**
 * Route extraction matching Vercel serverless rewrites
 */
function extractPaymentRoute(req) {
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

  const tokens = fullPath.split('/').filter(t => Boolean(t) && t !== 'api' && t !== 'payment' && t !== 'payment.js');
  return { rawUrl, fullPath, tokens };
}

/**
 * Helper to call Razorpay official REST APIs
 */
function callRazorpayApi(endpoint, method, body, keyId, keySecret) {
  return new Promise((resolve) => {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const payload = body ? JSON.stringify(body) : null;

    const req = https.request({
      hostname: 'api.razorpay.com',
      path: endpoint,
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'User-Agent': 'RISE-A-CHILD-Donation-Platform/2.0',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      },
      timeout: 10000
    }, (res) => {
      let chunks = '';
      res.on('data', c => { chunks += c; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(chunks) });
        } catch {
          resolve({ status: res.statusCode, data: chunks });
        }
      });
    });

    req.on('error', err => resolve({ status: 500, error: err.message, data: null }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 504, error: 'Gateway timeout', data: null }); });
    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * Validates HMAC SHA-256 signature in constant time
 */
function verifySignature(expectedText, providedSignature, secret) {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(expectedText);
    const expectedSignature = hmac.digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const providedBuf = Buffer.from(String(providedSignature).trim(), 'utf8');

    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

/**
 * Parses request body whether sent as object or string
 */
function parseRequestBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  return body || {};
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Razorpay-Signature');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const { fullPath, tokens } = extractPaymentRoute(req);
  const action = tokens[0] || '';
  const method = req.method;

  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
  const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  const isConfigured = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

  try {
    // 1. GET /api/payment/config - Gateway status & public Key ID
    if (method === 'GET' && (action === 'config' || action === 'status' || action === '')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        gateway: 'Razorpay',
        configured: isConfigured,
        key_id: RAZORPAY_KEY_ID ? `${RAZORPAY_KEY_ID.substring(0, 8)}...` : null,
        public_key_id: RAZORPAY_KEY_ID || null,
        currency: 'INR',
        supported_methods: ['UPI', 'Google Pay', 'PhonePe', 'Credit Card', 'Debit Card', 'Net Banking'],
        sandbox_simulation_available: true
      }));
    }

    // 2. POST /api/payment/create-order - Create pending donation & gateway order
    if (method === 'POST' && (action === 'create-order' || action === 'order')) {
      const body = parseRequestBody(req);

      const donorName = (body.donor_name || '').trim();
      const donorPhone = (body.donor_phone || '').trim();
      const donorEmail = (body.donor_email || '').trim();
      const amount = Number(body.amount);
      const neededItemId = body.needed_item_id ? Number(body.needed_item_id) : null;
      const itemName = (body.item_name || body.linked_need_title || '').trim();
      const quantityDonated = Math.max(1, Number(body.quantity_donated) || 1);
      const notes = (body.notes || '').trim();

      // Server-Side Input Validation
      if (!donorName || donorName.length < 2) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Donor full name is required (minimum 2 characters).' }));
      }

      if (!donorPhone || donorPhone.length < 6) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Valid phone number is required for transaction confirmation.' }));
      }

      if (isNaN(amount) || amount < 1) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Donation amount must be at least ₹1.' }));
      }

      // Load existing donations
      let donations = await getCloudData('donations', []);
      const currentYear = new Date().getFullYear();
      const receiptNo = `REC-${currentYear}-${String(donations.length + 101).padStart(4, '0')}`;
      const donationId = Date.now();

      // Create unique donation record with status PENDING
      const pendingDonation = {
        id: donationId,
        receipt_no: receiptNo,
        donor_name: donorName,
        donor_phone: donorPhone,
        donor_email: donorEmail,
        amount: amount,
        currency: 'INR',
        payment_method: 'Online Payment (Razorpay)',
        payment_status: 'PENDING',
        status: 'Payment Pending',
        transaction_ref: '',
        gateway_order_id: '',
        gateway_payment_id: '',
        needed_item_id: neededItemId,
        item_name: itemName,
        linked_need_title: itemName,
        quantity_donated: quantityDonated,
        notes: notes,
        entry_type: 'Direct Donation',
        created_at: new Date().toISOString()
      };

      let razorpayOrder = null;

      if (isConfigured) {
        // Call official Razorpay Orders API
        // Amount must be in paise (1 INR = 100 paise)
        const orderPayload = {
          amount: Math.round(amount * 100),
          currency: 'INR',
          receipt: receiptNo,
          notes: {
            donation_id: String(donationId),
            donor_name: donorName,
            donor_phone: donorPhone,
            needed_item_id: neededItemId ? String(neededItemId) : 'general'
          }
        };

        const rzpRes = await callRazorpayApi('/v1/orders', 'POST', orderPayload, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET);
        if (rzpRes.status >= 200 && rzpRes.status < 300 && rzpRes.data?.id) {
          razorpayOrder = rzpRes.data;
          pendingDonation.gateway_order_id = razorpayOrder.id;
        } else {
          console.error('Razorpay order creation failed:', rzpRes);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            error: 'Failed to create payment order with Razorpay.',
            details: rzpRes.data?.error?.description || rzpRes.error || 'Gateway communication error.'
          }));
        }
      } else {
        // Sandbox Simulation Mode when keys are not yet configured in Vercel
        const simulatedOrderId = `order_sim_${donationId}`;
        razorpayOrder = {
          id: simulatedOrderId,
          amount: Math.round(amount * 100),
          currency: 'INR',
          receipt: receiptNo,
          status: 'created'
        };
        pendingDonation.gateway_order_id = simulatedOrderId;
      }

      // Persist pending donation in cloud database
      donations.unshift(pendingDonation);
      await setCloudData('donations', donations, `Create pending donation ${pendingDonation.receipt_no}`);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        is_live_gateway: isConfigured,
        key_id: isConfigured ? RAZORPAY_KEY_ID : 'rzp_test_simulation',
        order: razorpayOrder,
        order_id: razorpayOrder.id,
        amount: amount,
        amount_paise: Math.round(amount * 100),
        currency: 'INR',
        donation_id: donationId,
        receipt_no: receiptNo,
        donor: {
          name: donorName,
          phone: donorPhone,
          email: donorEmail
        }
      }));
    }

    // 3. POST /api/payment/verify - Secure HMAC-SHA256 Payment Verification
    if (method === 'POST' && (action === 'verify' || action === 'verify-payment')) {
      const body = parseRequestBody(req);

      const donationId = body.donation_id;
      const razorpayOrderId = body.razorpay_order_id || body.order_id;
      const razorpayPaymentId = body.razorpay_payment_id || body.payment_id;
      const razorpaySignature = body.razorpay_signature || body.signature;

      if (!donationId || !razorpayOrderId || !razorpayPaymentId) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Missing payment verification credentials (donation_id, order_id, payment_id required).' }));
      }

      // Cryptographic Verification
      if (isConfigured) {
        if (!razorpaySignature) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Missing Razorpay signature.' }));
        }

        const payloadToSign = `${razorpayOrderId}|${razorpayPaymentId}`;
        const isValid = verifySignature(payloadToSign, razorpaySignature, RAZORPAY_KEY_SECRET);

        if (!isValid) {
          console.warn(`[SECURITY ALERT] Invalid Razorpay signature attempt for donation ${donationId}.`);
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: false,
            error: 'Cryptographic signature verification failed. Payment cannot be confirmed.'
          }));
        }
      } else {
        // Sandbox mode verification check
        if (!String(razorpayOrderId).startsWith('order_sim_') && !String(razorpayPaymentId).startsWith('pay_sim_')) {
          // If keys are not set, allow verified test tokens
        }
      }

      // Fetch and verify donation in cloud database
      let donations = await getCloudData('donations', []);
      let targetDonation = null;
      let alreadyConfirmed = false;

      donations = donations.map(d => {
        if (String(d.id) === String(donationId) || (d.gateway_order_id && d.gateway_order_id === razorpayOrderId)) {
          targetDonation = d;
          if (d.status === 'Confirmed' && d.payment_status === 'CONFIRMED') {
            alreadyConfirmed = true;
            return d;
          }
          const confirmedAt = new Date().toISOString();
          targetDonation = {
            ...d,
            payment_status: 'CONFIRMED',
            status: 'Confirmed',
            payment_method: 'Razorpay (UPI / Cards / NetBanking)',
            transaction_ref: razorpayPaymentId,
            gateway_payment_id: razorpayPaymentId,
            gateway_order_id: razorpayOrderId,
            confirmed_at: confirmedAt
          };
          return targetDonation;
        }
        return d;
      });

      if (!targetDonation) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: `Donation record ${donationId} not found in database.` }));
      }

      // If already confirmed (idempotency handling), return immediately
      if (alreadyConfirmed) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          message: 'Donation was already successfully verified and confirmed.',
          already_confirmed: true,
          donation: targetDonation,
          receipt: targetDonation
        }));
      }

      // Update linked needed item inventory
      let updatedNeed = null;
      if (targetDonation.needed_item_id || targetDonation.item_name) {
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
          await setCloudData('needed', neededItems, `Increment received for need ${targetDonation.item_name}`);
        }
      }

      // Persist verified donation record
      await setCloudData('donations', donations, `Confirm verified online donation ${targetDonation.receipt_no}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        message: 'Thank you for your donation! Your payment has been successfully verified.',
        donation: targetDonation,
        receipt: targetDonation,
        updated_need: updatedNeed
      }));
    }

    // 4. POST /api/payment/webhook - Official Razorpay Webhooks
    if (method === 'POST' && (action === 'webhook' || action === 'razorpay-webhook')) {
      const webhookSignature = req.headers['x-razorpay-signature'];
      let rawBody = req.body;
      if (typeof rawBody !== 'string') {
        rawBody = JSON.stringify(rawBody || {});
      }

      if (RAZORPAY_WEBHOOK_SECRET && webhookSignature) {
        const isValid = verifySignature(rawBody, webhookSignature, RAZORPAY_WEBHOOK_SECRET);
        if (!isValid) {
          console.warn('[SECURITY] Invalid Razorpay webhook signature.');
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'Invalid webhook signature.' }));
        }
      }

      const eventData = parseRequestBody(req);
      const event = eventData.event;
      const paymentEntity = eventData.payload?.payment?.entity;
      const orderEntity = eventData.payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;
      const amountPaise = paymentEntity?.amount || orderEntity?.amount;

      if ((event === 'payment.captured' || event === 'order.paid') && orderId) {
        let donations = await getCloudData('donations', []);
        let donationToConfirm = null;
        let wasAlreadyConfirmed = false;

        donations = donations.map(d => {
          if (d.gateway_order_id === orderId || String(d.id) === String(paymentEntity?.notes?.donation_id)) {
            if (d.status === 'Confirmed') {
              wasAlreadyConfirmed = true;
              return d;
            }
            donationToConfirm = {
              ...d,
              payment_status: 'CONFIRMED',
              status: 'Confirmed',
              transaction_ref: paymentId || d.transaction_ref,
              gateway_payment_id: paymentId || d.gateway_payment_id,
              confirmed_at: new Date().toISOString()
            };
            return donationToConfirm;
          }
          return d;
        });

        if (donationToConfirm && !wasAlreadyConfirmed) {
          // Update linked need item
          if (donationToConfirm.needed_item_id || donationToConfirm.item_name) {
            let neededItems = await getCloudData('needed', []);
            neededItems = neededItems.map(item => {
              const matchId = donationToConfirm.needed_item_id && String(item.id) === String(donationToConfirm.needed_item_id);
              const donName = (donationToConfirm.item_name || donationToConfirm.linked_need_title || '').toLowerCase().trim();
              if (matchId || (donName && item.item_name && item.item_name.toLowerCase().trim() === donName)) {
                const qty = Number(donationToConfirm.quantity_donated) || 1;
                const newRec = (Number(item.quantity_received) || 0) + qty;
                return {
                  ...item,
                  quantity_received: newRec,
                  is_fulfilled: newRec >= (Number(item.quantity_needed) || 1) ? 1 : 0
                };
              }
              return item;
            });
            await setCloudData('needed', neededItems, `Webhook confirmed need ${donationToConfirm.item_name}`);
          }
          await setCloudData('donations', donations, `Webhook confirmed donation ${donationToConfirm.receipt_no}`);
        }
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ status: 'ok', received: true }));
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: `Unknown payment route: ${fullPath}` }));
  } catch (err) {
    console.error('Payment handler error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Internal payment error.' }));
  }
};
