﻿import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../components/client';        
import { useAuth } from '../components/auth';
import { jwtDecode } from "jwt-decode";

export default function Login() {
  const { setToken } = useAuth();
  const nav = useNavigate();

  const [studentNo, setStudentNo] = useState(''); // 이메일 대신 학번 (studentNumber) 사용
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = !!studentNo && !!password && !busy; // 학번으로 변경

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErr('');
    try {
      // 백엔드 명세에 맞게 studentNumber와 password 전송
      const data = await api('POST', '/auth/login', { studentNumber: parseInt(studentNo, 10), password });

      const token = (
        data?.data?.accessToken ||
        data?.accessToken ||
        data?.data?.token ||
        data?.token ||
        data?.jwt ||
        data?.data?.jwt ||
        data?.access_token ||
        data?.data?.access_token
      );
      

      if (!token) throw new Error('토큰을 받지 못했습니다.'); // refreshToken 확인 제거
      setToken(token); // login 함수 대신 setToken 함수 호출
      
      const decodedToken = jwtDecode(token); // 토큰 디코딩
      const userRole = decodedToken?.role; // 디코딩된 토큰에서 role 추출
      
      // 역할에 따라 리다이렉션
      if (userRole === 'ROLE_ADMIN') {

        nav('/admin', { replace: true });
      } else {
        nav('/', { replace: true }); // 일반 사용자라면 홈페이지로 리다이렉션
      }
    } catch (e) {
      setErr(e?.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="form-container">
      <form onSubmit={submit} noValidate>
        <div className="logo-header">
          <h3>MJSEC LMS</h3>
        </div>

        {err && <p className="error-message">{err}</p>}

        <input
          type="text"
          name="studentNumber" // name 속성을 studentNumber로 변경
          placeholder="ID(학번)"
          required
          maxLength={50}
          className="box"
          value={studentNo} // email 대신 studentNo 사용
          onChange={(e) => setStudentNo(e.target.value)}  // email 대신 setStudentNo 사용
          autoComplete="username"
        />

        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          required
          maxLength={20}
          className="box"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button type="submit" className="btn" disabled={!canSubmit}>
          {busy ? '로그인 중…' : '로그인'}
        </button>

        <p><Link to="/register">회원가입</Link></p>
        <p><Link to="/forgot-password">비밀번호 변경</Link></p>
      </form>
    </section>
  );
}
