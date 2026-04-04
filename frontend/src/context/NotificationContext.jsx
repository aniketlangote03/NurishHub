import { createContext, useState, useCallback, useEffect } from 'react';
import { notificationsAPI } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from '../hooks/useAuth';

export const NotificationContext = createContext(null);

let toastIdCounter = 0;

export function NotificationProvider({ children }) {
  // ─── Toasts State (Transient UI alerts) ──────────────────────────────────
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, type, message, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((msg) => addToast('success', msg), [addToast]);
  const error = useCallback((msg) => addToast('error', msg), [addToast]);
  const warning = useCallback((msg) => addToast('warning', msg), [addToast]);
  const info = useCallback((msg) => addToast('info', msg), [addToast]);

  // ─── App Notifications State (Persistent backend alerts) ──────────────────
  const [appNotifications, setAppNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // We need auth to know when to fetch
  // Wait, we can't use `useAuth` directly here if AuthProvider wraps NotificationProvider.
  // We'll manage fetching inside a generic listener, or we can expose a `fetchNotifications` method
  // to be called from the layout or dashboard.

  const fetchAppNotifications = useCallback(async () => {
    try {
      const res = await notificationsAPI.getAll({ limit: 20 });
      if (res.success) {
        setAppNotifications(res.data.notifications || []);
        setUnreadCount(res.data.pagination?.totalUnread || 0);
      }
    } catch (err) {
      console.error('Failed to fetch app notifications', err);
    }
  }, []);

  const markAsRead = async (id) => {
    try {
      setAppNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      await notificationsAPI.markAsRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setAppNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await notificationsAPI.markAllAsRead();
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Socket Integration ───────────────────────────────────────────────────
  useEffect(() => {
    // Listen to real-time notification events
    const handleNewNotification = (notification) => {
      // Add to persistent list
      setAppNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Also show a toast so the user sees it immediately
      info(notification.title || 'New Notification');
    };

    socketService.on('notification:new', handleNewNotification);

    return () => {
      socketService.off('notification:new', handleNewNotification);
    };
  }, [info]);

  return (
    <NotificationContext.Provider value={{
      // Toasts
      notifications: toasts, // mapping `toasts` to `notifications` for existing `Toast.jsx` compat
      addNotification: addToast,
      removeNotification: removeToast,
      success, error, warning, info,
      
      // App Notifications
      appNotifications,
      unreadCount,
      fetchAppNotifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
