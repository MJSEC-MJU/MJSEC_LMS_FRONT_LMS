
 import { api } from '../components/client';

 export async function fetchAdminUsers(token) {
   if (!token) throw new Error('토큰이 필요합니다');
   // 서버 규격: GET /api/v1/admin/users
   return api('GET', '/admin/users', null, token);
 }


export async function deleteAdminUser(userId, token) {
  if (!token) throw new Error('토큰이 필요합니다');
  if (userId === undefined || userId === null || userId === '') {
    throw new Error('userId가 필요합니다');
  }
  return api('DELETE', `/admin/users/${userId}`, null, token);
}


