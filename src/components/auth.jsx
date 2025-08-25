import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

// cookie helpers ... (동일)
function setCookie(name, value, days) {
  console.log(`Attempting to set cookie: ${name}=${value}`); // Added log
  let expires = "";
  if (days) {
    const date = new Date();
    // date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); // 7일 유지 로직
    date.setTime(date.getTime() + (10 * 60 * 60 * 1000)); // 10시간 유지 로직
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
  console.log("Document cookies after set:", document.cookie); // Added log
}
function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
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
    return JSON.parse(jsonPayload);
  } catch { return null; }
}

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken_] = useState(() => getCookie('token') || '');
  const [isInitialized, setIsInitialized] = useState(false);

  // 토큰만 책임지는 안정화된 setter
  const setToken = useCallback((newToken) => {
    setToken_(newToken);
    if (newToken) setCookie('token', newToken, 7);
    else eraseCookie('token');
  }, []);

  // token → user 파생값
  const user = useMemo(() => {
    if (!token) return null;
    const decoded = decodeJwt(token);
    if (!decoded) {
      console.log('Token decode failed, token might be invalid or expired');
      return null;
    }
    console.log('Decoded user from token:', decoded);
    return decoded;
  }, [token]);

  // 초기화 완료 표시
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // 토큰이 손상/만료되어 decode 실패하면 자동 로그아웃
  useEffect(() => {
    if (isInitialized && token && !user) {
      console.log('Token exists but user decode failed, logging out');
      setToken('');
    }
  }, [token, user, setToken, isInitialized]);

  const logout = useCallback(() => { setToken(''); }, [setToken]);

  const value = useMemo(() => ({ token, setToken, user, logout, isInitialized }), [token, user, logout, isInitialized]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(){
  const ctx = useContext(AuthCtx);
  if(!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
