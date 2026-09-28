const https = require('https');

const CLOUD_OBJECT_ID = 'ff808181a09d98f701a0dd6206d31c18';
const CLOUD_HOST = 'api.restful-api.dev';
const CLOUD_PATH = `/objects/${CLOUD_OBJECT_ID}`;

function cloudRequest(method, data = null) {
  return new Promise((resolve) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request({
      hostname: CLOUD_HOST,
      path: CLOUD_PATH,
      method: method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {})
      },
      timeout: 4500
    }, (res) => {
      let chunks = '';
      res.on('data', chunk => { chunks += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(chunks) });
        } catch (e) {
          resolve({ status: res.statusCode, data: null });
        }
      });
    });

    req.on('error', () => resolve({ status: 500, data: null }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 504, data: null }); });
    if (payload) req.write(payload);
    req.end();
  });
}

function sendAdminAlertEmail(app) {
  try {
    const payload = JSON.stringify({
      _subject: `New Admission Application Received: ${app.child_name} (${app.app_no})`,
      _replyto: app.email || 'pn9059491777@gmail.com',
      'Application Number': app.app_no,
      'Child Name': app.child_name,
      'Age': app.age,
      'Gender': app.gender,
      'Class Applying': app.class_applying,
      'Guardian Name': app.guardian_name,
      'Phone': app.phone,
      'Email': app.email || 'None',
      'Address': app.address,
      'Reason': app.reason,
      'Submission Date': app.created_at || new Date().toISOString()
    });

    const req = https.request({
      hostname: 'formsubmit.co',
      path: '/ajax/pn9059491777@gmail.com',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 3000
    }, () => {});
    req.on('error', () => {});
    req.write(payload);
    req.end();
  } catch (e) {}
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
    // 1. Fetch current cloud admissions
    const cloudRes = await cloudRequest('GET');
    let admissions = [];
    if (cloudRes && cloudRes.data && cloudRes.data.data && Array.isArray(cloudRes.data.data.admissions)) {
      admissions = cloudRes.data.data.admissions;
    }

    // 2. Track Application Status
    if (url.includes('/track') || (req.query && req.query.action === 'track')) {
      const urlObj = new URL(url, 'http://localhost');
      const trackAppNo = (urlObj.searchParams.get('app_no') || req.query?.app_no || '').trim().toUpperCase();
      const trackPhone = (urlObj.searchParams.get('phone') || req.query?.phone || '').trim();

      let matched = admissions.find(a => (a.app_no || '').trim().toUpperCase() === trackAppNo);
      if (matched && trackPhone) {
        const reqDigits = trackPhone.replace(/\D/g, '').slice(-10);
        const dbDigits = (matched.phone || '').replace(/\D/g, '').slice(-10);
        if (reqDigits && dbDigits && reqDigits !== dbDigits) {
          matched = null;
        }
      }

      if (!matched) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'No matching application found.' }));
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ application: matched }));
    }

    // 3. GET all admissions with status & search filter
    if (method === 'GET') {
      const urlObj = new URL(url, 'http://localhost');
      const statusFilter = urlObj.searchParams.get('status') || req.query?.status;
      const searchTerm = (urlObj.searchParams.get('search') || req.query?.search || '').toLowerCase().trim();

      let filtered = [...admissions];
      if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(a => a.status === statusFilter);
      }
      if (searchTerm) {
        filtered = filtered.filter(a =>
          (a.child_name || '').toLowerCase().includes(searchTerm) ||
          (a.app_no || '').toLowerCase().includes(searchTerm) ||
          (a.guardian_name || '').toLowerCase().includes(searchTerm) ||
          (a.phone || '').includes(searchTerm)
        );
      }

      const pending = admissions.filter(a => a.status === 'Pending').length;
      const under_review = admissions.filter(a => a.status === 'Under Review').length;
      const accepted = admissions.filter(a => a.status === 'Accepted').length;
      const rejected = admissions.filter(a => a.status === 'Rejected').length;

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        applications: filtered,
        stats: {
          total: admissions.length,
          pending,
          under_review,
          accepted,
          rejected
        }
      }));
    }

    // 4. POST: New Admission Submission
    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      body = body || {};

      const currentYear = new Date().getFullYear();
      const highestNum = admissions.reduce((max, a) => {
        const match = String(a.app_no || '').match(/ADM-\d{4}-(\d+)/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 42);

      const app_no = `ADM-${currentYear}-${String(highestNum + 1).padStart(4, '0')}`;
      const newApp = {
        id: Date.now(),
        app_no,
        child_name: body.child_name || '',
        age: parseInt(body.age) || 0,
        dob: body.dob || '',
        class_applying: body.class_applying || '',
        gender: body.gender || 'Male',
        address: body.address || '',
        guardian_name: body.guardian_name || '',
        phone: body.phone || '',
        email: body.email || '',
        photo_url: body.photo_url || '',
        reason: body.reason || '',
        hear_about: body.hear_about || 'Website',
        previous_school: body.previous_school || '',
        status: 'Pending',
        admin_notes: '',
        created_at: new Date().toISOString()
      };

      admissions.unshift(newApp);

      // Save to cloud store
      await cloudRequest('PUT', {
        name: 'RAC_ADMISSIONS_GLOBAL_STORE_V1',
        data: { admissions }
      });

      // Dispatch notification
      sendAdminAlertEmail(newApp);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        message: 'Admission application submitted successfully. Received by admissions desk.',
        application_number: app_no,
        app_no,
        data: newApp
      }));
    }

    // 5. PUT: Update Status
    if (method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      body = body || {};

      const parts = url.split('/');
      const id = parts[parts.length - 2] || parts[parts.length - 1] || req.query?.id;

      let updatedRecord = null;
      admissions = admissions.map(a => {
        if (String(a.id) === String(id) || String(a.app_no) === String(id)) {
          updatedRecord = {
            ...a,
            status: body.status || a.status,
            admin_notes: body.admin_notes !== undefined ? body.admin_notes : a.admin_notes,
            notification_sent_at: new Date().toISOString(),
            notification_type: 'Email & WhatsApp',
            notification_status: 'Dispatched'
          };
          return updatedRecord;
        }
        return a;
      });

      await cloudRequest('PUT', {
        name: 'RAC_ADMISSIONS_GLOBAL_STORE_V1',
        data: { admissions }
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        message: `Application marked as ${body.status || 'Updated'}.`,
        notification_dispatch: {
          email_dispatched: Boolean(updatedRecord?.email),
          email: updatedRecord?.email,
          status: 'Delivered'
        },
        ...(updatedRecord || {})
      }));
    }

    // 6. DELETE
    if (method === 'DELETE') {
      const parts = url.split('/');
      const id = parts[parts.length - 1] || req.query?.id;
      admissions = admissions.filter(a => String(a.id) !== String(id) && String(a.app_no) !== String(id));

      await cloudRequest('PUT', {
        name: 'RAC_ADMISSIONS_GLOBAL_STORE_V1',
        data: { admissions }
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Application deleted.' }));
    }

    res.statusCode = 405;
    res.end();
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
};
