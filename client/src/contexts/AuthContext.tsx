import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AuthUser, LoginResponse } from '@hcm/shared';
import api from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('hcm_access_token');
    if (token) {
      api
        .get<{ success: boolean; data: AuthUser }>('/auth/me')
        .then(({ data }) => setUser(data.data))
        .catch(() => {
          localStorage.removeItem('hcm_access_token');
          localStorage.removeItem('hcm_refresh_token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ success: boolean; data: LoginResponse }>('/auth/login', {
      email,
      password,
    });
    const { accessToken, refreshToken, user: authUser } = data.data;
    localStorage.setItem('hcm_access_token', accessToken);
    localStorage.setItem('hcm_refresh_token', refreshToken);
    setUser(authUser);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('hcm_refresh_token');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('hcm_access_token');
      localStorage.removeItem('hcm_refresh_token');
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
