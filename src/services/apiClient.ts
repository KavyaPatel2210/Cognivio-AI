import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  // Extract local IP from Metro packager hostUri
  const hostUri = Constants.expoConfig?.hostUri || '';
  const packagerIp = hostUri.split(':')[0];

  if (url.includes('localhost')) {
    if (packagerIp) {
      return url.replace('localhost', packagerIp);
    } else if (Platform.OS === 'android') {
      return url.replace('localhost', '10.0.2.2');
    }
  }
  return url;
};

const BASE_URL = getBaseUrl();

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
            const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
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
    const response = await this.client.post<T>(url, data, config);
    return response.data;
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
