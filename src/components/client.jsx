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

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: requestBody,
    credentials: 'include',
  });

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();

  // if (!res.ok) {
  //   const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
  //   throw new Error(msg);
  // }
  // return data;

  // HTTP 상태 코드와 응답 데이터를 함께 반환
  return { ok: res.ok, status: res.status, data: data };
}