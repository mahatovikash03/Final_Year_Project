import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000,
});

// ── Token helper: reads from localStorage (persisted by zustand) ──────────
const getToken = (): string | null => {
  try {
    // Primary: zustand persist storage
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.token) return state.token;
    }
    // Fallback: direct key (for Capacitor WebView)
    return localStorage.getItem('ht360_token');
  } catch {
    return null;
  }
};

// ── Attach JWT on every request ───────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Handle 401 — redirect to login ───────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const path = window.location.pathname;
    const isAuthRoute = ['/', '/login', '/register', '/forgot-password', '/reset-password'].includes(path);

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('ht360_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
