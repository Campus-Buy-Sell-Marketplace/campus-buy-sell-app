import apiClient from './apiClient';
import { Order } from '../types';

export interface CheckoutParams {
  paymentMethod?: 'OFFLINE' | 'ONLINE';
  meetupLocation?: string;
  meetupTime?: string;
  meetupNotes?: string;
  items?: Array<{ productId: string; quantity: number }>;
}

export interface CheckoutResult {
  orderId: string;
  deliveryOtp?: string;
  paymentMethod: string;
  totalAmount: number;
  meetupLocation?: string;
  meetupTime?: string;
  meetupNotes?: string;
  items?: any[];
  razorpayOrderId?: string;
}

export const orderService = {
  async getOrders(): Promise<Order[]> {
    const res = await apiClient.get('/orders');
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) return data;
    return data.orders ?? [];
  },

  async getSellerOrders(): Promise<Order[]> {
    const res = await apiClient.get('/orders/seller/incoming');
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) return data;
    return data.orders ?? [];
  },

  async getSellerIncomingOrders(): Promise<any[]> {
    return this.getSellerOrders();
  },

  async getOrderById(id: string): Promise<Order> {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data.data ?? res.data.order ?? res.data;
  },

  async checkout(params: CheckoutParams): Promise<{ message?: string; order: any; deliveryOtp?: string; razorpayOrderId?: string }> {
    const res = await apiClient.post('/orders/checkout', {
      paymentMethod: params.paymentMethod || 'OFFLINE',
      meetupLocation: params.meetupLocation || 'Campus Central Library Gate',
      meetupTime: params.meetupTime || 'Tomorrow (4:00 PM - 5:30 PM)',
      meetupNotes: params.meetupNotes?.trim() || undefined,
      items: params.items,
    });
    return res.data.data ?? res.data;
  },

  async verifyDeliveryOtp(orderId: string, otp: string): Promise<{ message: string }> {
    const res = await apiClient.post(`/orders/${orderId}/verify-otp`, { otp });
    return res.data;
  },

  async initPayment(orderId: string): Promise<{
    razorpayOrderId: string;
    amountPaise: number;
    currency: string;
    keyId: string;
  }> {
    const res = await apiClient.post('/payments/init', { orderId });
    return res.data;
  },

  async verifyPayment(payload: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{ deliveryOtp: string }> {
    const res = await apiClient.post('/payments/verify', payload);
    return res.data;
  },

  // Backward compatibility
  async createOrder(cartItemIds: string[]): Promise<any> {
    return this.checkout({});
  },

  async cancelOrder(id: string): Promise<void> {
    await apiClient.patch(`/orders/${id}/cancel`);
  },
};
