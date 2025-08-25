// src/lib/api.ts
const API_BASE = '/lms/api'  // 프로덕션 고정

export async function getCourses() {
  const r = await fetch(`${API_BASE}/courses`, { credentials: 'include' })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}
