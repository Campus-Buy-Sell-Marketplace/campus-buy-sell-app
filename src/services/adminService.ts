import apiClient from './apiClient';

export const adminService = {
  async getDashboard(): Promise<any> {
    const res = await apiClient.get('/admin/dashboard');
    return res.data.data ?? res.data;
  },

  async getUsers(params?: { role?: string; q?: string; page?: number }): Promise<any[]> {
    const res = await apiClient.get('/admin/users', { params });
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) return data;
    return data.users ?? [];
  },

  async banUser(id: string): Promise<void> {
    await apiClient.patch(`/admin/users/${id}/ban`);
  },

  async unbanUser(id: string): Promise<void> {
    await apiClient.patch(`/admin/users/${id}/unban`);
  },

  async getListings(params?: any): Promise<any[]> {
    const res = await apiClient.get('/admin/products', { params });
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) return data;
    return data.products ?? [];
  },

  async approveProduct(id: string): Promise<void> {
    await apiClient.patch(`/admin/products/${id}/approve`);
  },

  async removeProduct(id: string): Promise<void> {
    await apiClient.delete(`/admin/products/${id}`);
  },

  async getPayouts(): Promise<any[]> {
    const res = await apiClient.get('/admin/payouts');
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) return data;
    return data.payouts ?? [];
  },

  async processPayout(id: string): Promise<void> {
    await apiClient.patch(`/admin/payouts/${id}/process`);
  },
};
