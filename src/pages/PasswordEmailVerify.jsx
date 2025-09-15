import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../components/client';
import { useAuth } from '../components/auth';

const COOLDOWN_SEC = 60;

export default function PasswordEmailVerify() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [email, setEmail] = useState(() => user?.email ?? '');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSend = isEmailValid && !sending && cooldown === 0;
  const canVerify = isEmailValid && !!code && !verifying;

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  const handleSendCode = async () => {
    setErr('');
    setInfo('');

    if (!isEmailValid) {
      setErr('올바른 이메일 주소를 입력해 주세요.');
      return;
    }
    if (!canSend) return;

    try {
      setSending(true);
      const res = await api(
      'POST',
      `/user/password/send-code?email=${encodeURIComponent(email)}`
      );      
        if (res?.code === 'SUCCESS') {
        setInfo('인증 코드가 이메일로 전송되었습니다.');
        setCooldown(COOLDOWN_SEC);
      } else {
        setErr(res?.message || '코드 발송에 실패했습니다.');
      }
    } catch (e) {
      setErr(e?.message || '코드 발송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    setErr('');
    setInfo('');

    if (!isEmailValid) {
      setErr('올바른 이메일 주소를 입력해 주세요.');
      return;
    }
    if (!code) {
      setErr('수신한 인증 코드를 입력해 주세요.');
      return;
    }
    if (!canVerify) return;

    try {
      setVerifying(true);
const res = await api(
      'POST',
      `/user/password/verify-code?email=${encodeURIComponent(email)}`,
      { code }
    );      if (res?.code === 'SUCCESS') {
        setInfo('인증이 완료되었습니다. 비밀번호 변경 페이지로 이동합니다.');
        // 실제 라우트에 맞게 조정하세요. 예: /password/update
        setTimeout(() => nav('/password/update', { replace: true, state: { email } }), 600);
      } else {
        setErr(res?.message || '인증에 실패했습니다. 코드를 확인해 주세요.');
      }
    } catch (e) {
      setErr(e?.message || '인증 중 오류가 발생했습니다.');
    } finally {
      setVerifying(false);
    }
  };

  const onCodeKeyDown = (e) => {
    if (e.key === 'Enter') handleVerifyCode();
  };

  return (
    <section className="form-container">
      <form onSubmit={(e) => e.preventDefault()} noValidate>
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
          aria-invalid={!isEmailValid}
        />

        <button
          type="button"
          className="btn"
          onClick={handleSendCode}
          disabled={!canSend}
          aria-busy={sending}
        >
          {sending ? '전송 중…' : cooldown > 0 ? `재전송 (${cooldown}s)` : '인증 코드 보내기'}
        </button>

        <input
          type="text"
          name="code"
          placeholder="인증 코드"
          required
          className="box"
          value={code}
          onChange={(e) => setCode(e.target.value.trim())}
          onKeyDown={onCodeKeyDown}
          autoComplete="one-time-code"
          inputMode="numeric"
        />

        <button
          type="button"
          className="btn"
          onClick={handleVerifyCode}
          disabled={!canVerify}
          aria-busy={verifying}
        >
          {verifying ? '확인 중…' : '인증 코드 확인'}
        </button>

        <p><Link to="/login">로그인</Link></p>
        <p><Link to="/register">회원가입</Link></p>
      </form>
    </section>
  );
}
