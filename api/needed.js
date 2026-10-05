const { getCloudData, setCloudData } = require('./cloudDb');

function extractNeededRoute(req) {
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

  const tokens = fullPath.split('/').filter(t => Boolean(t) && t !== 'api' && t !== 'needed' && t !== 'needed.js');
  return { rawUrl, fullPath, tokens };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const { tokens } = extractNeededRoute(req);
  const method = req.method;

  try {
    let items = await getCloudData('needed', []);

    if (method === 'GET' && tokens.length === 0) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(items));
    }

    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const newItem = {
        id: Date.now(),
        item_name: body.item_name || 'Needed Item',
        category: body.category || 'General',
        quantity_needed: Number(body.quantity_needed) || 1,
        quantity_received: Number(body.quantity_received) || 0,
        estimated_price: Number(body.estimated_price) || 0,
        urgency: body.urgency || 'Medium',
        description: body.description || '',
        is_fulfilled: (Number(body.quantity_received) || 0) >= (Number(body.quantity_needed) || 1) ? 1 : 0
      };

      items.push(newItem);
      await setCloudData('needed', items, `Add needed item ${newItem.item_name}`);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(newItem));
    }

    if (method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const itemId = tokens[0];

      let updatedItem = null;
      items = items.map(item => {
        if (String(item.id) === String(itemId)) {
          const rec = body.quantity_received !== undefined ? Number(body.quantity_received) : item.quantity_received;
          const need = body.quantity_needed !== undefined ? Number(body.quantity_needed) : item.quantity_needed;
          updatedItem = {
            ...item,
            ...body,
            id: item.id,
            quantity_received: rec,
            quantity_needed: need,
            is_fulfilled: rec >= need ? 1 : 0
          };
          return updatedItem;
        }
        return item;
      });

      if (!updatedItem) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: `Needed item ${itemId} not found` }));
      }

      await setCloudData('needed', items, `Update needed item ${itemId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(updatedItem));
    }

    if (method === 'DELETE') {
      const itemId = tokens[0];

      items = items.filter(item => String(item.id) !== String(itemId));
      await setCloudData('needed', items, `Delete needed item ${itemId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Needed item removed successfully.' }));
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
};
