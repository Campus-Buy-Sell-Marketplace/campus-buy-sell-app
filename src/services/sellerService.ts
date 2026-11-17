import apiClient from './apiClient';

export const sellerService = {
  async applyAsSeller(data: {
    business_name: string;
    description: string;
    phone: string;
    college: string;
  }): Promise<void> {
    await apiClient.post('/seller/apply', data);
  },

  async getDashboard(): Promise<any> {
    const res = await apiClient.get('/seller/dashboard');
    return res.data.data ?? res.data;
  },

  async getSellerOrders(): Promise<any[]> {
    const res = await apiClient.get('/seller/orders');
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) return data;
    return data.orders ?? [];
  },

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await apiClient.patch(`/seller/orders/${orderId}/status`, { status });
  },

  async getPayouts(): Promise<any[]> {
    const res = await apiClient.get('/seller/payouts');
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) return data;
    return data.payouts ?? [];
  },
};
