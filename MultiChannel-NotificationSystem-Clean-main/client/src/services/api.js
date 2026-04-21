import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name) => api.post('/auth/register', { email, password, name }),
  getMe: () => api.get('/auth/me'),
};

export const notificationAPI = {
  send: (data) => api.post('/notifications/send', data),
  getByCorrelationId: (correlationId) => api.get(`/notifications/${correlationId}`),
  list: (filters) => api.get('/notifications', { params: filters }),
  retry: (id, channel) => api.post(`/notifications/${id}/retry/${channel}`),
  getStats: (filters) => api.get('/notifications/stats/delivery', { params: filters }),
};

export const templateAPI = {
  getAll: () => api.get('/templates'),
  getById: (id) => {
    // Early validation to prevent unnecessary API calls
    if (!id || id === 'undefined' || id === 'new' || id === 'new:1') {
      return Promise.reject(new Error('Invalid template ID'));
    }
    // Additional validation for MongoDB ObjectId format (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return Promise.reject(new Error('Invalid template ID format'));
    }
    return api.get(`/templates/${id}`);
  },
  getByCode: (code) => api.get(`/templates/code/${code}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => {
    if (!id || id === 'undefined' || id === 'new' || id === 'new:1') {
      return Promise.reject(new Error('Invalid template ID'));
    }
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return Promise.reject(new Error('Invalid template ID format'));
    }
    return api.put(`/templates/${id}`, data);
  },
  preview: (id, channel, data, locale = 'en') => {
    if (!id || id === 'undefined' || id === 'new' || id === 'new:1') {
      return Promise.reject(new Error('Invalid template ID'));
    }
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return Promise.reject(new Error('Invalid template ID format'));
    }
    return api.post(`/templates/${id}/preview`, { channel, data, locale });
  },
  validate: (id, data) => {
    if (!id || id === 'undefined' || id === 'new' || id === 'new:1') {
      return Promise.reject(new Error('Invalid template ID'));
    }
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return Promise.reject(new Error('Invalid template ID format'));
    }
    return api.post(`/templates/${id}/validate`, { data });
  },
};

export const preferenceAPI = {
  getByUserId: (userId) => api.get(`/preferences/${userId}`),
  update: (userId, data) => api.put(`/preferences/${userId}`, data),
  getVapidPublicKey: () => api.get('/preferences/webpush/vapid-key'),
  addWebPushSubscription: (userId, subscription) =>
    api.post(`/preferences/${userId}/webpush`, { subscription }),
  removeWebPushSubscription: (userId, endpoint) =>
    api.delete(`/preferences/${userId}/webpush/${endpoint}`),
};

export default api;







