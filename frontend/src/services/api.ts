import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000, // 30s — needed for AI chat (Claude API can take a few seconds)
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    }
  } catch {}
  return config;
});

// Handle 401 — only redirect if NOT on login/register pages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute =
      window.location.pathname === '/login' ||
      window.location.pathname === '/register' ||
      window.location.pathname === '/';

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
