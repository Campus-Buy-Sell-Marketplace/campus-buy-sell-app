import apiClient from './apiClient';
import { User, Notification, Product } from '../types';

function normalizeWishlistProduct(raw: any): Product {
  const imageUrl = raw.image_url || raw.images?.[0] || '';
  const price = typeof raw.price === 'number' ? raw.price : parseFloat(raw.price || '0');
  const stock = typeof raw.stock === 'number' ? raw.stock : parseInt(raw.stock || '1', 10);

  return {
    id: raw.id || raw.product_id || '',
    title: raw.title || 'Campus Item',
    description: raw.description || '',
    price: isNaN(price) ? 0 : price,
    category: raw.category || 'Other',
    condition: raw.condition || 'GOOD',
    images: imageUrl ? [imageUrl] : (Array.isArray(raw.images) ? raw.images : []),
    stock: isNaN(stock) ? 1 : stock,
    seller_id: raw.seller_id || '',
    seller_name: raw.seller_name || '',
    is_active: raw.is_active !== undefined ? raw.is_active : true,
    created_at: raw.added_at || raw.created_at || '',
  };
}

export const userService = {
  async getProfile(): Promise<User> {
    const res = await apiClient.get('/auth/me');
    return res.data.data ?? res.data.user ?? res.data;
  },

  async updateProfile(data: Partial<User> & { avatar?: string }): Promise<User> {
    const res = await apiClient.put('/user/profile', data);
    return res.data.data ?? res.data.user ?? res.data;
  },

  /**
   * Fetch full product details for all items in the user's wishlist
   */
  async getWishlistProducts(): Promise<Product[]> {
    try {
      const res = await apiClient.get('/user/wishlist');
      const items = res.data.wishlist ?? res.data.data ?? res.data ?? [];
      return Array.isArray(items) ? items.map(normalizeWishlistProduct) : [];
    } catch {
      return [];
    }
  },

  /**
   * Fast lookup of wishlisted product IDs
   */
  async getWishlistIds(): Promise<string[]> {
    try {
      const res = await apiClient.get('/user/wishlist/ids');
      if (Array.isArray(res.data.ids)) return res.data.ids;
      if (Array.isArray(res.data)) return res.data;
      const items = res.data.wishlist ?? res.data.data;
      if (Array.isArray(items)) {
        return items.map((i: any) => i.product_id ?? i.id ?? i);
      }
      return [];
    } catch {
      return [];
    }
  },

  // Backward compatibility alias for existing code
  async getWishlist(): Promise<string[]> {
    return this.getWishlistIds();
  },

  async addToWishlist(productId: string): Promise<void> {
    await apiClient.post('/user/wishlist', { product_id: productId });
  },

  async removeFromWishlist(productId: string): Promise<void> {
    await apiClient.delete(`/user/wishlist/${productId}`);
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
