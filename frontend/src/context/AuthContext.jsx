import { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { socketService } from '../services/socket';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session and socket from local storage on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const savedToken = localStorage.getItem('auth_token');
        if (!savedToken) {
          setLoading(false);
          return;
        }

        // Technically we can fetch profile here to ensure token is valid and user is up to date:
        const response = await authAPI.getProfile();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          setToken(savedToken);
          socketService.connect(savedToken);
        } else {
          // Token invalid or expired
          logout();
        }
      } catch (err) {
        console.error('Session initialization failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login(email, password);
      if (res.success) {
        const { user, accessToken } = res.data;
        setUser(user);
        setToken(accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('auth_token', accessToken);
        // Connect socket
        socketService.connect(accessToken);
        return { success: true, user };
      }
      return { success: false, message: res.message };
    } catch (error) {
      return { success: false, message: error };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      const res = await authAPI.register(userData);
      if (res.success) {
        const { user, accessToken } = res.data;
        setUser(user);
        setToken(accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('auth_token', accessToken);
        // Connect socket
        socketService.connect(accessToken);
        return { success: true, user };
      }
      return { success: false, message: res.message };
    } catch (error) {
      return { success: false, message: error };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout(); // Inform backend (optional)
    } catch (err) {
      // ignore
    }
    
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    
    // Disconnect socket
    socketService.disconnect();
  }, []);

  const isAuthenticated = !!user && !!token;

  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, token, loading, isAuthenticated,
      login, register, logout, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
