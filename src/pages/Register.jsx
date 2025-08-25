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

  // 학번 및 이메일 중복 확인을 위한 상태 변수
  const [studentNoAvailability, setStudentNoAvailability] = useState('idle'); // 'idle', 'checking', 'available', 'taken', 'error'
  const [emailAvailability, setEmailAvailability] = useState('idle'); // 'idle', 'checking', 'available', 'taken', 'error'

  // 학번 중복 확인 함수
  const checkStudentNumberDuplication = async () => {
    if (!studentNo) {
      alert('학번을 입력해주세요.'); // alert 사용
      setStudentNoAvailability('error');
      return;
    }
    setStudentNoAvailability('checking');
    try {
      const response = await api('GET', `/auth/check-student-number?studentNumber=${parseInt(studentNo)}`);
      
      if (response.ok && response.status === 200) {
        if (response.data.data) { // 백엔드 응답의 data 필드가 true면 사용 가능
          setStudentNoAvailability('available');
          alert('사용 가능한 학번입니다!'); 
        } else {
          setStudentNoAvailability('taken');
          alert('사용 중인 학번입니다...'); 
        }
      } else if (response.status >= 400) {
        setStudentNoAvailability('error');
        alert(`학번 확인 중 오류 발생: ${response.data.message || `HTTP 오류 ${response.status}`}`);
      } else {
        setStudentNoAvailability('error');
        alert('학번 확인 중 알 수 없는 오류 발생!');
      }
    } catch {
      setStudentNoAvailability('error');
      alert('학번 확인 중 네트워크 오류 발생!');
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
    // setEmailMessage('중복 확인 중...'); 
    try {
      const response = await api('GET', `/auth/check-email?email=${email}`);
      
      if (response.ok && response.status === 200) {
        if (response.data.data) { // 백엔드 응답의 data 필드가 true면 사용 가능
          setEmailAvailability('available');
          alert('사용 가능한 이메일입니다!');
        } else {
          setEmailAvailability('taken');
          alert('사용 중인 이메일입니다...');
        }
      } else if (response.status >= 400) {
        setEmailAvailability('error');
        alert(`이메일 확인 중 오류 발생: ${response.data.message || `HTTP 오류 ${response.status}`}`);
      } else {
        setEmailAvailability('error');
        alert('이메일 확인 중 알 수 없는 오류 발생!');
      }
    } catch (e) {
      setEmailAvailability('error');
      alert('이메일 확인 중 네트워크 오류 발생!');
      console.error("Email Check Network Error:", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
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

    // 클라이언트 측 유효성 검사 (중복 확인 로직 제거)
    if (pass !== cPass) {
      alert('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    // 비밀번호 유효성 검사
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[|'";:,.<>?]).*$/;    if (!passwordRegex.test(pass)) {
      alert('비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다.');
      return;
    }
  

    setBusy(true);
    // setErr(''); // setErr 제거

    try {
      const phoneNumber = `${phonePart1}-${phonePart2}-${phonePart3}`; // 전화번호 조합

      const userData = {
        studentNumber: parseInt(studentNo), // int형으로 변환
        password: pass,
        name: name,
        email: email,
        phoneNumber: phoneNumber, // 조합된 전화번호 필드 추가
        // 프로필 사진 (profilePic)은 현재 JSON 명세에 없으므로 제외
      };

      const requestBody = { userDto: userData }; // userDto로 묶어서 전송

      const data = await api('POST', '/auth/register', requestBody);

      if (data.ok && data.status === 200) {
        alert('회원가입 성공! 승인을 기다려 주세요.');
        nav('/login', { replace: true }); // 로그인 페이지로 리다이렉션
      } else {
        const errorMessages = data.data.errors ? data.data.errors.map(err => err.message).join('\n') : data.data.message || '회원가입 중 알 수 없는 오류가 발생했습니다.';
        alert(`회원가입 실패:\n${errorMessages}`);
      }
    } catch (e) {
      alert(e?.message || '회원가입 중 오류가 발생했습니다.'); // 오류 메시지도 alert로
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="form-container">
      <form onSubmit={handleSubmit} noValidate> 
        <h3>회원가입</h3>

        {/* {err && <p className="error-message">{err}</p>} 제거 */}

        <p>이름 <span>*</span></p>
        <input type="text" name="name" placeholder="이름을 입력하세요" required maxLength={50} className="box" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        
        <p>학번<span>*</span></p>
        <div className="input-with-button-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="text" name="student-no" placeholder="학번을 입력하세요" required maxLength={50} className="box" style={{ flex: '1' }} value={studentNo} onChange={(e) => { setStudentNo(e.target.value); setStudentNoAvailability('idle'); /* setStudentNoMessage(''); */ }} autoComplete="off" />
          <button type="button" className="btn" onClick={checkStudentNumberDuplication} disabled={studentNoAvailability === 'checking'} style={{ width: 'auto', padding: '10px 20px' }}>
            {studentNoAvailability === 'checking' ? '확인 중...' : '중복 확인'}
          </button>
        </div>
        {/* 학번 중복 확인 메시지 제거 */}

        <p>이메일 <span>*</span></p>
        <div className="input-with-button-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="email" name="email" placeholder="이메일을 입력하세요" required maxLength={50} className="box" style={{ flex: '1' }} value={email} onChange={(e) => { setEmail(e.target.value); setEmailAvailability('idle'); /* setEmailMessage(''); */ }} autoComplete="off" />
          <button type="button" className="btn" onClick={checkEmailDuplication} disabled={emailAvailability === 'checking'} style={{ width: 'auto', padding: '10px 20px' }}>
            {emailAvailability === 'checking' ? '확인 중...' : '중복 확인'}
          </button>
        </div>
        {/* 이메일 중복 확인 메시지 제거 */}

        <p>비밀번호 <span>*</span></p>
        <input type="password" name="pass" placeholder="비밀번호를 입력하세요" required maxLength={20} className="box" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />
        <p>비밀번호 확인 <span>*</span></p>
        <input type="password" name="c_pass" placeholder="비밀번호를 다시 입력하세요" required maxLength={20} className="box" value={cPass} onChange={(e) => setCPass(e.target.value)} autoComplete="new-password" />
        
        <p>전화번호 <span>*</span></p> 
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="text" name="phonePart1" placeholder="010" required maxLength={3} className="box" style={{ flex: '1' }} value={phonePart1} onChange={(e) => setPhonePart1(e.target.value)} autoComplete="off" />
          <span>-</span>
          <input type="text" name="phonePart2" placeholder="1234" required maxLength={4} className="box" style={{ flex: '1' }} value={phonePart2} onChange={(e) => setPhonePart2(e.target.value)} autoComplete="off" />
          <span>-</span>
          <input type="text" name="phonePart3" placeholder="5678" required maxLength={4} className="box" style={{ flex: '1' }} value={phonePart3} onChange={(e) => setPhonePart3(e.target.value)} autoComplete="off" />
        </div>

        <input type="submit" value={busy ? '회원가입 중...' : '회원가입'} name="submit" className="btn" disabled={busy} /> {/* disabled 속성 수정 */}
      </form>
    </section>
  );
}