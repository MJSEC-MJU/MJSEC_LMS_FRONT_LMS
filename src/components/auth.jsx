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
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const cookieValue = c.substring(nameEQ.length, c.length);
      console.log(`getCookie('${name}') returning:`, cookieValue); // Added log
      return cookieValue;
    }
  }
  console.log(`getCookie('${name}') returning: null`); // Added log
  return null;
}
function eraseCookie(name) { /* ... */ }

// Function to decode JWT and get expiration time
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    const decoded = JSON.parse(jsonPayload);
    console.log("JWT Decoded Payload:", decoded); // Added log
    return decoded;
  } catch (e) {
    console.error("Error decoding JWT:", e); // Added log
    return null;
  }
}

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken_] = useState(() => getCookie('token') || '');

  // 토큰만 책임지는 안정화된 setter
  const setToken = useCallback((newToken) => {
    setToken_(newToken);
    if (newToken) {
      setCookie('token', newToken, 7);
      const decoded = decodeJwt(newToken); // Decode token to get user info
      console.log("setUser called with:", decoded); // Added log
      // setUser(decoded); // 이전 user 업데이트 로직 제거 (useMemo로 변경)
    } else {
      eraseCookie('token');
      // setUser(null); // 이전 user 업데이트 로직 제거 (useMemo로 변경)
    }
  }, []);

  // token → user 파생값
  const user = useMemo(() => {
    if (!token) return null;
    const decoded = decodeJwt(token); // 토큰이 변경될 때마다 디코딩
    console.log("User computed from token (useMemo):", decoded); // Added log
    return decoded || null;
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