import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '../utils/tokenStorage';
import { api } from '../services/apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  achievements: string[];
  preferences: {
    theme: 'dark' | 'light';
    notifications: boolean;
    studyReminder?: string;
  };
  rating?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
            '/auth/login',
            { email, password }
          );
          await tokenStorage.setItem('accessToken', data.accessToken);
          await tokenStorage.setItem('refreshToken', data.refreshToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          const message = err?.response?.data?.message || 'Login failed. Please check your credentials.';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      signup: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
            '/auth/register',
            { name, email, password }
          );
          await tokenStorage.setItem('accessToken', data.accessToken);
          await tokenStorage.setItem('refreshToken', data.refreshToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          const message = err?.response?.data?.message || 'Signup failed. Please try again.';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      logout: async () => {
        await tokenStorage.deleteItem('accessToken');
        await tokenStorage.deleteItem('refreshToken');
        set({ user: null, isAuthenticated: false });
      },

      loadSession: async () => {
        set({ isLoading: true });
        try {
          const token = await tokenStorage.getItem('accessToken');
          if (!token) {
            set({ isLoading: false });
            return;
          }
          const data = await api.get<{ user: User }>('/auth/me');
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch {
          await tokenStorage.deleteItem('accessToken');
          await tokenStorage.deleteItem('refreshToken');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) set({ user: { ...user, ...updates } });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
