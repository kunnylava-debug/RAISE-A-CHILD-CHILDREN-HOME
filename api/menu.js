const { getCloudData, setCloudData } = require('./cloudDb');

const standardDaysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    let menu = await getCloudData('menu', []);

    if (method === 'GET') {
      const sorted = [...menu].sort((a, b) => {
        const indexA = standardDaysOrder.indexOf(a.day_of_week);
        const indexB = standardDaysOrder.indexOf(b.day_of_week);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return (a.id || 0) - (b.id || 0);
      });

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

      const newDay = {
        id: Date.now(),
        day_of_week: body.day_of_week,
        breakfast: body.breakfast || '',
        lunch: body.lunch || '',
        snacks: body.snacks || '',
        dinner: body.dinner || ''
      };

      menu.push(newDay);
      await setCloudData('menu', menu, `Add menu day ${newDay.day_of_week}`);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(newDay));
    }

    if (method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const parts = url.split('?')[0].split('/');
      const dayId = parts[parts.length - 1];

      menu = menu.map(m => String(m.id) === String(dayId) ? { ...m, ...body, id: m.id } : m);
      await setCloudData('menu', menu, `Update menu day ${dayId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ...body, id: dayId }));
    }

    if (method === 'DELETE') {
      const parts = url.split('?')[0].split('/');
      const dayId = parts[parts.length - 1];

      menu = menu.filter(m => String(m.id) !== String(dayId));
      await setCloudData('menu', menu, `Delete menu day ${dayId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Menu day deleted successfully.' }));
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
};
