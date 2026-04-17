import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, setAccessToken, setLogoutHandler } from '../services/api';
import { AuthUser } from '@hcm/shared';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    setLogoutHandler(() => logout());
    const initAuth = async () => {
      try {
        const { data: refreshData } = await api.post('/auth/refresh');
        setAccessToken(refreshData.data.accessToken);
        const { data: userData } = await api.get('/auth/me');
        setUser(userData.data);
      } catch (err) {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAuthenticated: !!user
    }}>
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
