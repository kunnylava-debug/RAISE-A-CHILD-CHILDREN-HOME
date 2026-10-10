const { getCloudData, setCloudData } = require('./cloudDb');

function sortAlumniAscending(list) {
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

  try {
    let alumniList = sortAlumniAscending(await getCloudData('alumni', []));

    // 1. GET /api/alumni (Public list of people who left from home / alumni)
    if (method === 'GET') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(alumniList));
    }

    // 2. POST /api/alumni (Add new alumnus or batch sync from local devices)
    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      // Batch import or sync from devices
      if (Array.isArray(body.records) && body.records.length > 0) {
        let changed = false;
        for (const item of body.records) {
          const exists = alumniList.some(a => 
            String(a.id) === String(item.id) || 
            (a.name && item.name && a.name.trim().toLowerCase() === item.name.trim().toLowerCase())
          );
          if (!exists) {
            alumniList.push({
              id: item.id || Date.now(),
              name: item.name || '',
              stay_years: item.stay_years || 'Alumni Member',
              current_position: item.current_position || '',
              location: item.location || '',
              photo_url: item.photo_url ? String(item.photo_url).trim() : '',
              quote: item.quote || '',
              order_num: Number(item.order_num) || (alumniList.length + 1)
            });
            changed = true;
          }
        }
        if (changed) {
          alumniList = sortAlumniAscending(alumniList);
          await setCloudData('alumni', alumniList, 'Sync alumni records from devices to cloud');
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(alumniList));
      }

      if (!body.name || !body.current_position) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Name and current position are required' }));
      }

      const highestOrder = alumniList.reduce((max, a) => Math.max(max, Number(a.order_num) || 0), 0);
      const newAlumnus = {
        id: body.id || Date.now(),
        name: String(body.name).trim(),
        stay_years: String(body.stay_years || 'Alumni Member').trim(),
        current_position: String(body.current_position).trim(),
        location: String(body.location || '').trim(),
        photo_url: body.photo_url ? String(body.photo_url).trim() : '',
        quote: String(body.quote || '').trim(),
        order_num: Number(body.order_num) || (highestOrder + 1)
      };

      const existingIdx = alumniList.findIndex(a => String(a.id) === String(newAlumnus.id));
      if (existingIdx >= 0) {
        alumniList[existingIdx] = { ...alumniList[existingIdx], ...newAlumnus };
      } else {
        alumniList.push(newAlumnus);
      }

      alumniList = sortAlumniAscending(alumniList);
      await setCloudData('alumni', alumniList, `Add/update alumnus ${newAlumnus.name}`);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(newAlumnus));
    }

    // 3. PUT /api/alumni/:id (Update alumnus)
    if (method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const parts = url.split('?')[0].split('/');
      const alId = parts[parts.length - 1];

      alumniList = alumniList.map(a => String(a.id) === String(alId) ? { ...a, ...body, id: a.id } : a);
      alumniList = sortAlumniAscending(alumniList);
      await setCloudData('alumni', alumniList, `Update alumnus ${alId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ...body, id: alId }));
    }

    // 4. DELETE /api/alumni/:id (Delete alumnus)
    if (method === 'DELETE') {
      const parts = url.split('?')[0].split('/');
      const alId = parts[parts.length - 1];

      alumniList = alumniList.filter(a => String(a.id) !== String(alId));
      await setCloudData('alumni', alumniList, `Delete alumnus ${alId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Alumni record removed successfully.' }));
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  } catch (err) {
    console.error('[API Alumni Error]:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Alumni server error' }));
  }
};
