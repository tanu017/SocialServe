import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, getMe } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('givehub_token');
      const storedUser = localStorage.getItem('givehub_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Verify token is still valid
        try {
          const response = await getMe();
          setUser(response.data.data || response.data);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('givehub_token');
          localStorage.removeItem('givehub_user');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await loginUser({ email, password });
      const { token: newToken, user: userData } = response.data.data || response.data;

      localStorage.setItem('givehub_token', newToken);
      localStorage.setItem('givehub_user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);

      return response.data;
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    }
  };

  const register = async (data) => {
    try {
      const response = await registerUser(data);
      const { token: newToken, user: userData } = response.data.data || response.data;

      localStorage.setItem('givehub_token', newToken);
      localStorage.setItem('givehub_user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);

      return response.data;
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('givehub_token');
      localStorage.removeItem('givehub_user');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
