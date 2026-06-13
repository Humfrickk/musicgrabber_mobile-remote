import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getMe, login as apiLogin, logout as apiLogout } from '@/src/api/auth';
import { setUnauthorizedHandler } from '@/src/api/client';
import { getToken, hasServerConfig } from '@/src/api/storage';
import type { AuthUser } from '@/src/types/musicgrabber';

type AuthStatus = 'loading' | 'setup' | 'login' | 'authenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(async () => {
    const configured = await hasServerConfig();
    if (!configured) {
      setUser(null);
      setStatus('setup');
      return;
    }

    const token = await getToken();
    if (!token) {
      setUser(null);
      setStatus('login');
      return;
    }

    try {
      const me = await getMe();
      setUser(me);
      setStatus('authenticated');
    } catch {
      setUser(null);
      setStatus('login');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus('login');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await apiLogin(username, password);
    setUser(response.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setStatus('login');
  }, []);

  const value = useMemo(
    () => ({ status, user, login, logout, refresh }),
    [status, user, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
