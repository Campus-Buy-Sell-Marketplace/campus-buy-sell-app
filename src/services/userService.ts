import apiClient from './apiClient';
import { User, Notification } from '../types';

export const userService = {
  async getProfile(): Promise<User> {
    const res = await apiClient.get('/user/profile');
    return res.data.data ?? res.data.user ?? res.data;
  },

  async updateProfile(data: Partial<User> & { avatar?: string }): Promise<User> {
    const res = await apiClient.put('/user/profile', data);
    return res.data.data ?? res.data.user ?? res.data;
  },

  async getWishlist(): Promise<string[]> {
    try {
      const res = await apiClient.get('/wishlist');
      const items = res.data.data ?? res.data.wishlist ?? res.data;
      return Array.isArray(items) ? items.map((i: any) => i.product_id ?? i.id ?? i) : [];
    } catch {
      return [];
    }
  },

  async addToWishlist(productId: string): Promise<void> {
    await apiClient.post(`/wishlist/${productId}`);
  },

  async removeFromWishlist(productId: string): Promise<void> {
    await apiClient.delete(`/wishlist/${productId}`);
  },

  async registerPushToken(token: string): Promise<void> {
    try {
      await apiClient.post('/user/push-token', { token });
    } catch {}
  },

  async getNotifications(): Promise<Notification[]> {
    try {
      const res = await apiClient.get('/user/notifications');
      return res.data.data ?? res.data.notifications ?? [];
    } catch {
      return [];
    }
  },

  async markNotificationRead(id: string): Promise<void> {
    try {
      await apiClient.patch(`/user/notifications/${id}/read`);
    } catch {}
  },
};
