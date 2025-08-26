import { useEffect, useMemo, useState, useCallback } from 'react';
import { AuthCtx } from '../contexts/auth-context.js';
// cookie helpers
function setCookie(name, value, days) {
  console.log(`Attempting to set cookie: ${name}=${value}`);
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (10 * 60 * 60 * 1000)); // 10시간 유지
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
  console.log("Document cookies after set:", document.cookie);
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1);
    if (c.indexOf(nameEQ) === 0) {
      const cookieValue = c.substring(nameEQ.length);
      console.log(`getCookie('${name}') returning:`, cookieValue);
      return cookieValue;
    }
  }
  console.log(`getCookie('${name}') returning: null`);
  return null;
}

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    const decoded = JSON.parse(jsonPayload);
    console.log("JWT Decoded Payload:", decoded);
    return decoded;
  } catch (e) {
    console.error("Error decoding JWT:", e);
    return null;
  }
}

// ✅ 컴포넌트만 export (default)
export default function AuthProvider({ children }) {
  const [token, setToken_] = useState(() => getCookie('token') || '');

  const setToken = useCallback((newToken) => {
    setToken_(newToken);
    if (newToken) {
      setCookie('token', newToken, 7);
      const decoded = decodeJwt(newToken);
      console.log("setUser called with:", decoded);
    } else {
      document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax';
    }
  }, []);

  const user = useMemo(() => {
    if (!token) return null;
    const decoded = decodeJwt(token);
    console.log("User computed from token (useMemo):", decoded);
    return decoded || null;
  }, [token]);

  useEffect(() => {
    if (token && !user) setToken('');
  }, [token, user, setToken]);

  const logout = useCallback(() => { setToken(''); }, [setToken]);

  const value = useMemo(() => ({ token, setToken, user, logout }), [token, setToken, user, logout]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
