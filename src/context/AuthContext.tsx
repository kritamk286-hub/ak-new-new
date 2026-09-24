import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const token = localStorage.getItem('ak_auth_token');
      const saved = localStorage.getItem('ak_admin_user');
      if (token && saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const token = localStorage.getItem('ak_auth_token');
    const saved = localStorage.getItem('ak_admin_user');
    // If we already have stored token and user profile, render immediately without blocking!
    return !(token && saved);
  });

  const checkAuth = async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      localStorage.removeItem('ak_admin_user');
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.admin);
      localStorage.setItem('ak_admin_user', JSON.stringify(res.admin));
    } catch {
      setUser(null);
      localStorage.removeItem('ak_admin_user');
      api.setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleExpired = () => {
      setUser(null);
      localStorage.removeItem('ak_admin_user');
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setUser(res.admin);
      localStorage.setItem('ak_admin_user', JSON.stringify(res.admin));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('ak_admin_user');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.admin);
      localStorage.setItem('ak_admin_user', JSON.stringify(res.admin));
    } catch {
      setUser(null);
      localStorage.removeItem('ak_admin_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
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
