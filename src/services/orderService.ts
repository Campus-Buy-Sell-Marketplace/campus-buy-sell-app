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

  async checkout(data: {
    meetupLocation: string;
    meetupTime: string;
    meetupNotes?: string;
    paymentMethod: 'OFFLINE' | 'ONLINE';
  }): Promise<{ order: Order; deliveryOtp?: string; razorpayOrderId?: string }> {
    const res = await apiClient.post('/orders/checkout', data);
    return res.data.data ?? res.data;
  },

  async verifyDeliveryOtp(orderId: string, otp: string): Promise<{ message: string }> {
    const res = await apiClient.post(`/orders/${orderId}/verify-otp`, { otp });
    return res.data;
  },

  async getSellerOrders(): Promise<Order[]> {
    const res = await apiClient.get('/orders/seller/incoming');
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) return data;
    return data.orders ?? [];
  },
};
