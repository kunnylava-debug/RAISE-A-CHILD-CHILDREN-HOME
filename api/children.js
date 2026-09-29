const { getCloudData, setCloudData } = require('./cloudDb');

function sortChildrenAscending(list) {
  return [...list].sort((a, b) => {
    const numA = parseInt(String(a.serial_no || '').replace(/\D/g, ''), 10) || (Number(a.id) || 0);
    const numB = parseInt(String(b.serial_no || '').replace(/\D/g, ''), 10) || (Number(b.id) || 0);
    return numA - numB;
  });
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
    let children = sortChildrenAscending(await getCloudData('children', []));

    // 1. GET /api/children (Public directory with Privacy Shield, full details for admin)
    if (method === 'GET') {
      const urlObj = new URL(url, 'http://localhost');
      const page = parseInt(urlObj.searchParams.get('page')) || 1;
      const limit = parseInt(urlObj.searchParams.get('limit')) || 12;
      const search = (urlObj.searchParams.get('search') || '').toLowerCase().trim();
      const classFilter = urlObj.searchParams.get('class');
      const genderFilter = urlObj.searchParams.get('gender');

      let filtered = children;
      if (search) {
        filtered = filtered.filter(c =>
          (c.name || '').toLowerCase().includes(search) ||
          (c.serial_no || '').toLowerCase().includes(search)
        );
      }
      if (classFilter && classFilter !== 'all') {
        filtered = filtered.filter(c => c.class === classFilter);
      }
      if (genderFilter && genderFilter !== 'all') {
        filtered = filtered.filter(c => c.gender === genderFilter);
      }

      const startIndex = (page - 1) * limit;
      const pagedChildren = filtered.slice(startIndex, startIndex + limit);

      const sanitizedChildren = (limit >= 1000 ? filtered : pagedChildren).map(child => {
        if (authorized) return child;
        return {
          id: child.id,
          serial_no: child.serial_no,
          name: child.name,
          age: child.age,
          class: child.class,
          gender: child.gender,
          admission_date: child.admission_date,
          photo: child.photo,
          hobbies: child.hobbies,
          is_private_protected: true,
          guardian_name: 'Protected (Authorized Staff Only)',
          guardian_phone: '••••••••••',
          guardian_address: 'Protected for Child Privacy',
          medical_notes: 'Encrypted & Confidential'
        };
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        total_children: children.length,
        boys_count: children.filter(c => c.gender === 'Male').length,
        girls_count: children.filter(c => c.gender === 'Female').length,
        filtered_count: filtered.length,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(filtered.length / limit)),
        is_authorized: authorized,
        children: sanitizedChildren
      }));
    }

    // 2. POST /api/children (Add new child to persistent cloud store)
    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      body = body || {};

      const nextId = Date.now();
      const highestSerialNum = children.reduce((max, c) => {
        const match = String(c.serial_no || '').match(/SN-CH-(\d+)/i);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);

      const nextSerial = body.serial_no || `SN-CH-${String(highestSerialNum + 1).padStart(3, '0')}`;
      const newChild = {
        id: nextId,
        serial_no: nextSerial,
        name: body.name || 'Student',
        age: parseInt(body.age) || 10,
        class: body.class || 'Class 5',
        gender: body.gender || 'Male',
        admission_date: body.admission_date || new Date().toISOString().split('T')[0],
        photo: body.photo ? body.photo.trim() : '',
        guardian_name: body.guardian_name || '',
        guardian_phone: body.guardian_phone || '',
        guardian_address: body.guardian_address || '',
        medical_notes: body.medical_notes || 'Normal routine checks.',
        hobbies: body.hobbies || 'Sports, Art, Reading',
        is_active: 1
      };

      children.push(newChild);
      children = sortChildrenAscending(children);
      await setCloudData('children', children, `Add child ${newChild.name} (${newChild.serial_no})`);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(newChild));
    }

    // 3. PUT /api/children/:id (Update child in cloud store)
    if (method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      body = body || {};

      const parts = url.split('?')[0].split('/');
      const childId = parts[parts.length - 1];

      children = children.map(c => {
        if (String(c.id) === String(childId)) {
          return { ...c, ...body, id: c.id };
        }
        return c;
      });
      children = sortChildrenAscending(children);
      await setCloudData('children', children, `Update child ${childId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ...body, id: childId }));
    }

    // 4. DELETE /api/children/:id (Remove child from cloud store)
    if (method === 'DELETE') {
      const parts = url.split('?')[0].split('/');
      const childId = parts[parts.length - 1];

      children = children.filter(c => String(c.id) !== String(childId));
      await setCloudData('children', children, `Delete child ${childId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Child record deleted successfully.' }));
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
};
