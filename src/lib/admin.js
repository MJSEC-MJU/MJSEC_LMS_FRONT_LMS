
 import { api } from '../components/client';

 export async function fetchAdminUsers(token) {
   if (!token) throw new Error('토큰이 필요합니다');
   // 서버 규격: GET /api/v1/admin/users
   return api('GET', '/admin/users', null, token);
 }

/**
+ * 관리자: 사용자 삭제
+ * @param {number|string} userId 사용자 ID (PathVariable)
+ * @param {string} token JWT 액세스 토큰
+ * @returns {Promise<{code:string,message:string}>}
 */
export async function deleteAdminUser(userId, token) {
  if (!token) throw new Error('토큰이 필요합니다');
  if (userId === undefined || userId === null || userId === '') {
    throw new Error('userId가 필요합니다');
  }
  return api('DELETE', `/admin/users/${userId}`, null, token);
}
/*** End Patchen JWT 액세스 토큰
 * @returns {Promise<{code:string,message:string}>}
 */
export async function deleteAdminUser(userId, token) {
  if (!token) throw new Error('토큰이 필요합니다');
  if (userId === undefined || userId === null || userId === '') {
    throw new Error('userId가 필요합니다');
  }
  return api('DELETE', `/admin/users/${userId}`, null, token);
}


