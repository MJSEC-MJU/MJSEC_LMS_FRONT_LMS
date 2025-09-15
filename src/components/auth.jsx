import { useEffect, useMemo, useState, useCallback, useContext } from 'react';
import { AuthCtx } from '../contexts/auth-context.js';
// cookie helpers
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (10 * 60 * 60 * 1000)); // 10시간 유지
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1);
    if (c.indexOf(nameEQ) === 0) {
      const cookieValue = c.substring(nameEQ.length);
      return cookieValue;
    }
  }
  return null;
}

function eraseCookie(name) {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    const decoded = JSON.parse(jsonPayload);
    return decoded;
  } catch (e) {
    // JWT 디코딩 오류 처리
    return null;
  }
}

/* eslint-disable react-refresh/only-export-components */
export default function AuthProvider({ children }) {
  const [token, setToken_] = useState(() => getCookie('token') || '');
  const [isInitialized, setIsInitialized] = useState(false);

  const setToken = useCallback((newToken) => {
    setToken_(newToken);
    if (newToken) setCookie('token', newToken, 7);
    else eraseCookie('token');
  }, []);

  const user = useMemo(() => {
    if (!token) return null;
    const decoded = decodeJwt(token);
    return decoded || null;
  }, [token]);

  useEffect(() => { setIsInitialized(true); }, []);

  // 토큰이 손상/만료되어 decode 실패하면 자동 로그아웃
  useEffect(() => {
    if (isInitialized && token && !user) setToken('');
  }, [isInitialized, token, user, setToken]);

  const logout = useCallback(() => { setToken(''); }, [setToken]);

  const value = useMemo(() => ({ token, setToken, user, logout, isInitialized }), [token, setToken, user, logout, isInitialized]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export { AuthProvider };

export function useAuth(){
  const ctx = useContext(AuthCtx);
  if(!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
