/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);

  useEffect(() => { token ? localStorage.setItem('token', token) : localStorage.removeItem('token'); }, [token]);

  const logout = () => { setToken(''); setUser(null); };
  const value = useMemo(() => ({ token, setToken, user, setUser, logout }), [token, user]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(){
  const ctx = useContext(AuthCtx);
  if(!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}