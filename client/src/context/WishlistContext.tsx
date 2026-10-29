import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { IProduct } from '../types';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { useToast } from './ToastContext';

interface WishlistContextType {
  wishlist: IProduct[];
  wishlistCount: number;
  isLoading: boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  moveToCart: (productId: string) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const { showToast } = useToast();

  const refreshWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.get('/wishlist');
      if (res.data.success) {
        setWishlist(res.data.wishlist || []);
      }
    } catch (err: any) {
      console.warn('[Wishlist Refresh Error]:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isInWishlist = (productId: string): boolean => {
    return wishlist.some(p => p._id === productId);
  };

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    if (!user) {
      showToast('Please log in to save items to your wishlist.', 'info');
      return false;
    }

    try {
      const res = await api.post(`/wishlist/${productId}`);
      if (res.data.success) {
        showToast(res.data.message, 'info');
        await refreshWishlist();
        return res.data.isWishlisted;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Failed to update wishlist', 'error');
      return false;
    }
  };

  const moveToCart = async (productId: string): Promise<boolean> => {
    try {
      const res = await api.post(`/wishlist/${productId}/move-to-cart`);
      if (res.data.success) {
        showToast(res.data.message, 'success');
        await Promise.all([refreshWishlist(), refreshCart()]);
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Failed to move product to cart', 'error');
      return false;
    }
  };

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount,
        isLoading,
        toggleWishlist,
        isInWishlist,
        moveToCart,
        refreshWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

