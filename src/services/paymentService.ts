import apiClient from './apiClient';

export interface PaymentInitResponse {
  orderId: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
}

export interface PaymentVerifyData {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentVerifyResponse {
  status: string;
  orderId: string;
  deliveryOtp: string;
  message: string;
}

export const paymentService = {
  async initPayment(orderId: string): Promise<PaymentInitResponse> {
    const res = await apiClient.post('/payments/init', { orderId });
    return res.data;
  },

  async verifyPayment(data: PaymentVerifyData): Promise<PaymentVerifyResponse> {
    const res = await apiClient.post('/payments/verify', data);
    return res.data;
  },

  async getStatus(orderId: string): Promise<any> {
    const res = await apiClient.get(`/payments/orders/${orderId}/status`);
    return res.data;
  },
};
