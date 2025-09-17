import { Navigate } from 'react-router-dom';
import { useAuth } from './auth';

export default function PublicRoute({ children }) {
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

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  if (user) {
    return <Navigate to="/home" replace />;
  }

  // 로그인되지 않은 사용자는 해당 페이지 렌더링
  return children;
}
