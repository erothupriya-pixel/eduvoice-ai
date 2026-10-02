import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    if (savedUser && token) {
      setUser(jsonParseSafe(savedUser));
    }
    setLoading(false);
  }, []);

  const jsonParseSafe = (str) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/token/', { email, password });
      const { access, refresh, user: userData } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      let errorMsg = 'Invalid email or password.';
      if (error.response?.data) {
        const data = error.response.data;
        if (data.detail) {
          errorMsg = data.detail;
        } else if (typeof data === 'string') {
          errorMsg = data;
        } else if (typeof data === 'object') {
          const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`);
          if (msgs.length > 0) errorMsg = msgs.join(' | ');
        }
      } else if (error.message) {
        errorMsg = `Network Error: ${error.message}`;
      }
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password, role) => {
    setLoading(true);
    try {
      await api.post('/api/auth/register/', { username, email, password, role });
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const errors = error.response?.data;
      let errorMsg = 'Failed to register.';
      if (errors) {
        if (typeof errors === 'string') {
          errorMsg = errors;
        } else if (errors.detail) {
          errorMsg = errors.detail;
        } else if (typeof errors === 'object') {
          const errorMessages = [];
          for (const [key, val] of Object.entries(errors)) {
            const msg = Array.isArray(val) ? val.join(' ') : String(val);
            errorMessages.push(`${key}: ${msg}`);
          }
          if (errorMessages.length > 0) {
            errorMsg = errorMessages.join(' | ');
          }
        }
      } else if (error.message) {
        errorMsg = `Network Error: ${error.message}`;
      }
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
