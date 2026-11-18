import apiClient from './apiClient';
import { Product } from '../types';

export const productService = {
  async getProducts(params?: {
    category?: string;
    q?: string;
    page?: number;
    limit?: number;
    sort?: string;
    condition?: string;
  }): Promise<{ products: Product[]; total: number }> {
    const res = await apiClient.get('/products', { params });
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) {
      return { products: data, total: data.length };
    }
    return {
      products: data.products ?? data.items ?? [],
      total: data.total ?? (data.products?.length ?? 0),
    };
  },

  async getProductById(id: string): Promise<Product> {
    const res = await apiClient.get(`/products/${id}`);
    return res.data.data ?? res.data.product ?? res.data;
  },

  async createProduct(data: FormData): Promise<Product> {
    const res = await apiClient.post('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data ?? res.data.product ?? res.data;
  },

  async updateProduct(id: string, data: FormData | Record<string, any>): Promise<Product> {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
    const res = await apiClient.patch(`/products/${id}`, data, { headers });
    return res.data.data ?? res.data.product ?? res.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  async getMyProducts(): Promise<Product[]> {
    const res = await apiClient.get('/products/seller/my-listings');
    const data = res.data.data ?? res.data;
    return Array.isArray(data) ? data : (data.products ?? []);
  },
};
