import { api } from './api.js';

/**
 * 관리자용 전체 사용자 목록 조회
 * @param {string} token - 인증 토큰
 * @returns {Promise<Object>} API 응답 객체
 */
export async function fetchAdminUsers(token) {
  try {
    const response = await api('GET', '/admin/users', null, token);
    return response;
  } catch (error) {
    console.error('Error fetching admin users:', error);
    throw error;
  }
}

/**
 * 관리자용 사용자 삭제
 * @param {string|number} userId - 삭제할 사용자 ID
 * @param {string} token - 인증 토큰
 * @returns {Promise<Object>} API 응답 객체
 */
export async function deleteAdminUser(userId, token) {
  try {
    const response = await api('DELETE', `/admin/users/${userId}`, null, token);
    return response;
  } catch (error) {
    console.error('Error deleting admin user:', error);
    throw error;
  }
}
