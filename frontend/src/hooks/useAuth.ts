import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  gender?: string;
  age?: number;
  city?: string;
  state?: string;
  country?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, gender?: string, age?: number, city?: string, state?: string, country?: string) => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({ user: data.user, token: data.token, isLoading: false });
        } catch (err: any) {
          set({ isLoading: false });
          throw new Error(err.response?.data?.message || 'Login failed.');
        }
      },

      register: async (name, email, password, gender, age, city, state, country) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', { name, email, password, gender, age, city, state, country });
          set({ user: data.user, token: data.token, isLoading: false });
        } catch (err: any) {
          set({ isLoading: false });
          throw new Error(err.response?.data?.message || 'Registration failed.');
        }
      },

      logout: () => {
        set({ user: null, token: null });
      },

      updateUser: (partial) => {
        set(state => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);
