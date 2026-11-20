import type { LoginRequest, SessionResponse, SessionUser } from '@launchdesk/shared';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, setCsrfToken } from '../api/client';

type AuthState =
  | { readonly status: 'loading' }
  | { readonly status: 'anonymous' }
  | { readonly status: 'authenticated'; readonly user: SessionUser };

export interface AuthContextValue {
  readonly state: AuthState;
  readonly login: (credentials: LoginRequest) => Promise<void>;
  readonly logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  const applySession = useCallback((session: SessionResponse) => {
    setCsrfToken(session.csrfToken);
    setState({ status: 'authenticated', user: session.user });
  }, []);

  useEffect(() => {
    api
      .get<SessionResponse>('/auth/session')
      .then(applySession)
      .catch((error: unknown) => {
        if (!(error instanceof ApiError && error.status === 401)) {
          console.error('Session check failed', error);
        }
        setState({ status: 'anonymous' });
      });
  }, [applySession]);

  const login = useCallback(
    async (credentials: LoginRequest) =>
      applySession(await api.post<SessionResponse>('/auth/login', credentials)),
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setCsrfToken(null);
      setState({ status: 'anonymous' });
    }
  }, []);

  const value = useMemo(() => ({ state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
