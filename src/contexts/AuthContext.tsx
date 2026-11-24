import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

interface User {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  mobile?: string;
}

interface AuthContextType {
  user: User | null;
  login: (emailOrMobile: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, mobile: string, password: string) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getProfile()
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (emailOrMobile: string, password: string) => {
    try {
      const response = await authAPI.login({ email: emailOrMobile, password });
      const { token, userId, fullName, email, role } = response.data;
      const userData: User = {
        userId,
        fullName,
        email,
        role
      };
      localStorage.setItem('token', token);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const response = await authAPI.adminLogin({ email, password });
      const { token, userId, fullName, email: adminEmail, role } = response.data;
      const userData: User = {
        userId,
        fullName,
        email: adminEmail,
        role
      };
      localStorage.setItem('token', token);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const signup = async (name: string, email: string, mobile: string, password: string) => {
    try {
      await authAPI.signup({ fullName: name, email, mobile, password });
    } catch (error) {
      throw error;
    }
  };

  const verifyEmail = async (email: string, otp: string) => {
    try {
      await authAPI.verifyEmail({ email, otp });
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await authAPI.forgotPassword({ email });
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    try {
      await authAPI.resetPassword({ email, otp, newPassword });
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    login,
    adminLogin,
    logout,
    signup,
    verifyEmail,
    forgotPassword,
    resetPassword,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};