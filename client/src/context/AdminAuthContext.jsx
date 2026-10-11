import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken } from '../services/api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const token = getAuthToken();
      if (token) {
        const username = localStorage.getItem('rac_admin_custom_username') || 'admin';
        return { id: 1, username, role: 'admin' };
      }
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      if (!token) {
        setAdminUser(null);
        setLoading(false);
        return;
      }

      api.verifyAuth()
        .then(res => {
          setAdminUser(res.user);
        })
        .catch(() => {
          setAuthToken(null);
          setAdminUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    };

    checkAuth();

    const handleStorageChange = (e) => {
      if (e.key === 'rac_admin_token' || e.key === 'shanti_admin_token') {
        checkAuth();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (username, password) => {
    const res = await api.login({ username, password });
    setAuthToken(res.token);
    setAdminUser(res.user);
    setLoginModalOpen(false);
    return res.user;
  };

  const logout = () => {
    setAuthToken(null);
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{
      adminUser,
      isAuthenticated: !!adminUser,
      loading,
      login,
      logout,
      loginModalOpen,
      setLoginModalOpen
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
