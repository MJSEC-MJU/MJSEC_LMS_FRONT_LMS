﻿import { useState } from 'react';
import { api } from '../components/client'; // api 함수 임포트

export default function Register() {
  const [name, setName] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [cPass, setCPass] = useState('');
  const [phonePart1, setPhonePart1] = useState(''); // 전화번호 첫째 부분
  const [phonePart2, setPhonePart2] = useState(''); // 전화번호 둘째 부분
  const [phonePart3, setPhonePart3] = useState(''); // 전화번호 셋째 부분
  const [profilePic, setProfilePic] = useState(null);
  const [busy, setBusy] = useState(false); // 전체 폼 제출 상태

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit 호출됨"); // 이 줄을 추가합니다.
    if (busy) return;
    if (!name || !studentNo || !email || !pass || !cPass || !phonePart1 || !phonePart2 || !phonePart3) { 
      alert('모든 필수 필드를 입력하세요.');
      return;
  }

    // 클라이언트 측 유효성 검사 (중복 확인 로직 제거)
    if (pass !== cPass) {
      alert('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
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
      console.log("회원가입 성공:", data);
      // 성공 시 로그인 페이지로 리다이렉트 또는 성공 메시지 표시
      // nav('/login', { replace: true }); // navigate 필요 시 import
      alert('회원가입 성공!'); // 성공 메시지도 alert로
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
        <input type="text" name="name" placeholder="이름을 입력하세요" required maxLength={50} className="box" value={name} onChange={(e) => setName(e.target.value)} />
        
        <p>학번<span>*</span></p>
        <div className="input-with-button-group">
          <input type="text" name="student-no" placeholder="학번을 입력하세요" required maxLength={50} className="box" value={studentNo} onChange={(e) => { setStudentNo(e.target.value); }} />
          {/* 중복 확인 버튼 제거 */}
        </div>
        {/* 학번 중복 확인 메시지 제거 */}

        <p>이메일 <span>*</span></p>
        <div className="input-with-button-group">
          <input type="email" name="email" placeholder="이메일을 입력하세요" required maxLength={50} className="box" value={email} onChange={(e) => { setEmail(e.target.value); }} />
          {/* 중복 확인 버튼 제거 */}
        </div>
        {/* 이메일 중복 확인 메시지 제거 */}

        <p>비밀번호 <span>*</span></p>
        <input type="password" name="pass" placeholder="비밀번호를 입력하세요" required maxLength={20} className="box" value={pass} onChange={(e) => setPass(e.target.value)} />
        <p>비밀번호 확인 <span>*</span></p>
        <input type="password" name="c_pass" placeholder="비밀번호를 다시 입력하세요" required maxLength={20} className="box" value={cPass} onChange={(e) => setCPass(e.target.value)} />
        
        <p>전화번호 <span>*</span></p> 
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="text" name="phonePart1" placeholder="010" required maxLength={3} className="box" style={{ flex: '1' }} value={phonePart1} onChange={(e) => setPhonePart1(e.target.value)} />
          <span>-</span>
          <input type="text" name="phonePart2" placeholder="1234" required maxLength={4} className="box" style={{ flex: '1' }} value={phonePart2} onChange={(e) => setPhonePart2(e.target.value)} />
          <span>-</span>
          <input type="text" name="phonePart3" placeholder="5678" required maxLength={4} className="box" style={{ flex: '1' }} value={phonePart3} onChange={(e) => setPhonePart3(e.target.value)} />
        </div>

        <p>프로필 사진 선택 (선택) </p>
        <input type="file" accept="image/*" className="box" onChange={(e) => setProfilePic(e.target.files[0])} />
        <input type="submit" value={busy ? '회원가입 중...' : '회원가입'} name="submit" className="btn" disabled={busy} /> {/* disabled 속성 수정 */}
      </form>
    </section>
  );
}