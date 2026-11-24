import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  signup: (data) => api.post('/api/signup', data),
  verifyEmail: (data) => api.post('/api/verify-email', data),
  login: (data) => api.post('/api/login', data),
  adminLogin: (data) => api.post('/api/admin/login', data),
  forgotPassword: (data) => api.post('/api/forgot-password', data),
  resetPassword: (data) => api.post('/api/reset-password', data),
  getProfile: () => api.get('/api/profile'),
};

// Destination APIs
export const destinationAPI = {
  getAll: () => api.get('/api/destinations'),
  getById: (id) => api.get(`/api/destinations/${id}`),
  create: (data) => api.post('/api/admin/destinations', data),
  update: (id, data) => api.put(`/api/admin/destinations/${id}`, data),
  delete: (id) => api.delete(`/api/admin/destinations/${id}`),
};

// Booking APIs
export const bookingAPI = {
  create: (data) => api.post('/api/bookings', data),
  getUserBookings: (userId) => api.get(`/api/bookings/user/${userId}`),
};

export default api;