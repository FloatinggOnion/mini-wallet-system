// contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/api';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const user = await authService.getCurrentUser();
        if (user) {
          setUser(user);
        } else {
          // If we have a token but no user, clear the token
          authService.logout();
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setUser(null);
        // Clear invalid token
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      if (response.token) {
        const user = await authService.getCurrentUser();
        if (user) {
          setUser(user);
          router.push('/dashboard');
        } else {
          throw new Error('Failed to get user data after login');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    setLoading(true);
    try {
      const response = await authService.register({ email, password, firstName, lastName });
      if (response.token) {
        const user = await authService.getCurrentUser();
        if (user) {
          setUser(user);
          router.push('/dashboard');
        } else {
          throw new Error('Failed to get user data after registration');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}