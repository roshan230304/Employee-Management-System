import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((response) => {
        if (active) setUser(response.data);
      })
      .catch((error) => {
        if (!active) return;
        setUser(null);
        if (error.response && error.response.status !== 401) {
          setSessionError(error.response.data?.message || 'Unable to verify your session. Check that the API server is running.');
        } else if (!error.response) {
          setSessionError('Unable to connect to the API server. Start the backend and try again.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    sessionError,
    async signIn(credentials) {
      const response = await loginRequest(credentials);
      setUser(response.data);
      setSessionError('');
      return response.data;
    },
    async signOut() {
      try {
        await logoutRequest();
      } finally {
        setUser(null);
      }
    }
  }), [user, loading, sessionError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
};
