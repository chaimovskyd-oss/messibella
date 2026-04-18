import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '@/data/defaultContent';

const SESSION_KEY = 'masibala_admin_session';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoadingAuth: true,
  isLoadingPublicSettings: false,
  authError: null,
  appPublicSettings: null,
  authChecked: false,
  loginAdmin: async () => {},
  logout: () => {},
  navigateToLogin: () => {},
  checkAppState: () => {},
  checkUserAuth: () => {},
});

function getStoredSession() {
  if (typeof window === 'undefined') return null;
  const stored = window.sessionStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const session = getStoredSession();
    if (session?.email === ADMIN_EMAIL) {
      setUser(session);
      setIsAuthenticated(true);
    }
    setAuthChecked(true);
    setIsLoadingAuth(false);
  }, []);

  const loginAdmin = async ({ email, password }) => {
    if (email?.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      const error = { type: 'invalid_credentials', message: 'פרטי ההתחברות שגויים' };
      setAuthError(error);
      throw error;
    }

    const nextUser = {
      id: 'admin',
      full_name: 'Admin',
      email: ADMIN_EMAIL,
      role: 'admin',
    };

    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    setIsAuthenticated(true);
    setAuthChecked(true);
    setAuthError(null);
    return nextUser;
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SESSION_KEY);
      window.location.href = '/';
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings: false,
    authError,
    appPublicSettings: null,
    authChecked,
    loginAdmin,
    logout,
    navigateToLogin: () => {
      window.location.href = '/AdminLogin';
    },
    checkAppState: () => {},
    checkUserAuth: () => {
      const session = getStoredSession();
      setUser(session);
      setIsAuthenticated(Boolean(session?.email === ADMIN_EMAIL));
      setAuthChecked(true);
      setIsLoadingAuth(false);
    },
  }), [authChecked, authError, isAuthenticated, isLoadingAuth, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
