import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/endpoints.js';
import { setUnauthorizedHandler } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionEnded, setSessionEnded] = useState(false);

    // Check once on load whether the login cookie is still valid.
    useEffect(() => {
        let cancelled = false;
        api
          .me()
          .then((data) => !cancelled && setUser(data.user))
          .catch(() => {})
          .finally(() => !cancelled && setLoading(false));
        return () => {
          cancelled = true;
        };
      }, []);

      // Any other 401 means the session expired (8 hours) or the account was switched off.
      useEffect(() => {
          setUnauthorizedHandler(() => {
            setUser((current) => {
              if (current) setSessionEnded(true);
              return null;
            });
          });
          return () => setUnauthorizedHandler(null);
        }, []);

        const login = useCallback(async (email, password) => {
            const data = await api.login(email, password);
            setSessionEnded(false);
            setUser(data.user);
            return data.user;
        }, []);

        const signup = useCallback(async (values) => {
              const data = await api.signup(values);
              setSessionEnded(false);
              setUser(data.user);
              return data.user;
        }, []);

        const logout = useCallback(async () => {
            try {
              await api.logout();
            } finally {
              setSessionEnded(false);
              setUser(null);
            }
        }, []);

        const value = useMemo(
            () => ({ user, loading, sessionEnded, login, signup, logout, isAdmin: user?.role === 'ADMIN' }),
            [user, loading, sessionEnded, login, signup, logout],
          );
        return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}