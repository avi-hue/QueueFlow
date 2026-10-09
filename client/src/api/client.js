import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach access token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('queueflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Clean error handling for prototype
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid session
      localStorage.removeItem('queueflow_token');
      localStorage.removeItem('queueflow_user');
    }
    return Promise.reject(error);
  }
);

export default api;
