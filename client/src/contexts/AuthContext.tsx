// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signup: (userData: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  socialAuth: (provider: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const loadUser = async () => {
      if (api.isAuthenticated()) {
        try {
          const userData = await api.getUser();
          setUser(userData);
        } catch (error) {
          api.removeToken();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const signup = async (userData: any) => {
    try {
      setError(null);
      const data = await api.signup({
        email: userData.email,
        password: userData.password,
        confirm_password: userData.confirmPassword,
        first_name: userData.fullName.split(' ')[0] || '',
        last_name: userData.fullName.split(' ').slice(1).join(' ') || '',
      });
      setUser(data.user);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const data = await api.login({ email, password });
      setUser(data.user);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const socialAuth = (provider: string) => {
    // Redirect to social auth endpoint
    window.location.href = `http://localhost:8000/api/auth/${provider}/`;
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signup, login, logout, socialAuth }}>
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