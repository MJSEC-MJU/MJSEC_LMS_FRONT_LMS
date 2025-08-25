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

  console.log(`API Request: ${method} ${API_BASE}${path}`);
  console.log('Headers:', headers);
  console.log('Body:', requestBody);

  // 임시로 직접 백엔드 주소로 요청 (프록시 문제 해결을 위해)
  const res = await fetch(`http://localhost:8080${API_BASE}${path}`, {
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