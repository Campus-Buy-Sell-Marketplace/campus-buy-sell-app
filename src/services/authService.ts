import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, RegisterData, User } from '../types';

interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/login', credentials);
    const { user, token } = res.data.data ?? res.data;
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    return { user, token };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/register', data);
    const { user, token } = res.data.data ?? res.data;
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    return { user, token };
  },

  async googleLogin(googleToken: string): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/google', { token: googleToken });
    const { user, token } = res.data.data ?? res.data;
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    return { user, token };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {} finally {
      await AsyncStorage.multiRemove(['authToken', 'userData']);
    }
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get('/auth/me');
    return res.data.data ?? res.data.user ?? res.data;
  },

  async loadFromStorage(): Promise<{ user: User | null; token: string | null }> {
    try {
      const tokenRaw = await AsyncStorage.getItem('authToken');
      const userRaw = await AsyncStorage.getItem('userData');
      return {
        token: tokenRaw ?? null,
        user: userRaw ? JSON.parse(userRaw) : null,
      };
    } catch {
      return { user: null, token: null };
    }
  },
};
