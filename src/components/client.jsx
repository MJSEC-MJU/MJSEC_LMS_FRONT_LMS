const API_BASE = "/api/v1";

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
  const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const originBase = import.meta.env.PROD
    ? `${window.location.origin}${basePath}` // 요놈이 https://mjsec.kr/lms
    : "http://localhost:8080";

  const url = `${originBase}${API_BASE}${path}`;

  console.log(`API Request: ${method} ${url}`);
  console.log('Headers:', headers);
  console.log('Body:', requestBody);

  const res = await fetch(url, {
    method,
    headers,
    body: requestBody,
    credentials: 'include',
  });

  console.log(`API Response Status: ${res.status}`);
  console.log('Response Headers:', Object.fromEntries(res.headers.entries()));

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();

  console.log('Response Data:', data);

  if (!res.ok) {
    console.error('Full error response:', {
      status: res.status,
      statusText: res.statusText,
      data: data,
      headers: Object.fromEntries(res.headers.entries())
    });
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    console.error('API Error:', msg);
    throw new Error(msg);
  }
  return data;
}