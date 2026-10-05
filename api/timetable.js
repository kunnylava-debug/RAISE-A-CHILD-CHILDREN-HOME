const { getCloudData, setCloudData } = require('./cloudDb');

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
    let schedule = await getCloudData('timetable', []);

    if (method === 'GET') {
      const sorted = [...schedule].sort((a, b) => (Number(a.order_num) || 0) - (Number(b.order_num) || 0) || (Number(a.id) || 0) - (Number(b.id) || 0));
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(sorted));
    }

    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const newRow = {
        id: Date.now(),
        time_slot: body.time_slot || '',
        activity: body.activity || '',
        location_or_notes: body.location_or_notes || '',
        icon_name: body.icon_name || 'Clock',
        order_num: body.order_num || schedule.length + 1
      };

      schedule.push(newRow);
      await setCloudData('timetable', schedule, `Add timetable activity ${newRow.activity}`);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(newRow));
    }

    if (method === 'PUT' && url.includes('/reorder')) {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const orderedIds = body.ordered_ids || [];
      schedule.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
      await setCloudData('timetable', schedule, 'Reorder timetable');

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Timetable reordered successfully.' }));
    }

    if (method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const parts = url.split('?')[0].split('/');
      const rowId = parts[parts.length - 1];

      schedule = schedule.map(r => String(r.id) === String(rowId) ? { ...r, ...body, id: r.id } : r);
      await setCloudData('timetable', schedule, `Update timetable activity ${rowId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ...body, id: rowId }));
    }

    if (method === 'DELETE') {
      const parts = url.split('?')[0].split('/');
      const rowId = parts[parts.length - 1];

      schedule = schedule.filter(r => String(r.id) !== String(rowId));
      await setCloudData('timetable', schedule, `Delete timetable activity ${rowId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Timetable row deleted successfully.' }));
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
};
