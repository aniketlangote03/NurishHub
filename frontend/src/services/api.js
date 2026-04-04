import axios from 'axios';

// The base URL must point to your backend API. E.g., http://localhost:5000/api
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle standard responses and errors
api.interceptors.response.use(
  (response) => {
    // Return standard { success, message, data } directly
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Token expires or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid redirect looping if the request was to login/register
      if (!originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/register')) {
        originalRequest._retry = true;
        // Optionally implement a refresh token sequence here
        // For now, logout on 401:
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Extract standardize backend message or fallback
    const errMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(errMessage);
  }
);

// ─── AUTHENTICATION API ────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  logout: () => Promise.resolve({ success: true }),
};

// ─── DONATIONS API ─────────────────────────────────────────────────────────────
export const donationsAPI = {
  getAll: (params) => api.get('/donations', { params }),
  getNearby: (lat, lng, radius) => api.get('/donations/nearby', { params: { lat, lng, radius } }),
  getById: (id) => api.get(`/donations/${id}`),
  /**
   * Create donation. Pass optional `imageFiles` (File[]) to upload photos (multipart payload + images).
   */
  create: (data, imageFiles = null) => {
    if (imageFiles?.length) {
      const fd = new FormData();
      fd.append('payload', JSON.stringify(data));
      imageFiles.forEach((file) => fd.append('images', file));
      return api.post('/donations', fd);
    }
    return api.post('/donations', data);
  },
  update: (id, data) => api.put(`/donations/${id}`, data),
  delete: (id) => api.delete(`/donations/${id}`),
  getMyDonations: () => api.get('/donations/my'),
};

// ─── NGO REQUESTS API ──────────────────────────────────────────────────────────
export const requestsAPI = {
  getAll: (params) => api.get('/requests', { params }),
  getById: (id) => api.get(`/requests/${id}`),
  create: (data) => api.post('/requests', data),
  approve: (id) => api.put(`/requests/${id}/approve`),
  reject: (id) => api.put(`/requests/${id}/reject`),
  cancel: (id) => api.put(`/requests/${id}/cancel`),
};

// ─── VOLUNTEER PICKUPS API ─────────────────────────────────────────────────────
export const pickupsAPI = {
  getAll: (params) => api.get('/pickup', { params }),
  getById: (id) => api.get(`/pickup/${id}`),
  updateStatus: (id, status, extra = {}) => api.put('/pickup/status', { pickupId: id, status, ...extra }),
  getNearbyVolunteers: (lat, lng, radius) => api.get('/pickup/nearby-volunteers', { params: { lat, lng, radius } }),
  assign: (data) => api.post('/pickup/assign', data),
};

// ─── CHAT API ──────────────────────────────────────────────────────────────────
export const chatAPI = {
  getContacts: () => api.get('/messages'), // Our backend groups recent chats
  getUnreadCount: () => api.get('/messages/unread/count'),
  getMessages: (userId) => api.get(`/messages/${userId}`),
  sendMessage: (receiverId, text) => api.post('/messages', { receiverId, text }),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
};

// ─── FEEDBACK API ──────────────────────────────────────────────────────────────
export const feedbackAPI = {
  getAll: (params) => api.get('/feedback', { params }),
  getById: (id) => api.get(`/feedback/${id}`),
  submit: (data) => api.post('/feedback', data),
  reply: (id, text) => api.post(`/feedback/${id}/reply`, { text }),
};

// ─── NOTIFICATIONS API ─────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  clearAll: () => api.delete('/notifications/clear-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ─── USERS API ─────────────────────────────────────────────────────────────────
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/update', data),
  uploadAvatar: (formData) => api.put('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  toggleAvailability: () => api.put('/users/volunteer/availability'),
};

// ─── ADMIN API ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/stats'),
  getAnalytics: (period) => api.get('/admin/analytics', { params: { period } }),
  getUsers: (params) => api.get('/admin/users', { params }),
  verifyNGO: (id, status) => api.put(`/admin/ngo/${id}/verify`, { status }),
};

// ─── MATCHING API ──────────────────────────────────────────────────────────────
export const matchingAPI = {
  getNearby: (params) => api.get('/matching/nearby', { params }),
  autoAssign: (data) => api.post('/matching/auto-assign', data),
  getStats: () => api.get('/matching/stats'),
};

export default api;
