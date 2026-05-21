import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Render API base URL (mobile should not rely on localhost substitutions)
const BASE_URL = 'https://cognivio-ai.onrender.com/api';

console.log('BASE_URL:', BASE_URL);



class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Request interceptor — attach JWT
    this.client.interceptors.request.use(async (config) => {
      const token = await tokenStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor — handle 401 with refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;
          try {
            const refreshToken = await tokenStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');
            const { data } = await this.client.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
            await tokenStorage.setItem('accessToken', data.accessToken);
            await tokenStorage.setItem('refreshToken', data.refreshToken);
            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return this.client(original);
          } catch {
            await tokenStorage.deleteItem('accessToken');
            await tokenStorage.deleteItem('refreshToken');
            throw error;
          }
        }
        throw error;
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (err: any) {
      console.log('API POST failed:', { url, status: err?.response?.status, data: err?.response?.data });
      if (err?.request && !err?.response) {
        console.log('API POST network error:', err.message);
      }
      throw err;
    }
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const api = new ApiService();
