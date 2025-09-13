export async function api(method, path, body, token) {
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let requestBody;
  if (body instanceof FormData) {
    requestBody = body;
    // FormData는 Content-Type을 자동으로 설정하므로 명시적으로 설정하지 않음
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }
  // 환경별 API 베이스 계산
  // 1) VITE_API_BASE가 있으면 우선 사용 (예: "/api/v1" 또는 "https://api.example.com/api/v1")
  // 2) 없으면 기존 동작 유지: PROD는 https://<host>/<base>/api/v1, DEV는 http://localhost:8080/api/v1
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
      console.error('Full error response:', {
        status: res.status,
        statusText: res.statusText,
        data: data,
        headers: Object.fromEntries(res.headers.entries())
      });
      const msgDev = (data && (data.message || data.error)) || `HTTP ${res.status}`;
      console.error('API Error:', msgDev);
    }
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}