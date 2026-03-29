import { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { applyCalibrationFromUser } from '../utils/calibration';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authApi.getCurrentUser();
        const u = response.data.data.user;
        applyCalibrationFromUser(u);
        setUser(u);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    const { user, token } = response.data.data;
    localStorage.setItem('token', token);
    applyCalibrationFromUser(user);
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const response = await authApi.register(data);
    const { user, token } = response.data.data;
    localStorage.setItem('token', token);
    applyCalibrationFromUser(user);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};