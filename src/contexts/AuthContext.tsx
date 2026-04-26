import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { api, apiAvailable } from '../lib/api';
import { AuthUser, Role } from '../data/types';

type AuthState = {
  ready: boolean;
  apiAvailable: boolean;
  user: AuthUser | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (input: { email: string; password: string; name: string; rememberMe?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
  canWrite: boolean;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(!apiAvailable);

  useEffect(() => {
    if (!apiAvailable) {
      setReady(true);
      return;
    }
    let cancelled = false;
    api
      .get<AuthUser>('/api/auth/me')
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        // Not signed in, that's fine.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const u = await api.post<AuthUser>('/api/auth/login', { email, password, rememberMe });
    setUser(u);
  }, []);

  const register = useCallback(
    async (input: { email: string; password: string; name: string; rememberMe?: boolean }) => {
      const u = await api.post<AuthUser>('/api/auth/register', input);
      setUser(u);
    },
    []
  );

  const logout = useCallback(async () => {
    if (apiAvailable) {
      await api.post('/api/auth/logout').catch(() => null);
    }
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  // When the backend is not configured we fall back to localStorage mode
  // where every visitor can write — the app behaves like a personal tool.
  const canWrite = !apiAvailable || (user !== null && (user.role === 'admin' || user.role === 'staff'));

  const value = useMemo(
    () => ({ ready, apiAvailable, user, login, register, logout, hasRole, canWrite }),
    [ready, user, login, register, logout, hasRole, canWrite]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
