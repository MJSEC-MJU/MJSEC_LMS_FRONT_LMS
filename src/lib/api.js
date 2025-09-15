
const API_BASE = '/lms/api'

export async function getCourses() {
  const r = await fetch(`${API_BASE}/courses`, { credentials: 'include' })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// 범용 API 호출 함수 (Authorization 헤더 포함 가능)
export async function api(method, path, body, token) {
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let requestBody;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  // 환경별 API 베이스 계산
  const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const defaultProdOrigin = `${window.location.origin}${basePath}`; // 예: https://mjsec.kr/lms
  const originBase = import.meta.env.PROD ? defaultProdOrigin : "http://localhost:8080";

  const envApiBaseRaw = import.meta.env.VITE_API_BASE; // 선택: "/api/v1" 또는 "https://mjsec.kr/api/v1"
  const apiBase = envApiBaseRaw && envApiBaseRaw.trim() !== ""
    ? envApiBaseRaw.replace(/\/$/, "")
    : `${originBase}/api/v1`;

  const url = `${apiBase}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    body: requestBody,
    credentials: 'include',
  });

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    if (!import.meta.env.PROD) {
      // API 에러 응답 처리
      // const msgDev = (data && (data.message || data.error)) || `HTTP ${res.status}`;
      // API 에러 메시지 처리
    }
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}