// src/components/client.ts
export async function api(method, path, body, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let requestBody;
  if (body instanceof FormData) {
    requestBody = body; // Content-Type 자동
  } else if (body) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, ""); // "" 또는 "/lms"
  const raw = (import.meta.env.VITE_API_BASE || "").trim();

  const isAbs = (s) => /^https?:\/\//i.test(s);
  const ensureApiV1 = (b) => {
    // 실수 보정: "/api"로 끝나면 "/v1" 붙임
    if (/\/api$/i.test(b)) return `${b}/v1`;
    return b;
  };

  // VITE_API_BASE 우선 사용 (절대/상대 모두 대응)
  let apiBase;
  if (raw) {
    let b = raw.replace(/\/$/, "");
    b = ensureApiV1(b);

    if (isAbs(b)) {
      apiBase = b; // 절대 URL이면 그대로
    } else {
      // 경로형이면 dev/prod에 맞춰 호스트 결합
      b = b.startsWith("/") ? b : `/${b}`;
      apiBase = import.meta.env.PROD ? `${window.location.origin}${b}` : b;
    }
  } else {
    // 기본값: dev는 상대경로(/api/v1) → Vite proxy가 처리, prod는 BASE_URL(/lms) 기준
    apiBase = import.meta.env.PROD
      ? `${window.location.origin}${basePath}/api/v1`
      : `/api/v1`;
  }

  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${apiBase}${p}`;

  const res = await fetch(url, {
    method,
    headers,
    body: requestBody,
    credentials: "include",
  });

  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
