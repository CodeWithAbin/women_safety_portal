import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

// Request Interceptor: Attach JWT token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Token Expiration gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token is invalid or expired, clear localStorage and dispatch custom logout event
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Helper to resolve static photo URLs from backend
 */
export const getPhotoUrl = (photoPath) => {
  if (!photoPath) return '/placeholder-place.jpg';
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  const cleanPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
  return `${API_BASE_URL}${cleanPath}`;
};

/**
 * Authentication Services
 */
export const authService = {
  register: async (userData) => {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },
  login: async (credentials) => {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  }
};

/**
 * User Places Services
 */
export const placeService = {
  getAcceptedPlaces: async (state, district) => {
    const params = {};
    if (state && state.trim()) params.state = state.trim();
    if (district && district.trim()) params.district = district.trim();
    const response = await apiClient.get('/api/places', { params });
    return response.data;
  },
  reportPlace: async (formData) => {
    const response = await apiClient.post('/api/places/report', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

/**
 * User Notifications Services
 */
export const notificationService = {
  getNotifications: async () => {
    const response = await apiClient.get('/api/notifications');
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await apiClient.patch(`/api/notifications/${id}/read`);
    return response.data;
  }
};

/**
 * Admin Moderation & Management Services
 */
export const adminService = {
  getPendingReports: async (status = 'pending') => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/api/admin/reports', { params });
    return response.data;
  },
  updateReportStatus: async (id, status) => {
    const response = await apiClient.patch(`/api/admin/reports/${id}/status`, { status });
    return response.data;
  },
  getPlaces: async (state, district) => {
    const params = {};
    if (state && state.trim()) params.state = state.trim();
    if (district && district.trim()) params.district = district.trim();
    const response = await apiClient.get('/api/admin/places', { params });
    return response.data;
  },
  createPlace: async (formData) => {
    const response = await apiClient.post('/api/admin/places', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  updatePlace: async (id, data, isMultipart = false) => {
    const config = isMultipart ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await apiClient.put(`/api/admin/places/${id}`, data, config);
    return response.data;
  },
  deletePlace: async (id) => {
    const response = await apiClient.delete(`/api/admin/places/${id}`);
    return response.data;
  },
  getUsers: async (state, district) => {
    const params = {};
    if (state && state.trim()) params.state = state.trim();
    if (district && district.trim()) params.district = district.trim();
    const response = await apiClient.get('/api/admin/users', { params });
    return response.data;
  },
  updateUser: async (id, userData) => {
    const response = await apiClient.put(`/api/admin/users/${id}`, userData);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await apiClient.delete(`/api/admin/users/${id}`);
    return response.data;
  }
};

export default apiClient;
