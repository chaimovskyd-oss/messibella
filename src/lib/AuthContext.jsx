import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getAdminAuthState, isCurrentUserAdmin, signInAdmin, signOutAdmin } from '@/services/adminAuthService';
import { createPageUrl } from '@/utils';

const AuthContext = createContext({
  user: null,
  session: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoadingAuth: true,
  isLoadingPublicSettings: false,
  authError: null,
  appPublicSettings: null,
  authChecked: false,
  loginAdmin: async () => {},
  logout: async () => {},
  navigateToLogin: () => {},
  checkAppState: () => {},
  checkUserAuth: async () => {},
  isCurrentUserAdmin: async () => false,
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const refreshAuthState = async () => {
    setIsLoadingAuth(true);

    try {
      const nextState = await getAdminAuthState();
      setSession(nextState.session);
      setUser(nextState.user);
      setIsAdmin(nextState.isAdmin);
      setAuthError(nextState.user && !nextState.isAdmin
        ? { type: 'not_admin', message: 'המשתמש מחובר אך לא מוגדר כאדמין.' }
        : null);
    } catch (error) {
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      setAuthError(error);
    } finally {
      setAuthChecked(true);
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    refreshAuthState();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refreshAuthState();
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const loginAdmin = async ({ email, password }) => {
    setAuthError(null);
    const nextState = await signInAdmin({ email, password });
    setSession(nextState.session);
    setUser(nextState.user);
    setIsAdmin(true);
    setAuthChecked(true);
    return nextState.user;
  };

  const logout = async () => {
    await signOutAdmin();
    setSession(null);
    setUser(null);
    setIsAdmin(false);
    setAuthError(null);
    window.location.href = createPageUrl('AdminLogin');
  };

  const value = useMemo(() => ({
    user,
    session,
    isAuthenticated: Boolean(session && user && isAdmin),
    isAdmin,
    isLoadingAuth,
    isLoadingPublicSettings: false,
    authError,
    appPublicSettings: null,
    authChecked,
    loginAdmin,
    logout,
    navigateToLogin: () => {
      window.location.href = createPageUrl('AdminLogin');
    },
    checkAppState: () => {},
    checkUserAuth: refreshAuthState,
    isCurrentUserAdmin: async () => isCurrentUserAdmin(user?.id),
  }), [authChecked, authError, isAdmin, isLoadingAuth, session, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
