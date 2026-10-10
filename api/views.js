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
    let viewsData = await getCloudData('views', { categories: [], photos: [], deleted_photo_ids: [] });
    if (!viewsData || typeof viewsData !== 'object' || Array.isArray(viewsData)) {
      viewsData = { categories: [], photos: [], deleted_photo_ids: [] };
    }
    if (!Array.isArray(viewsData.categories)) viewsData.categories = [];
    if (!Array.isArray(viewsData.photos)) viewsData.photos = [];
    if (!Array.isArray(viewsData.deleted_photo_ids)) viewsData.deleted_photo_ids = [];

    // 1. GET /api/views
    if (method === 'GET') {
      // Special endpoint for deleted photo IDs
      if (url.includes('/deleted-ids')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(viewsData.deleted_photo_ids || []));
      }

      // Format response as categories with photos (matching server/src/routes/views.js)
      const result = (viewsData.categories || []).map(cat => ({
        ...cat,
        photos: (viewsData.photos || []).filter(p => String(p.category_id) === String(cat.id))
      }));

      // If no categories yet, also attach photos directly in fallback category
      if (result.length === 0 && (viewsData.photos || []).length > 0) {
        result.push({
          id: 1,
          slug: 'general',
          name: 'Campus Gallery',
          description: 'Campus facility photos',
          photos: viewsData.photos
        });
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(result));
    }

    // 2. POST /api/views/photos
    if (method === 'POST' && url.includes('/photos')) {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const newPhoto = {
        id: body.id || ('photo_' + Date.now()),
        category_id: body.category_id || 1,
        title: body.title || 'Campus Facility Photo',
        description: body.description || '',
        image_url: body.image_url || '',
        wing: body.wing || 'both',
        facility_type: body.facility_type || 'rooms',
        order_num: (viewsData.photos.length || 0) + 1
      };

      viewsData.photos.push(newPhoto);
      await setCloudData('views', viewsData, `Add campus photo ${newPhoto.title}`);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(newPhoto));
    }

    // 3. POST /api/views/deleted-ids (Save or restore deleted photo IDs)
    if (method === 'POST' && url.includes('/deleted-ids')) {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const ids = Array.isArray(body.deleted_photo_ids) ? body.deleted_photo_ids : [];
      viewsData.deleted_photo_ids = ids;
      await setCloudData('views', viewsData, 'Update campus deleted photo IDs');

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: true, deleted_photo_ids: ids }));
    }

    // 4. DELETE /api/views/photos/:id
    if (method === 'DELETE' && url.includes('/photos/')) {
      const parts = url.split('?')[0].split('/');
      const photoId = parts[parts.length - 1];

      viewsData.photos = viewsData.photos.filter(p => String(p.id) !== String(photoId));
      if (!viewsData.deleted_photo_ids.includes(photoId)) {
        viewsData.deleted_photo_ids.push(photoId);
      }
      await setCloudData('views', viewsData, `Delete photo ${photoId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Photo deleted successfully.' }));
    }

    // 5. POST /api/views/categories
    if (method === 'POST' && url.includes('/categories')) {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body || {};

      const newCat = {
        id: Date.now(),
        slug: (body.name || 'facility').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: body.name || 'New Facility',
        description: body.description || '',
        order_num: (viewsData.categories.length || 0) + 1
      };

      viewsData.categories.push(newCat);
      await setCloudData('views', viewsData, `Add campus category ${newCat.name}`);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ...newCat, photos: [] }));
    }

    // 6. DELETE /api/views/categories/:id
    if (method === 'DELETE' && url.includes('/categories/')) {
      const parts = url.split('?')[0].split('/');
      const catId = parts[parts.length - 1];

      viewsData.categories = viewsData.categories.filter(c => String(c.id) !== String(catId));
      viewsData.photos = viewsData.photos.filter(p => String(p.category_id) !== String(catId));
      await setCloudData('views', viewsData, `Delete category ${catId}`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ message: 'Category deleted successfully.' }));
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  } catch (err) {
    console.error('[API Views Error]:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Views server error' }));
  }
};
