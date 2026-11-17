import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CartItem } from '../types';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    try {
      setIsLoading(true);
      const cartItems = await cartService.getCart();
      setItems(Array.isArray(cartItems) ? cartItems : []);
    } catch {
      // Fallback empty if unauthorized or error
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: string, quantity: number = 1) => {
    await cartService.addToCart(productId, quantity);
    await refreshCart();
  };

  const removeFromCart = async (cartItemId: string) => {
    // Optimistic removal
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
    try {
      await cartService.removeFromCart(cartItemId);
    } catch {
      await refreshCart();
    }
  };

  const clearCart = async () => {
    setItems([]);
    try {
      await cartService.clearCart();
    } catch {
      await refreshCart();
    }
  };

  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const total = items.reduce((sum, item) => {
    const price = item.product?.price ?? 0;
    const qty = item.quantity ?? 1;
    return sum + price * qty;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        isLoading,
        addToCart,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
