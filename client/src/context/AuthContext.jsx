import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('queueflow_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and check current user on app load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('queueflow_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data.user);

          // If user is owner or staff, load their business profile
          if (res.data.data.user.role === 'owner' || res.data.data.user.role === 'staff') {
            try {
              const bRes = await api.get('/business/profile');
              setBusiness(bRes.data.data.business);
            } catch (bErr) {
              console.warn('Could not load business profile:', bErr.message);
            }
          }
        } catch (err) {
          console.error('Session expired or invalid:', err.message);
          setToken(null);
          setUser(null);
          setBusiness(null);
          localStorage.removeItem('queueflow_token');
          localStorage.removeItem('queueflow_refresh_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: loggedInUser, accessToken, refreshToken } = res.data.data;

    localStorage.setItem('queueflow_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('queueflow_refresh_token', refreshToken);
    }

    setToken(accessToken);
    setUser(loggedInUser);

    if (loggedInUser.role === 'owner' || loggedInUser.role === 'staff') {
      try {
        const bRes = await api.get('/business/profile');
        setBusiness(bRes.data.data.business);
      } catch (err) {
        console.warn('Could not load business profile:', err.message);
      }
    } else {
      setBusiness(null);
    }

    return loggedInUser;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { user: registeredUser, business: registeredBusiness, accessToken, refreshToken } = res.data.data;

    localStorage.setItem('queueflow_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('queueflow_refresh_token', refreshToken);
    }

    setToken(accessToken);
    setUser(registeredUser);
    if (registeredBusiness) {
      setBusiness(registeredBusiness);
    }

    return registeredUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API call error:', err.message);
    } finally {
      localStorage.removeItem('queueflow_token');
      localStorage.removeItem('queueflow_refresh_token');
      setToken(null);
      setUser(null);
      setBusiness(null);
    }
  };

  const refreshBusiness = async () => {
    if (user?.role === 'owner' || user?.role === 'staff') {
      try {
        const bRes = await api.get('/business/profile');
        setBusiness(bRes.data.data.business);
        return bRes.data.data.business;
      } catch (err) {
        console.error('Failed to refresh business profile:', err);
      }
    }
    return null;
  };

  const value = {
    user,
    business,
    token,
    loading,
    login,
    register,
    logout,
    refreshBusiness,
    isAuthenticated: !!user,
    isOwner: user?.role === 'owner',
    isStaff: user?.role === 'staff',
    isCustomer: user?.role === 'customer'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
