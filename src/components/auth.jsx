import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

// cookie helpers ... (동일)
function setCookie(name, value, days) { /* ... */ }
function getCookie(name) { /* ... */ }
function eraseCookie(name) { /* ... */ }

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch { return null; }
}

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken_] = useState(() => getCookie('token') || '');

  // 토큰만 책임지는 안정화된 setter
  const setToken = useCallback((newToken) => {
    setToken_(newToken);
    if (newToken) setCookie('token', newToken, 7);
    else eraseCookie('token');
  }, []);

  // token → user 파생값
  const user = useMemo(() => {
    if (!token) return null;
    return decodeJwt(token) || null;
  }, [token]);

  // 토큰이 손상/만료되어 decode 실패하면 자동 로그아웃
  useEffect(() => {
    if (token && !user) setToken('');
  }, [token, user, setToken]);

  const logout = useCallback(() => { setToken(''); }, [setToken]);

  const value = useMemo(() => ({ token, setToken, user, logout }), [token, user, logout]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(){
  const ctx = useContext(AuthCtx);
  if(!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
