import axios from 'axios';
import { LoginResponse, RegisterRequest, User } from '../../../shared/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('auth-token', response.data.token);
    }
    return response.data;
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('auth-token', response.data.token);
    }
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('auth-token');
  },
}; 