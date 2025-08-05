import axios from 'axios';

// Use environment variable if available, otherwise check if we're on Render
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname.includes('onrender.com') 
    ? 'https://paycile-api.onrender.com' 
    : 'http://localhost:3001');

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

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api; 