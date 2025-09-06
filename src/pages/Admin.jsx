
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../components/client'; // api 함수 임포트

const CATEGORIES = [
  'WEB','PWNABLE','REVERSING','FORENSICS','CRYPTOGRAPHY',
  'MOBILE','NETWORK','HARDWARE','SYSTEM','MISC','DEV','ALGORITHM'
];


export default function Admin() {
  const { token, user } = useAuth();
  const nav = useNavigate();
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 스터디 그룹 생성 폼 상태
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState(''); // ← content로 전송
  const [newGroupCategory, setNewGroupCategory] = useState('WEB');
  const [newGroupMentor, setNewGroupMentor] = useState(''); // mentorStudentNumber
  const [creatingGroup, setCreatingGroup] = useState(false);

  // 스터디 그룹 수정 폼 상태
  const [editGroupId, setEditGroupId] = useState('');
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState(''); // ← content로 전송
  const [editGroupCategory, setEditGroupCategory] = useState('WEB');
  const [editGroupMentor, setEditGroupMentor] = useState('');
  const [updatingGroup, setUpdatingGroup] = useState(false);

  // 회원가입 대기 명단 불러오기 함수
  const fetchPendingMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api('GET', '/admin/member-approval', null, token);
      if (response.ok && response.status === 200) {
        setPendingMembers(response.data.data); // API 응답 형식에 따라 조정 필요
      } else {
        setError(response.data.message || `Failed to fetch pending members: ${response.status}`);
      }
    } catch (e) {
      setError(`Error fetching pending members: ${e.message}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 회원 승인 함수
  const handleApproveMember = useCallback(async (memberStudentNumber) => {
    try {
      const response = await api('POST', `/admin/member-approval/${memberStudentNumber}`, null, token);
      if (response.ok && response.status === 200) {
        alert('회원 승인 성공!');
        fetchPendingMembers(); // 목록 새로고침
      } else {
        alert(response.data.message || `회원 승인 실패: ${response.status}`);
      }
    } catch (e) {
      alert(`회원 승인 중 오류 발생: ${e.message}`);
      console.error(e);
    }
  }, [token, fetchPendingMembers]);

  // 스터디 그룹 생성 함수 (명세: name, content, category, mentorStudentNumber)
  const handleCreateGroup = useCallback(async (e) => {
    e.preventDefault();
    if (creatingGroup) return;
    if (!newGroupName) {
      alert('스터디 그룹 이름을 입력해주세요.');
      return;
    }
    if (!newGroupDescription) {
      alert('그룹 설명(내용)을 입력해주세요.');
      return;
    }
    if (!newGroupCategory) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    const mentorNum = Number(newGroupMentor);
    if (!Number.isFinite(mentorNum)) {
      alert('멘토 학번은 숫자여야 합니다.');
      return;
    }

    setCreatingGroup(true);
    try {
      const payload = {
        name: newGroupName,
        content: newGroupDescription,        // ← description을 content로 보냄
        category: newGroupCategory,
        mentorStudentNumber: mentorNum,
      };
      const response = await api('POST', '/admin/group', payload, token);
      if (response.ok && response.status === 200) {
        alert('스터디 그룹 생성 성공!');
        setNewGroupName('');
        setNewGroupDescription('');
        setNewGroupCategory('WEB');
        setNewGroupMentor('');
        // 필요 시 목록 리로드 추가
      } else {
        alert(response.data.message || `스터디 그룹 생성 실패: ${response.status}`);
      }
    } catch (e) {
      alert(`스터디 그룹 생성 중 오류 발생: ${e.message}`);
      console.error(e);
    } finally {
      setCreatingGroup(false);
    }
  }, [token, newGroupName, newGroupDescription, newGroupCategory, newGroupMentor, creatingGroup]);

  // 스터디 그룹 수정 함수 (명세 동일 가정)
  const handleUpdateGroup = useCallback(async (e) => {
    e.preventDefault();
    if (updatingGroup) return;
    if (!editGroupId || !editGroupName) {
      alert('그룹 ID와 그룹 이름을 입력해주세요.');
      return;
    }
    if (!editGroupDescription) {
      alert('그룹 설명(내용)을 입력해주세요.');
      return;
    }
    const mentorNum = Number(editGroupMentor);
    if (!Number.isFinite(mentorNum)) {
      alert('멘토 학번은 숫자여야 합니다.');
      return;
    }

    setUpdatingGroup(true);
    try {
      const payload = {
        id: editGroupId,
        name: editGroupName,
        content: editGroupDescription,       // ← description을 content로 보냄
        category: editGroupCategory,
        mentorStudentNumber: mentorNum,
      };
      const response = await api('PUT', '/admin/group/update', payload, token);
      if (response.ok && response.status === 200) {
        alert('스터디 그룹 수정 성공!');
        setEditGroupId('');
        setEditGroupName('');
        setEditGroupDescription('');
        setEditGroupCategory('WEB');
        setEditGroupMentor('');
        // 필요 시 목록 리로드 추가
      } else {
        alert(response.data.message || `스터디 그룹 수정 실패: ${response.status}`);
      }
    } catch (e) {
      alert(`스터디 그룹 수정 중 오류 발생: ${e.message}`);
      console.error(e);
    } finally {
      setUpdatingGroup(false);
    }
  }, [token, editGroupId, editGroupName, editGroupDescription, editGroupCategory, editGroupMentor, updatingGroup]);


  useEffect(() => {
    if (!token || !user || user.role !== 'ROLE_ADMIN') {
      nav('/unauthorized', { replace: true }); // Unauthorized 페이지로 리다이렉션

      return;
    }
    fetchPendingMembers();
  }, [token, user, nav, fetchPendingMembers]);

  if (!token || !user || user.role !== 'ROLE_ADMIN') {
    return null;
  }

  return (
    <section className="admin-dashboard" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 0' }}>
      <h1 className="heading" style={{ textAlign: 'center', marginBottom: '40px', color: '#333', fontSize: '3em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>관리자 대시보드</h1>

      <div className="box-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
        <div className="box" style={{ flex: '1 1 400px', backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.15)', border: '1px solid #eee' }}>
          <h3 style={{ color: '#007bff', marginBottom: '20px', fontSize: '2.2em', fontWeight: '600' }}>회원가입 승인 대기 명단</h3>
          {loading && <p>회원가입 대기 명단을 불러오는 중...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && (pendingMembers.length === 0 ? (
            <p>승인 대기 중인 회원이 없습니다.</p>
          ) : (
            <table className="dashboard-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'left', backgroundColor: '#007bff', color: '#ffffff', fontWeight: '600', fontSize: '1.1em' }}>학번</th>
                  <th style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'left', backgroundColor: '#007bff', color: '#ffffff', fontWeight: '600', fontSize: '1.1em' }}>이름</th>
                  <th style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'left', backgroundColor: '#007bff', color: '#ffffff', fontWeight: '600', fontSize: '1.1em' }}>이메일</th>
                  <th style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'left', backgroundColor: '#007bff', color: '#ffffff', fontWeight: '600', fontSize: '1.1em' }}>전화번호</th>
                  <th style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'left', backgroundColor: '#007bff', color: '#ffffff', fontWeight: '600', fontSize: '1.1em' }}>가입일</th>
                  <th style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'left', backgroundColor: '#007bff', color: '#ffffff', fontWeight: '600', fontSize: '1.1em' }}>액션</th>
                </tr>
              </thead>
              <tbody>
                {pendingMembers.map(member => (
                  <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{member.studentNumber}</td>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{member.name}</td>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{member.email}</td>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{member.phoneNumber}</td>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{new Date(member.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd' }}>
                      <button className="btn" style={{ background: 'linear-gradient(to right, #28a745, #218838)', color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 18px', fontSize: '1.05em', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} onClick={() => handleApproveMember(member.studentNumber)}>승인</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>

        <div className="box" style={{ flex: '1 1 400px', backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.15)', border: '1px solid #eee' }}>
          <h3 style={{ color: '#007bff', marginBottom: '20px', fontSize: '2.2em', fontWeight: '600' }}>스터디 그룹 생성</h3>
          <form onSubmit={handleCreateGroup} className="form-group-create">
            <p style={{ marginBottom: '10px', color: '#555', fontSize: '1.1em' }}>그룹 이름 <span>*</span></p>
            <input type="text" placeholder="그룹 이름을 입력하세요" className="box" required maxLength={100} value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} autoComplete="off" style={{ width: '100%', marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.1em', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }} />
            <p style={{ marginBottom: '10px', color: '#555', fontSize: '1.1em' }}>그룹 설명</p>
            <textarea placeholder="그룹 설명을 입력하세요 (선택 사항)" className="box" value={newGroupDescription} onChange={(e) => setNewGroupDescription(e.target.value)} maxLength={1000} autoComplete="off" style={{ width: '100%', minHeight: '80px', marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.1em', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}></textarea>

            {/* 추가: 카테고리 + 멘토 학번 */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <select value={newGroupCategory} onChange={(e)=>setNewGroupCategory(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.05em' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" inputMode="numeric" placeholder="멘토 학번" className="box" value={newGroupMentor} onChange={(e)=>setNewGroupMentor(e.target.value)} style={{ width: 220, padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.05em' }} />
            </div>

            <button type="submit" className="btn" disabled={creatingGroup} style={{ background: 'linear-gradient(to right, #007bff, #0056b3)', color: '#fff', border: 'none', borderRadius: '5px', padding: '12px 25px', fontSize: '1.2em', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
              {creatingGroup ? '생성 중...' : '그룹 생성'}
            </button>
          </form>
        </div>

        <div className="box" style={{ flex: '1 1 400px', backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.15)', border: '1px solid #eee' }}>
          <h3 style={{ color: '#007bff', marginBottom: '20px', fontSize: '2.2em', fontWeight: '600' }}>스터디 그룹 수정</h3>
          <form onSubmit={handleUpdateGroup} className="form-group-update">
            <p style={{ marginBottom: '10px', color: '#555', fontSize: '1.1em' }}>그룹 ID <span>*</span></p>
            <input type="text" placeholder="수정할 그룹 ID를 입력하세요" className="box" required value={editGroupId} onChange={(e) => setEditGroupId(e.target.value)} autoComplete="off" style={{ width: '100%', marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.1em', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }} />
            <p style={{ marginBottom: '10px', color: '#555', fontSize: '1.1em' }}>그룹 이름 <span>*</span></p>
            <input type="text" placeholder="새 그룹 이름을 입력하세요" className="box" required maxLength={100} value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} autoComplete="off" style={{ width: '100%', marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.1em', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }} />
            <p style={{ marginBottom: '10px', color: '#555', fontSize: '1.1em' }}>그룹 설명</p>
            <textarea placeholder="새 그룹 설명을 입력하세요 (선택 사항)" className="box" value={editGroupDescription} onChange={(e) => setEditGroupDescription(e.target.value)} maxLength={1000} autoComplete="off" style={{ width: '100%', minHeight: '80px', marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.1em', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}></textarea>

            {/* 추가: 카테고리 + 멘토 학번 */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <select value={editGroupCategory} onChange={(e)=>setEditGroupCategory(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.05em' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" inputMode="numeric" placeholder="멘토 학번" className="box" value={editGroupMentor} onChange={(e)=>setEditGroupMentor(e.target.value)} style={{ width: 220, padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.05em' }} />
            </div>

            <button type="submit" className="btn" disabled={updatingGroup} style={{ background: 'linear-gradient(to right, #007bff, #0056b3)', color: '#fff', border: 'none', borderRadius: '5px', padding: '12px 25px', fontSize: '1.2em', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
              {updatingGroup ? '수정 중...' : '그룹 수정'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
