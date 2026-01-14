import { useState } from 'react';
import { api } from '../components/client'; // api 함수 임포트
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [cPass, setCPass] = useState('');
  const [phonePart1, setPhonePart1] = useState(''); // 전화번호 첫째 부분
  const [phonePart2, setPhonePart2] = useState(''); // 전화번호 둘째 부분
  const [phonePart3, setPhonePart3] = useState(''); // 전화번호 셋째 부분
  const [busy, setBusy] = useState(false); // 전체 폼 제출 상태
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // 학번 및 이메일 중복 확인을 위한 상태 변수
  const [studentNoAvailability, setStudentNoAvailability] = useState('idle'); // 'idle', 'checking', 'available', 'taken', 'error'
  const [emailAvailability, setEmailAvailability] = useState('idle'); // 'idle', 'checking', 'available', 'taken', 'error'

  // 학번 중복 확인 함수
  const checkStudentNumberDuplication = async () => {
    if (!studentNo) {
      alert('학번을 입력해주세요.');
      setStudentNoAvailability('error');
      return;
    }
    setStudentNoAvailability('checking');
    try {
      const num = Number(studentNo);
      const res = await api(
        'GET',
        `/auth/check-student-number?studentNumber=${encodeURIComponent(num)}`
      );

      // 백엔드가 { code:'SUCCESS', data:true/false } 형태를 줄 때
      if (res?.code === 'SUCCESS') {
        const available = res?.data === true || res?.data?.available === true;
        if (available) {
          setStudentNoAvailability('available');
          alert('사용 가능한 학번입니다!');
        } else {
          setStudentNoAvailability('taken');
          alert('사용 중인 학번입니다...');
        }
        return;
      }

      // api 래퍼가 { ok, status, data } 형태를 줄 때
      if (res?.ok && res?.status === 200) {
        const available = res?.data?.data === true || res?.data?.available === true;
        if (available) {
          setStudentNoAvailability('available');
          alert('사용 가능한 학번입니다!');
        } else {
          setStudentNoAvailability('taken');
          alert('사용 중인 학번입니다...');
        }
        return;
      }

      // 409를 ‘이미 사용 중’으로 처리
      if (res?.status === 409) {
        setStudentNoAvailability('taken');
        alert('사용 중인 학번입니다...');
        return;
      }

      // 그 외
      setStudentNoAvailability('error');
      alert(res?.message || res?.data?.message || '학번 확인 중 오류 발생');
    } catch (e) {
      const status = e?.status || e?.response?.status;
      if (status === 409) {
        setStudentNoAvailability('taken');
        alert('사용 중인 학번입니다...');
      } else {
        setStudentNoAvailability('error');
        alert(`학번 확인 중 오류: ${e?.message || '네트워크 오류'}`);
      }
    }
  };

  // 이메일 중복 확인 함수
  const checkEmailDuplication = async () => {
    if (!email) {
      alert('이메일을 입력해주세요!');
      setEmailAvailability('error');
      return;
    }
    setEmailAvailability('checking');
    try {
      const res = await api(
        'GET',
        `/auth/check-email?email=${encodeURIComponent(email)}`
      );

      if (res?.code === 'SUCCESS') {
        const available = res?.data === true || res?.data?.available === true;
        if (available) {
          setEmailAvailability('available');
          alert('사용 가능한 이메일입니다!');
        } else {
          setEmailAvailability('taken');
          alert('사용 중인 이메일입니다...');
        }
        return;
      }

      if (res?.ok && res?.status === 200) {
        const available = res?.data?.data === true || res?.data?.available === true;
        if (available) {
          setEmailAvailability('available');
          alert('사용 가능한 이메일입니다!');
        } else {
          setEmailAvailability('taken');
          alert('사용 중인 이메일입니다...');
        }
        return;
      }

      if (res?.status === 409) {
        setEmailAvailability('taken');
        alert('사용 중인 이메일입니다...');
        return;
      }

      setEmailAvailability('error');
      alert(res?.message || res?.data?.message || '이메일 확인 중 오류 발생');
    } catch (e) {
      const status = e?.status || e?.response?.status;
      if (status === 409) {
        setEmailAvailability('taken');
        alert('사용 중인 이메일입니다...');
      } else {
        setEmailAvailability('error');
        alert(`이메일 확인 중 오류: ${e?.message || '네트워크 오류'}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    if (!privacyAgreed) {
      alert('개인정보 처리방침에 동의해 주세요.');
      return;
    }

    if (!name || !studentNo || !email || !pass || !cPass || !phonePart1 || !phonePart2 || !phonePart3) {
      alert('모든 필수 필드를 입력하세요.');
      return;
    }

    // 중복 확인 여부 및 결과 확인
    if (studentNoAvailability !== 'available') {
      alert('학번 중복 확인을 완료하거나, 사용 가능한 학번을 입력해주세요.');
      return;
    }
    if (emailAvailability !== 'available') {
      alert('이메일 중복 확인을 완료하거나, 사용 가능한 이메일을 입력해주세요.');
      return;
    }

    // 클라이언트 측 유효성 검사
    if (pass !== cPass) {
      alert('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[|'";:,.<>?]).*$/;
    if (!passwordRegex.test(pass)) {
      alert('비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다.');
      return;
    }

    setBusy(true);
    try {
      const phoneNumber = `${phonePart1}-${phonePart2}-${phonePart3}`;

      const userData = {
        studentNumber: parseInt(studentNo, 10),
        password: pass,
        name: name,
        email: email,
        phoneNumber: phoneNumber,
      };

      const requestBody = { userDto: userData };

      const data = await api('POST', '/auth/register', requestBody);

      if ((data?.ok && data?.status === 200)|| data?.code === 'SUCCESS') {
        alert('회원가입 성공! 승인을 기다려 주세요.');
        nav('/login', { replace: true });
      } else {
        const errorMessages = data?.data?.errors
          ? data.data.errors.map(err => err.message).join('\n')
          : data?.data?.message || '회원가입 중 알 수 없는 오류가 발생했습니다.';
        alert(`회원가입 실패:\n${errorMessages}`);
      }
    } catch (e) {
      alert(e?.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="form-container">
      <form onSubmit={handleSubmit} noValidate>
        <h3>회원가입</h3>

        <p>이름 <span>*</span></p>
        <input
          type="text"
          name="name"
          placeholder="이름을 입력하세요"
          required
          maxLength={50}
          className="box"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />

        <p>학번<span>*</span></p>
        <div className="input-with-button-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            name="student-no"
            placeholder="학번을 입력하세요"
            required
            maxLength={50}
            className="box"
            style={{ flex: '1' }}
            value={studentNo}
            onChange={(e) => { setStudentNo(e.target.value); setStudentNoAvailability('idle'); }}
            autoComplete="off"
          />
          <button
            type="button"
            className="btn"
            onClick={checkStudentNumberDuplication}
            disabled={studentNoAvailability === 'checking'}
            style={{ width: 'auto', padding: '10px 20px' }}
          >
            {studentNoAvailability === 'checking' ? '확인 중...' : '중복 확인'}
          </button>
        </div>

        <p>이메일 <span>*</span></p>
        <div className="input-with-button-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="email"
            name="email"
            placeholder="이메일을 입력하세요"
            required
            maxLength={50}
            className="box"
            style={{ flex: '1' }}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailAvailability('idle'); }}
            autoComplete="off"
          />
          <button
            type="button"
            className="btn"
            onClick={checkEmailDuplication}
            disabled={emailAvailability === 'checking'}
            style={{ width: 'auto', padding: '10px 20px' }}
          >
            {emailAvailability === 'checking' ? '확인 중...' : '중복 확인'}
          </button>
        </div>

        <p>비밀번호 <span>*</span></p>
        <input
          type="password"
          name="pass"
          placeholder="비밀번호를 입력하세요"
          required
          maxLength={20}
          className="box"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          autoComplete="new-password"
        />
        <p>비밀번호 확인 <span>*</span></p>
        <input
          type="password"
          name="c_pass"
          placeholder="비밀번호를 다시 입력하세요"
          required
          maxLength={20}
          className="box"
          value={cPass}
          onChange={(e) => setCPass(e.target.value)}
          autoComplete="new-password"
        />

        <p>전화번호 <span>*</span></p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            name="phonePart1"
            placeholder="010"
            required
            maxLength={3}
            className="box"
            style={{ flex: '1' }}
            value={phonePart1}
            onChange={(e) => setPhonePart1(e.target.value)}
            autoComplete="off"
          />
          <span>-</span>
          <input
            type="text"
            name="phonePart2"
            placeholder="1234"
            required
            maxLength={4}
            className="box"
            style={{ flex: '1' }}
            value={phonePart2}
            onChange={(e) => setPhonePart2(e.target.value)}
            autoComplete="off"
          />
          <span>-</span>
          <input
            type="text"
            name="phonePart3"
            placeholder="5678"
            required
            maxLength={4}
            className="box"
            style={{ flex: '1' }}
            value={phonePart3}
            onChange={(e) => setPhonePart3(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="privacy-agreement-container" style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            id="privacy-check" 
            checked={privacyAgreed} 
            onChange={(e) => setPrivacyAgreed(e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          <label htmlFor="privacy-check" style={{ fontSize: '1.5rem', color: 'var(--black)', cursor: 'pointer' }}>
            <span 
              onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}
              style={{ color: 'var(--main-color)', textDecoration: 'underline', fontWeight: 'bold' }}
            >
              개인정보 처리방침
            </span>
            에 동의합니다. (필수)
          </label>
        </div>

        <input
          type="submit"
          value={busy ? '회원가입 중...' : '회원가입'}
          name="submit"
          className="btn"
          disabled={busy || !privacyAgreed} // 동의하지 않으면 비활성화
          style={{ opacity: (busy || !privacyAgreed) ? 0.5 : 1, cursor: (busy || !privacyAgreed) ? 'not-allowed' : 'pointer' }}
        />
      </form>
      {showPrivacyModal && (
        <div className="assignment-modal-overlay" onClick={() => setShowPrivacyModal(false)} style={{ zIndex: 10000 }}>
          <div className="assignment-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="assignment-modal-header">
              <h3 className="assignment-modal-title">개인정보 처리방침</h3>
              <button className="assignment-modal-close" onClick={() => setShowPrivacyModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="assignment-modal-body" style={{ fontSize: '1.4rem', lineHeight: '1.6', color: 'var(--black)' }}>
              <h4>정보통신망법상의 요구사항</h4>
              <p><strong>1. 수집·이용 동의:</strong> 이용자의 개인정보를 수집하기 전에 목적, 항목, 보유 기간 등을 명시하고 동의를 받습니다.</p>
              <p><strong>2. 최소 수집 원칙:</strong> 목적 달성에 필요한 최소한의 정보만을 수집합니다.</p>
              <p><strong>3. 안전성 확보 조치:</strong> 수집한 정보는 암호화 및 접근 통제를 통해 안전하게 보관합니다.</p>
              <br />
              <h4>ISMS-P 관점</h4>
              <p>사용자 접속기록(일시, IP 등)을 포함하여 관련 법령에 따라 일정 기간 안전하게 보관·관리합니다.</p>
            </div>
            <div className="assignment-modal-footer">
              <button className="btn" onClick={() => setShowPrivacyModal(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
