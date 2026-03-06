import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/api';
import { User, LoginRequest, TwoFactorVerifyRequest } from '../types';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  requires2FA: boolean;
  tempToken: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  verify2FA: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  // Check for existing token on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await apiClient.getStoredToken();
      if (token) {
        // Validate token by fetching sites (if it fails, token is invalid)
        try {
          await apiClient.getSites();
          setIsLoggedIn(true);
        } catch {
          // Token invalid, clear it
          await apiClient.clearToken();
          setIsLoggedIn(false);
        }
      }
    } catch (err) {
      console.error('Error checking auth state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await apiClient.login({ username, password });
      
      if (response.requires_2fa) {
        // 2FA required
        setTempToken(response.temp_token || null);
        setRequires2FA(true);
        setIsLoading(false);
        return true; // Indicates 2FA is needed
      } else if (response.access_token) {
        // Direct login without 2FA
        setUser(response.user || null);
        setIsLoggedIn(true);
        setIsLoading(false);
        return false; // No 2FA needed
      }
      throw new Error('Invalid response from server');
    } catch (err: any) {
      const message = err.response?.data?.detail || err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
      setIsLoading(false);
      throw new Error(message);
    }
  };

  const verify2FA = async (code: string) => {
    if (!tempToken) {
      throw new Error('No temp token available');
    }

    setError(null);
    setIsLoading(true);
    try {
      const response = await apiClient.verify2FA({ temp_token: tempToken, totp_code: code });
      setUser(response.user);
      setIsLoggedIn(true);
      setRequires2FA(false);
      setTempToken(null);
    } catch (err: any) {
      const message = err.response?.data?.detail || err.response?.data?.message || 'Invalid verification code.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiClient.logout();
      setUser(null);
      setIsLoggedIn(false);
      setRequires2FA(false);
      setTempToken(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      isLoading, 
      user, 
      requires2FA, 
      tempToken, 
      login, 
      verify2FA, 
      logout, 
      error, 
      clearError 
    }}>
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
