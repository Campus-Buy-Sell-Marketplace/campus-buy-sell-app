import apiClient from './apiClient';

export const sellerService = {
  async applyAsSeller(data: {
    businessName: string;
    description: string;
    contactNumber: string;
  }): Promise<void> {
    await apiClient.post('/seller/apply', data);
  },

  async getDashboard(): Promise<any> {
    const res = await apiClient.get('/seller/dashboard');
    return res.data.data ?? res.data;
  },

  async getPayouts(): Promise<any[]> {
    const res = await apiClient.get('/seller/payouts');
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) return data;
    return data.payouts ?? [];
  },
};
