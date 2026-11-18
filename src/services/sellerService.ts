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
    const [ordersRes, earningsRes, productsRes] = await Promise.all([
      apiClient.get('/orders/seller/incoming').catch(() => ({ data: { orders: [] } })),
      apiClient.get('/seller/earnings').catch(() => ({ data: {} })),
      apiClient.get('/products/seller/my-listings').catch(() => ({ data: [] })),
    ]);

    const orders = ordersRes.data?.orders ?? (Array.isArray(ordersRes.data) ? ordersRes.data : []);
    const earnings = earningsRes.data ?? {};
    const myProducts = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.products ?? productsRes.data?.data ?? []);

    const pendingOrders = orders.filter((o: any) =>
      o.status === 'PENDING_MEETUP' || o.status === 'PAID_PENDING_MEETUP' || o.status === 'PENDING_PAYMENT'
    ).length;

    const totalRevenue = earnings.totalGross || orders.reduce((acc: number, o: any) => {
      return o.status === 'COMPLETED' ? acc + Number(o.total_price || o.total_amount || 0) : acc;
    }, 0);

    return {
      totalRevenue,
      totalOrders: orders.length,
      activeListings: myProducts.length,
      pendingOrders,
      recentOrders: orders.slice(0, 5),
    };
  },

  async getEarnings(): Promise<any> {
    const res = await apiClient.get('/seller/earnings');
    return res.data;
  },

  async getPayouts(): Promise<any[]> {
    const res = await apiClient.get('/seller/payouts');
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) return data;
    return data.payouts ?? [];
  },
};
