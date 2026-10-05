const { getCloudData, setCloudData } = require('./cloudDb');

function sortStaffAscending(list) {
  return [...list].sort((a, b) => (Number(a.order_num) || 0) - (Number(b.order_num) || 0) || (Number(a.id) || 0) - (Number(b.id) || 0));
}

function isAuthorized(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return Boolean(token && token.length > 10);
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
  const authorized = isAuthorized(req);

  try {
    let staffList = sortStaffAscending(await getCloudData('staff', []));

    // 1. GET /api/staff (Public with Staff Profile Privacy, full details for admin)
    if (method === 'GET') {
      // Direct CSV export handler for Vercel
      if (url.includes('/export/csv')) {
        const sorted = sortStaffAscending(staffList);
        const headers = [
          'S.No', 'Full Name', 'Role / Designation', 'Mobile Number', 'Email Address',
          'Qualification', 'Experience', 'Responsibilities / Description', 'Display Order'
        ];
        const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
        const rows = sorted.map((s, idx) => [
          idx + 1,
          s.name || '',
          s.role || '',
          authorized ? (s.mobile || '') : '••••••••••',
          authorized ? (s.email || '') : '••••••@•••••.com',
          s.qualification || '',
          s.experience || '',
          s.description || '',
          s.order_num || (idx + 1)
        ].map(escapeCsv).join(','));

        const csvData = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="RISE_A_CHILD_Staff_Directory.csv"');
        return res.end(csvData);
      }

      const sanitizedStaff = staffList.map(member => {
        if (authorized) return member;
        return {
          id: member.id,
          name: member.name,
          role: member.role,
          qualification: member.qualification,
          experience: member.experience,
          description: member.description,
          photo: member.photo,
          order_num: member.order_num,
          is_private_protected: true,
          mobile: '••••••••••',
          email: '••••••@•••••.com'
        };
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(sanitizedStaff));
    }

    // 2. POST /api/staff (Add new staff member to persistent cloud store)
    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const highestOrder = staffList.reduce((max, s) => Math.max(max, Number(s.order_num) || 0), 0);
      const newStaff = {
        id: Date.now(),
        name: body.name || '',
        role: body.role || '',
        mobile: body.mobile || '',
        email: body.email || '',
        qualification: body.qualification || '',
        experience: body.experience || '',
        description: body.description || '',
        photo: body.photo ? body.photo.trim() : '',
        order_num: highestOrder + 1
      };

      staffList.push(newStaff);
      staffList = sortStaffAscending(staffList);
      await setCloudData('staff', staffList, `Add staff member ${newStaff.name}`);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(newStaff));
    }

    // 3. PUT /api/staff/:id (Update staff member in cloud store)
    if (method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const parts = url.split('?')[0].split('/');
      const staffId = parts[parts.length - 1];

      staffList = staffList.map(s => String(s.id) === String(staffId) ? { ...s, ...body, id: s.id } : s);
      staffList = sortStaffAscending(staffList);
      await setCloudData('staff', staffList, `Update staff member ${staffId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ...body, id: staffId }));
    }

    // 4. DELETE /api/staff/:id (Remove staff member from cloud store)
    if (method === 'DELETE') {
      const parts = url.split('?')[0].split('/');
      const staffId = parts[parts.length - 1];

      staffList = staffList.filter(s => String(s.id) !== String(staffId));
      await setCloudData('staff', staffList, `Delete staff member ${staffId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Staff member removed successfully.' }));
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
};
