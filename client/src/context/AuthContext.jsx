import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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
      const storedToken = localStorage.getItem('SocialServe_token');
      const storedUser = localStorage.getItem('SocialServe_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Verify token is still valid
        try {
          const response = await getMe();
          // API returns { data: { user: {...} } } — use inner user so role checks work after refresh
          const payload = response?.data?.data ?? response?.data;
          const nextUser = payload?.user ?? payload;
          if (!nextUser?._id) {
            throw new Error('Invalid user session');
          }
          setUser(nextUser);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('SocialServe_token');
          localStorage.removeItem('SocialServe_user');
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

      localStorage.setItem('SocialServe_token', newToken);
      localStorage.setItem('SocialServe_user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);

      return response.data;
    } catch (error) {
      setIsAuthenticated(false);
      const message = error?.response?.data?.message || error?.message || 'Login failed. Please try again.';
      toast.error(message);
      throw error;
    }
  };

  const register = async (data) => {
    try {
      const response = await registerUser(data);
      const { token: newToken, user: userData } = response.data.data || response.data;

      localStorage.setItem('SocialServe_token', newToken);
      localStorage.setItem('SocialServe_user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);

      return response.data;
    } catch (error) {
      setIsAuthenticated(false);
      const message = error?.response?.data?.message || error?.message || 'Registration failed. Please try again.';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('SocialServe_token');
      localStorage.removeItem('SocialServe_user');
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
