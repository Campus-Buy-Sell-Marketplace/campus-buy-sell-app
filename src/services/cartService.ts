import apiClient from './apiClient';
import { CartItem } from '../types';

function normalizeCartItem(raw: any): CartItem {
  const cartItemId = raw.cart_item_id || raw.id || '';
  const price = typeof raw.price === 'number' ? raw.price : parseFloat(raw.price || '0');
  const stock = typeof raw.stock === 'number' ? raw.stock : parseInt(raw.stock || '1', 10);
  const imageUrl = raw.image_url || raw.product?.images?.[0] || '';

  return {
    id: cartItemId,
    cart_item_id: cartItemId,
    product_id: raw.product_id || raw.productId || '',
    title: raw.title || raw.product?.title || 'Campus Item',
    price: isNaN(price) ? 0 : price,
    image_url: imageUrl,
    stock: isNaN(stock) ? 1 : stock,
    quantity: Number(raw.quantity) || 1,
    seller_name: raw.seller_name || raw.sellerName || '',
    product: {
      id: raw.product_id || raw.productId || '',
      title: raw.title || raw.product?.title || 'Campus Item',
      description: raw.description || raw.product?.description || '',
      price: isNaN(price) ? 0 : price,
      category: raw.category || raw.product?.category || 'Other',
      condition: raw.condition || raw.product?.condition || 'GOOD',
      images: imageUrl ? [imageUrl] : [],
      stock: isNaN(stock) ? 1 : stock,
      seller_id: raw.seller_id || '',
      seller_name: raw.seller_name || raw.sellerName || '',
      is_active: raw.is_active !== undefined ? raw.is_active : true,
      created_at: raw.added_at || raw.created_at || '',
    },
  };
}

export const cartService = {
  async getCart(): Promise<CartItem[]> {
    const res = await apiClient.get('/cart');
    const data = res.data.data ?? res.data;
    const rawList = Array.isArray(data) ? data : (data.items ?? []);
    return rawList.map(normalizeCartItem);
  },

  async addToCart(productId: string, quantity: number = 1): Promise<CartItem> {
    const res = await apiClient.post('/cart', { productId, quantity });
    const raw = res.data.data ?? res.data.item ?? res.data;
    return normalizeCartItem(raw);
  },

  async updateCartItem(cartItemId: string, quantity: number): Promise<CartItem> {
    const res = await apiClient.patch(`/cart/${cartItemId}`, { quantity });
    const raw = res.data.data ?? res.data.item ?? res.data;
    return normalizeCartItem(raw);
  },

  async removeFromCart(cartItemId: string): Promise<void> {
    await apiClient.delete(`/cart/${cartItemId}`);
  },

  async clearCart(): Promise<void> {
    await apiClient.delete('/cart');
  },
};
