import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
axios.defaults.withCredentials = true;

const TOKEN_KEY = "satthamma_token";
const setAuthHeader = (token) => {
  if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete axios.defaults.headers.common["Authorization"];
};
// Restore token immediately at module load so any early axios call carries it.
const _bootToken = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
if (_bootToken) setAuthHeader(_bootToken);

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`);
      setUser(data);
    } catch {
      setUser(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const _saveToken = (token) => {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
      setAuthHeader(token);
    }
  };
  const _clearToken = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    setAuthHeader(null);
  };

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    _saveToken(data.token);
    setUser(data.user);
    return data.user;
  };
  const register = async (payload) => {
    const { data } = await axios.post(`${API}/auth/register`, payload);
    _saveToken(data.token);
    setUser(data.user);
    return data.user;
  };
  const logout = async () => {
    try { await axios.post(`${API}/auth/logout`); } catch { /* ignore */ }
    _clearToken();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
export { API };
