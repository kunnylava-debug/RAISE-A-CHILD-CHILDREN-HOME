const { getCloudData, setCloudData } = require('./cloudDb');
const defaultSettings = require('../data_cloud/settings.json');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const method = req.method;

  try {
    let settings = await getCloudData('settings', defaultSettings);

    // 1. GET /api/settings
    if (method === 'GET') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(settings || defaultSettings));
    }

    // 2. PUT /api/settings (Update settings, social links, contact info, etc.)
    if (method === 'PUT' || method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const current = settings || defaultSettings;
      const updated = {
        ...current,
        ...body
      };

      // Persist permanently to GitHub CloudStore
      await setCloudData('settings', updated, `Update hostel settings and social links [skip ci]`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: true,
        message: 'Settings and social links saved permanently to cloud.',
        settings: updated
      }));
    }

    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  } catch (err) {
    console.error('[API Settings Error]:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err.message || 'Settings server error' }));
  }
};
