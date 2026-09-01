import { createContext, useContext, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('leadhub_user');
    return saved ? JSON.parse(saved) : null;
  });

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('leadhub_token', data.token);
    localStorage.setItem('leadhub_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    if (data.token) {
      localStorage.setItem('leadhub_token', data.token);
      localStorage.setItem('leadhub_user', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  }

  function logout() {
    localStorage.removeItem('leadhub_token');
    localStorage.removeItem('leadhub_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
