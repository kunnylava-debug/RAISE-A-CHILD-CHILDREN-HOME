const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getAuthToken() {
  return localStorage.getItem('rac_admin_token') || localStorage.getItem('shanti_admin_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('rac_admin_token', token);
  } else {
    localStorage.removeItem('rac_admin_token');
    localStorage.removeItem('shanti_admin_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  verifyAuth: () => request('/auth/verify'),
  changePassword: (data) => request('/auth/change-password', { method: 'POST', body: data }),
  updateCredentials: (data) => request('/auth/update-credentials', { method: 'POST', body: data }),

  // Alumni (Where Are They Now)
  getAlumni: () => request('/alumni'),
  createAlumni: (data) => request('/alumni', { method: 'POST', body: data }),
  updateAlumni: (id, data) => request(`/alumni/${id}`, { method: 'PUT', body: data }),
  deleteAlumni: (id) => request(`/alumni/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: data }),

  // Staff
  getStaff: () => request('/staff'),
  getStaffMember: (id) => request(`/staff/${id}`),
  createStaff: (data) => request('/staff', { method: 'POST', body: data }),
  updateStaff: (id, data) => request(`/staff/${id}`, { method: 'PUT', body: data }),
  deleteStaff: (id) => request(`/staff/${id}`, { method: 'DELETE' }),

  // Licence
  getLicence: () => request('/licence'),
  updateLicence: (data) => request('/licence', { method: 'PUT', body: data }),

  // Children
  getChildren: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/children${q ? `?${q}` : ''}`);
  },
  getChild: (id) => request(`/children/${id}`),
  createChild: (data) => request('/children', { method: 'POST', body: data }),
  updateChild: (id, data) => request(`/children/${id}`, { method: 'PUT', body: data }),
  deleteChild: (id) => request(`/children/${id}`, { method: 'DELETE' }),

  // Views / Facilities
  getViews: () => request('/views'),
  createCategory: (data) => request('/views/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`/views/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => request(`/views/categories/${id}`, { method: 'DELETE' }),
  addPhoto: (data) => request('/views/photos', { method: 'POST', body: data }),
  deletePhoto: (id) => request(`/views/photos/${id}`, { method: 'DELETE' }),

  // Events
  getEvents: () => request('/events'),
  createEvent: (data) => request('/events', { method: 'POST', body: data }),
  updateEvent: (id, data) => request(`/events/${id}`, { method: 'PUT', body: data }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),

  // Admissions
  submitAdmission: (data) => request('/admissions', { method: 'POST', body: data }),
  getAdmissions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/admissions${q ? `?${q}` : ''}`);
  },
  updateAdmissionStatus: (id, data) => request(`/admissions/${id}/status`, { method: 'PUT', body: data }),
  deleteAdmission: (id) => request(`/admissions/${id}`, { method: 'DELETE' }),
  trackAdmission: (app_no, phone = '') => request(`/admissions/track?app_no=${encodeURIComponent(app_no)}${phone ? `&phone=${encodeURIComponent(phone)}` : ''}`),
  sendAdmissionNotification: (id) => request(`/admissions/${id}/notify`, { method: 'POST' }),

  // Timetable
  getTimetable: () => request('/timetable'),
  createTimetableRow: (data) => request('/timetable', { method: 'POST', body: data }),
  updateTimetableRow: (id, data) => request(`/timetable/${id}`, { method: 'PUT', body: data }),
  deleteTimetableRow: (id) => request(`/timetable/${id}`, { method: 'DELETE' }),
  reorderTimetable: (ordered_ids) => request('/timetable/reorder', { method: 'PUT', body: { ordered_ids } }),

  // Menu
  getMenu: () => request('/menu'),
  updateMenuDay: (id, data) => request(`/menu/${id}`, { method: 'PUT', body: data }),

  // Needed Items
  getNeededItems: () => request('/needed'),
  createNeededItem: (data) => request('/needed', { method: 'POST', body: data }),
  updateNeededItem: (id, data) => request(`/needed/${id}`, { method: 'PUT', body: data }),
  deleteNeededItem: (id) => request(`/needed/${id}`, { method: 'DELETE' }),

  // Supporters
  getSupporters: () => request('/supporters'),
  createSupporter: (data) => request('/supporters', { method: 'POST', body: data }),
  updateSupporter: (id, data) => request(`/supporters/${id}`, { method: 'PUT', body: data }),
  deleteSupporter: (id) => request(`/supporters/${id}`, { method: 'DELETE' }),

  // Donations
  recordDonation: (data) => request('/donations', { method: 'POST', body: data }),
  getDonations: () => request('/donations'),

  // File Upload
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAuthToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    return data;
  }
};
