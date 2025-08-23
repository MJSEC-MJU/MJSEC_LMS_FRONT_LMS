import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth';

export default function Admin() {
  const { token, user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!token || !user || user.role !== 'ROLE_ADMIN') {
      nav('/unauthorized', { replace: true }); // Unauthorized 페이지로 리다이렉션
    }
  }, [token, user, nav]);

  if (!token || !user || user.role !== 'ROLE_ADMIN') {
    return null; // 리다이렉션 전에 컴포넌트 렌더링을 막음
  }

  return (
    <section className="admin-dashboard">
      <h1 className="heading">관리자 대시보드</h1>
      <p>환영합니다, 관리자님!</p>
      <p>이곳은 관리자 전용 페이지입니다.</p>
    </section>
  );
}
