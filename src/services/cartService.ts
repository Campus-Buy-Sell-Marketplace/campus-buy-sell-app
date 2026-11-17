import apiClient from './apiClient';
import { CartItem } from '../types';

export const cartService = {
  async getCart(): Promise<CartItem[]> {
    const res = await apiClient.get('/cart');
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) return data;
    return data.items ?? [];
  },

  async addToCart(productId: string, quantity: number = 1): Promise<CartItem> {
    const res = await apiClient.post('/cart', { productId, quantity });
    return res.data.data ?? res.data.item ?? res.data;
  },

  async removeFromCart(cartItemId: string): Promise<void> {
    await apiClient.delete(`/cart/${cartItemId}`);
  },

  async clearCart(): Promise<void> {
    await apiClient.delete('/cart');
  },
};
