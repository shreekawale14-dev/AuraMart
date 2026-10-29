import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { ICart } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface CartContextType {
  cart: ICart | null;
  cartCount: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number, variant?: Record<string, string>) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<ICart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.get('/cart');
      if (res.data.success) {
        setCart(res.data.cart);
      }
    } catch (err: any) {
      console.warn('[Cart Refresh Error]:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (
    productId: string,
    quantity: number = 1,
    variant?: Record<string, string>
  ): Promise<boolean> => {
    if (!user) {
      showToast('Please log in to add items to your cart.', 'info');
      return false;
    }

    try {
      const res = await api.post('/cart/items', { productId, quantity, variant });
      if (res.data.success) {
        setCart(res.data.cart);
        showToast(res.data.message || 'Added to cart!', 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Failed to add item to cart', 'error');
      return false;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
    try {
      const res = await api.patch(`/cart/items/${itemId}`, { quantity });
      if (res.data.success) {
        setCart(res.data.cart);
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Failed to update quantity', 'error');
      return false;
    }
  };

  const removeFromCart = async (itemId: string): Promise<boolean> => {
    try {
      const res = await api.delete(`/cart/items/${itemId}`);
      if (res.data.success) {
        setCart(res.data.cart);
        showToast('Item removed from cart', 'info');
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Failed to remove item', 'error');
      return false;
    }
  };

  const clearCart = async (): Promise<void> => {
    try {
      const res = await api.delete('/cart');
      if (res.data.success) {
        setCart(res.data.cart);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to clear cart', 'error');
    }
  };

  const cartCount = cart?.totalItemsCount || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

