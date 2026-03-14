import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.response?.data?.unverified) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  verifySignup: (data) => api.post('/auth/verify-signup', data),
  logout: () => api.post('/auth/logout'),
};

// Dashboard
export const dashboardAPI = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
  getChart: (params) => api.get('/dashboard/chart', { params }),
  getLowStock: (params) => api.get('/dashboard/low-stock', { params }),
};

// Products
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Warehouses
export const warehousesAPI = {
  getAll: () => api.get('/warehouses'),
  create: (data) => api.post('/warehouses', data),
};

// Receipts
export const receiptsAPI = {
  getAll: () => api.get('/receipts'),
  create: (data) => api.post('/receipts', data),
  validate: (id) => api.put(`/receipts/${id}/validate`),
  cancel: (id) => api.put(`/receipts/${id}/cancel`),
};

// Deliveries
export const deliveriesAPI = {
  getAll: () => api.get('/deliveries'),
  create: (data) => api.post('/deliveries', data),
  validate: (id) => api.put(`/deliveries/${id}/validate`),
  cancel: (id) => api.put(`/deliveries/${id}/cancel`),
};

// Transfers
export const transfersAPI = {
  getAll: () => api.get('/transfers'),
  create: (data) => api.post('/transfers', data),
  validate: (id) => api.put(`/transfers/${id}/validate`),
  cancel: (id) => api.put(`/transfers/${id}/cancel`),
};

// Adjustments
export const adjustmentsAPI = {
  getAll: () => api.get('/adjustments'),
  create: (data) => api.post('/adjustments', data),
};

// Stock History
export const stockHistoryAPI = {
  getAll: (params) => api.get('/stock-history', { params }),
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Profile
export const profileAPI = {
  get: () => api.get('/auth/profile'),
  update: (data) => api.put('/auth/profile', data),
};

export default api;
