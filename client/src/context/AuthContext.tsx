import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { IUser, IAddress } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  addresses: IAddress[];
  defaultAddress: IAddress | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (formData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auramart_token'));
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const refreshMe = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setAddresses(res.data.addresses || []);
      }
    } catch (err) {
      // Clear expired session
      setUser(null);
      setToken(null);
      localStorage.removeItem('auramart_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('auramart_token', res.data.token);
        if (res.data.defaultAddress) {
          setAddresses([res.data.defaultAddress]);
        }
        await refreshMe();
        showToast(res.data.message || 'Logged in successfully!', 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      return false;
    }
  };

  const register = async (formData: any): Promise<boolean> => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('auramart_token', res.data.token);
        if (res.data.defaultAddress) {
          setAddresses([res.data.defaultAddress]);
        }
        showToast('Account created successfully! Welcome to AuraMart.', 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      setUser(null);
      setToken(null);
      setAddresses([]);
      localStorage.removeItem('auramart_token');
      showToast('Logged out successfully', 'info');
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    try {
      const res = await api.patch(`/addresses/${addressId}/default`);
      if (res.data.success) {
        showToast('Default delivery address updated', 'success');
        await refreshMe();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update default address', 'error');
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      const res = await api.delete(`/addresses/${addressId}`);
      if (res.data.success) {
        showToast('Address removed', 'info');
        await refreshMe();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete address', 'error');
    }
  };

  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        addresses,
        defaultAddress,
        isLoading,
        login,
        register,
        logout,
        refreshMe,
        setDefaultAddress,
        deleteAddress
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

