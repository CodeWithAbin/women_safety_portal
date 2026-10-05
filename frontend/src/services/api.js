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
  getAcceptedPlaces: async (state, district, search, minRating, sort, latitude, longitude, radiusKm) => {
    const params = {};
    if (state && typeof state === 'object') {
      const opts = state;
      if (opts.state && typeof opts.state === 'string' && opts.state.trim()) params.state = opts.state.trim();
      if (opts.district && typeof opts.district === 'string' && opts.district.trim()) params.district = opts.district.trim();
      if (opts.search && typeof opts.search === 'string' && opts.search.trim()) params.search = opts.search.trim();
      if (opts.minRating !== undefined && opts.minRating !== null && opts.minRating !== '') params.minRating = opts.minRating;
      if (opts.sort && typeof opts.sort === 'string' && opts.sort.trim()) params.sort = opts.sort.trim();
      if (opts.latitude !== undefined && opts.latitude !== null && opts.latitude !== '') params.latitude = opts.latitude;
      if (opts.longitude !== undefined && opts.longitude !== null && opts.longitude !== '') params.longitude = opts.longitude;
      if (opts.radiusKm !== undefined && opts.radiusKm !== null && opts.radiusKm !== '') params.radiusKm = opts.radiusKm;
    } else {
      if (state && typeof state === 'string' && state.trim()) params.state = state.trim();
      if (district && typeof district === 'string' && district.trim()) params.district = district.trim();
      if (search && typeof search === 'string' && search.trim()) params.search = search.trim();
      if (minRating !== undefined && minRating !== null && minRating !== '') params.minRating = minRating;
      if (sort && typeof sort === 'string' && sort.trim()) params.sort = sort.trim();
      if (latitude !== undefined && latitude !== null && latitude !== '') params.latitude = latitude;
      if (longitude !== undefined && longitude !== null && longitude !== '') params.longitude = longitude;
      if (radiusKm !== undefined && radiusKm !== null && radiusKm !== '') params.radiusKm = radiusKm;
    }
    const response = await apiClient.get('/api/places', { params });
    return response.data;
  },
  reportPlace: async (formData) => {
    const response = await apiClient.post('/api/places/report', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  ratePlace: async (id, rating) => {
    const response = await apiClient.post(`/api/places/${id}/rate`, { rating });
    return response.data;
  },
  checkSimilar: async ({ state, district, address, name }) => {
    const params = { state, district, address, name };
    const response = await apiClient.get('/api/places/check-similar', { params });
    return response.data;
  },
  getMyReports: async () => {
    const response = await apiClient.get('/api/places/my-reports');
    return response.data;
  },
  getPlaceById: async (id) => {
    const response = await apiClient.get(`/api/places/${id}`);
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
  getPlaces: async (state, district, search, minRating, sort) => {
    const params = {};
    if (state && typeof state === 'object') {
      const opts = state;
      if (opts.state && typeof opts.state === 'string' && opts.state.trim()) params.state = opts.state.trim();
      if (opts.district && typeof opts.district === 'string' && opts.district.trim()) params.district = opts.district.trim();
      if (opts.search && typeof opts.search === 'string' && opts.search.trim()) params.search = opts.search.trim();
      if (opts.minRating !== undefined && opts.minRating !== null && opts.minRating !== '') params.minRating = opts.minRating;
      if (opts.sort && typeof opts.sort === 'string' && opts.sort.trim()) params.sort = opts.sort.trim();
    } else {
      if (state && typeof state === 'string' && state.trim()) params.state = state.trim();
      if (district && typeof district === 'string' && district.trim()) params.district = district.trim();
      if (search && typeof search === 'string' && search.trim()) params.search = search.trim();
      if (minRating !== undefined && minRating !== null && minRating !== '') params.minRating = minRating;
      if (sort && typeof sort === 'string' && sort.trim()) params.sort = sort.trim();
    }
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
  resolvePlace: async (id) => {
    const response = await apiClient.patch(`/api/admin/places/${id}/resolve`);
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
  },
  getSafetyTips: async () => {
    const response = await apiClient.get('/api/admin/safety-info/tips');
    return response.data;
  },
  createSafetyTip: async (data) => {
    const response = await apiClient.post('/api/admin/safety-info/tips', data);
    return response.data;
  },
  updateSafetyTip: async (id, data) => {
    const response = await apiClient.put(`/api/admin/safety-info/tips/${id}`, data);
    return response.data;
  },
  deleteSafetyTip: async (id) => {
    const response = await apiClient.delete(`/api/admin/safety-info/tips/${id}`);
    return response.data;
  },
  getEmergencyContacts: async () => {
    const response = await apiClient.get('/api/admin/safety-info/emergency-contacts');
    return response.data;
  },
  createEmergencyContact: async (data) => {
    const response = await apiClient.post('/api/admin/safety-info/emergency-contacts', data);
    return response.data;
  },
  updateEmergencyContact: async (id, data) => {
    const response = await apiClient.put(`/api/admin/safety-info/emergency-contacts/${id}`, data);
    return response.data;
  },
  deleteEmergencyContact: async (id) => {
    const response = await apiClient.delete(`/api/admin/safety-info/emergency-contacts/${id}`);
    return response.data;
  }
};

/**
 * Safety Information & Emergency Contacts Services (User-facing)
 */
export const safetyInfoService = {
  getTips: async () => {
    const response = await apiClient.get('/api/safety-info/tips');
    return response.data;
  },
  getEmergencyContacts: async () => {
    const response = await apiClient.get('/api/safety-info/emergency-contacts');
    return response.data;
  }
};

/**
 * Community Companion Services (Phase 6)
 */
export const companionService = {
  searchUsers: async (query) => {
    const params = { query: query ? query.trim() : '' };
    const response = await apiClient.get('/api/companions/search', { params });
    return response.data;
  },
  sendRequest: async ({ recipientId, recipientEmail }) => {
    const payload = {};
    if (recipientId) payload.recipient_id = recipientId;
    if (recipientEmail) payload.recipient_email = recipientEmail.trim();
    const response = await apiClient.post('/api/companions/requests', payload);
    return response.data;
  },
  getPendingRequests: async () => {
    const response = await apiClient.get('/api/companions/requests');
    return response.data;
  },
  acceptRequest: async (id) => {
    const response = await apiClient.patch(`/api/companions/requests/${id}/accept`);
    return response.data;
  },
  rejectRequest: async (id) => {
    const response = await apiClient.patch(`/api/companions/requests/${id}/reject`);
    return response.data;
  },
  getAcceptedCompanions: async () => {
    const response = await apiClient.get('/api/companions');
    return response.data;
  },
  removeCompanion: async (id) => {
    const response = await apiClient.delete(`/api/companions/${id}`);
    return response.data;
  }
};

/**
 * Safe Walk Journey Services (Phase 6)
 */
export const safeWalkService = {
  createSafeWalk: async (data) => {
    const response = await apiClient.post('/api/safe-walks', data);
    return response.data;
  },
  getActiveSafeWalk: async () => {
    const response = await apiClient.get('/api/safe-walks/active');
    return response.data;
  },
  getSafeWalkById: async (id) => {
    const response = await apiClient.get(`/api/safe-walks/${id}`);
    return response.data;
  },
  completeSafeWalk: async (id) => {
    const response = await apiClient.patch(`/api/safe-walks/${id}/complete`);
    return response.data;
  },
  cancelSafeWalk: async (id) => {
    const response = await apiClient.patch(`/api/safe-walks/${id}/cancel`);
    return response.data;
  },
  updateLocation: async (id, { latitude, longitude }) => {
    const response = await apiClient.patch(`/api/safe-walks/${id}/location`, { latitude, longitude });
    return response.data;
  },
  extendSafeWalk: async (id, extensionMinutes) => {
    const response = await apiClient.patch(`/api/safe-walks/${id}/extend`, { extension_minutes: extensionMinutes });
    return response.data;
  },
  triggerSos: async (id) => {
    const response = await apiClient.post(`/api/safe-walks/${id}/sos`);
    return response.data;
  }
};

export default apiClient;

