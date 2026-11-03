import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/endpoints.js';

const NotificationsContext = createContext({ count: 0, refresh: () => {}, setCount: () => {} });

const POLL_MS = 60000;

// Keeps the unread number for the bell. It asks the server once a minute
export function NotificationsProvider({ children }) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const data = await api.unreadCount();
      setCount(data.count ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
    const tick = () => {
      if (!document.hidden) refresh();
    };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refresh]);

  const value = useMemo(() => ({ count, refresh, setCount }), [count, refresh]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export const useNotifications = () => useContext(NotificationsContext);
