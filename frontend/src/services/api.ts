import axios from 'axios';
import type { AuthResponse, ApiResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password }),
  register: (data: Record<string, unknown>) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: Record<string, unknown>) => api.patch('/auth/profile', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
};

export const deliveryApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/deliveries', { params }),
  getById: (id: string) => api.get(`/deliveries/${id}`),
  create: (data: Record<string, unknown>) => api.post('/deliveries', data),
  assign: (id: string, driverId: string) =>
    api.patch(`/deliveries/${id}/assign`, { driverId }),
  updateStatus: (id: string, status: string, note?: string) =>
    api.patch(`/deliveries/${id}/status`, { status, note }),
  track: (trackingNumber: string) => api.get(`/track/${trackingNumber}`),
  rate: (id: string, rating: number) => api.post(`/deliveries/${id}/rate`, { rating }),
};

export const fleetApi = {
  getFleet: () => api.get('/fleet'),
  getAnalytics: (days = 30) => api.get('/analytics', { params: { days } }),
  getDrivers: (params?: Record<string, number>) => api.get('/drivers', { params }),
  getVehicles: (params?: Record<string, number>) => api.get('/vehicles', { params }),
  createVehicle: (data: Record<string, unknown>) => api.post('/vehicles', data),
};

export const driverApi = {
  updateLocation: (data: Record<string, unknown>) => api.post('/location', data),
  updateStatus: (data: { status?: string; isAvailable?: boolean }) =>
    api.patch('/drivers/status', data),
  getEarnings: () => api.get('/drivers/earnings'),
};

export const notificationApi = {
  getAll: (params?: Record<string, number>) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export default api;
