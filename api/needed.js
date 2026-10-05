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
    let items = await getCloudData('needed', []);

    if (method === 'GET') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(items));
    }

    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
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
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      body = body || {};

      const parts = url.split('?')[0].split('/').filter(Boolean);
      const itemId = parts[parts.length - 1];

      items = items.map(item => {
        if (String(item.id) === String(itemId)) {
          const updated = { ...item, ...body, id: item.id };
          if (updated.quantity_received !== undefined && updated.quantity_needed !== undefined) {
            updated.is_fulfilled = Number(updated.quantity_received) >= Number(updated.quantity_needed) ? 1 : 0;
          }
          return updated;
        }
        return item;
      });

      await setCloudData('needed', items, `Update needed item ${itemId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ...body, id: itemId }));
    }

    if (method === 'DELETE') {
      const parts = url.split('?')[0].split('/').filter(Boolean);
      const itemId = parts[parts.length - 1];

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
