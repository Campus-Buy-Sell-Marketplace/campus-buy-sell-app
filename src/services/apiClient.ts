import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/env';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  async (config: any) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    } catch {}
    return config;
  },
  (error: any) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: any) => {
    console.log(`[API Response] ${response.status} ${response.config?.url}`);
    return response;
  },
  async (error: any) => {
    console.warn(`[API Error] ${error.message} - ${error.config?.baseURL}${error.config?.url}`, error.response?.data);
    if (error.response?.status === 401 && error.config?.url !== '/auth/login') {
      try {
        await (AsyncStorage as any).multiRemove(['authToken', 'userData']);
      } catch {}
    }
    return Promise.reject(error);
  }
);

export default apiClient;
