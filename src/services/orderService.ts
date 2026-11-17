import apiClient from './apiClient';
import { Order } from '../types';

export const orderService = {
  async getOrders(): Promise<Order[]> {
    const res = await apiClient.get('/orders');
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) return data;
    return data.orders ?? [];
  },

  async getOrderById(id: string): Promise<Order> {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data.data ?? res.data.order ?? res.data;
  },

  async createOrder(cartItemIds: string[]): Promise<Order[]> {
    const res = await apiClient.post('/orders', { cart_item_ids: cartItemIds });
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) return data;
    return data.orders ?? [data.order ?? data];
  },

  async cancelOrder(id: string): Promise<void> {
    await apiClient.patch(`/orders/${id}/cancel`);
  },
};
