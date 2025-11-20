import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '../shared/api/auth/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const token = authApi.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error: any) {
      console.error('Failed to load user:', error);
      // Если ошибка 401, токен невалидный - очищаем его
      if (error?.status === 401 || error?.message?.includes('401')) {
        authApi.clearTokens();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (accessToken: string, refreshToken?: string) => {
    authApi.setToken(accessToken);
    if (refreshToken) {
      authApi.setRefreshToken(refreshToken);
    }
    await loadUser();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      authApi.clearTokens();
    }
  };

  const refreshAuth = async () => {
    try {
      await authApi.refreshToken();
      await loadUser();
    } catch (error: any) {
      console.error('Failed to refresh auth:', error);
      // Если refresh токен невалидный, делаем logout
      if (error?.status === 401 || error?.message?.includes('401')) {
        await logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

