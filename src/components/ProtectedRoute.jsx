import { Navigate } from 'react-router-dom';
import { useAuth } from './auth';

export default function ProtectedRoute({ children }) {
  const { user, isInitialized } = useAuth();

  // 초기화 중이면 로딩 표시
  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.8rem',
        color: 'var(--main-color)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
          <div>로딩 중...</div>
        </div>
      </div>
    );
  }

  // 토큰이 없으면 로그인 페이지로 리다이렉트
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 토큰이 있으면 해당 페이지 렌더링
  return children;
}
