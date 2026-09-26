'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthResponse } from '@/types';
import { apiFetch } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Normalize user object from either login/register or /auth/me
  const normalizeUser = (data: any): User => {
    return {
      id: data.id || data.userId,
      email: data.email,
      name: data.name,
      role: data.role || 'user',
      createdAt: data.createdAt,
    };
  };

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const data = await apiFetch<any>('/auth/me');
      if (data && (data.userId || data.id)) {
        const normalized = normalizeUser(data);
        setUser(normalized);
        return normalized;
      }
      setUser(null);
      return null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const normalized = normalizeUser(data.user);
      setUser(normalized);
      return normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      // Backend allows optional role, we strictly default to "user" per requirements
      const data = await apiFetch<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role: 'user',
        }),
      });

      // After registration, automatically login or set user
      // Note: backend register returns { message, user }, but doesn't set cookie until login.
      // So we call login automatically to establish the httpOnly cookie session!
      try {
        const loginData = await apiFetch<AuthResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const normalized = normalizeUser(loginData.user);
        setUser(normalized);
        return normalized;
      } catch {
        const normalized = normalizeUser(data.user);
        setUser(normalized);
        return normalized;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
