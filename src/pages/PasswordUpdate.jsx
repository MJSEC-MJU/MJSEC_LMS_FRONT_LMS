import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../components/client';
import { useAuth } from '../components/auth';

export default function PasswordUpdate() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();

  // 이메일은 이전 단계(state)나 로그인 사용자에서 유도
  const [email, setEmail] = useState(() => loc.state?.email ?? user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  // 간단한 유효성: 8~64자, 대문자/소문자/숫자/특수문자 각 1개 이상
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwOk = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,64}$/.test(password);
  const matchOk = password === confirm;

  const canSubmit = emailOk && pwOk && matchOk && !busy;

  useEffect(() => {
    // 이전 페이지에서 이메일을 못 넘겼다면 안내
    if (!email) setInfo('이메일을 입력해 주세요. (이전 단계에서 인증했다면 자동으로 채워집니다)');
  }, [email]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      if (!emailOk) setErr('올바른 이메일 주소를 입력해 주세요.');
      else if (!pwOk) setErr('비밀번호는 8~64자, 대/소문자·숫자·특수문자를 각 1개 이상 포함해야 합니다.');
      else if (!matchOk) setErr('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setErr('');
    setInfo('');
    setBusy(true);
    try {
      // ⚠ 프로젝트 설정에 따라 한 줄을 선택하세요.
      // const res = await api('PUT', '/api/v1/user/password/update', { email, password }); // prefix 없음
      const res = await api('PUT', '/user/password/update', { email, password });          // api가 /api/v1 prefix 할 때

      if (res?.code === 'SUCCESS') {
        setInfo('비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.');
        setTimeout(() => nav('/login', { replace: true }), 700);
      } else {
        setErr(res?.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (e) {
      setErr(e?.message || '비밀번호 변경 중 오류가 발생했습니다.');
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
        {info && <p className="info-message">{info}</p>}

        <input
          type="email"
          name="email"
          placeholder="이메일"
          required
          className="box"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          aria-invalid={!emailOk}
        />

        <input
          type="password"
          name="new-password"
          placeholder="새 비밀번호 (8~64자, 대/소문자·숫자·특수문자 포함)"
          required
          className="box"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          aria-invalid={password ? !pwOk : undefined}
        />

        <input
          type="password"
          name="confirm-password"
          placeholder="새 비밀번호 확인"
          required
          className="box"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          aria-invalid={confirm ? !matchOk : undefined}
        />

        <button type="submit" className="btn" disabled={!canSubmit} aria-busy={busy}>
          {busy ? '변경 중…' : '비밀번호 변경'}
        </button>

        <p><Link to="/login">로그인</Link></p>
        <p><Link to="/forgot-password">이메일 인증으로 돌아가기</Link></p>
      </form>
    </section>
  );
}
