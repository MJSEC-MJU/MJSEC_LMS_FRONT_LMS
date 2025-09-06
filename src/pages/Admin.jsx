import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../components/client'; // api 함수 임포트

export default function Admin() {
  const { token, user } = useAuth();
  const nav = useNavigate();
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 스터디 그룹 생성 폼 상태
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // 스터디 그룹 수정 폼 상태
  const [editGroupId, setEditGroupId] = useState('');
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
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
  }, [token]); // token을 의존성으로 추가

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
  }, [token, fetchPendingMembers]); // token, fetchPendingMembers를 의존성으로 추가

  // 스터디 그룹 생성 함수
  const handleCreateGroup = useCallback(async (e) => {
    e.preventDefault();
    if (creatingGroup) return;
    if (!newGroupName) {
      alert('스터디 그룹 이름을 입력해주세요.');
      return;
    }

    setCreatingGroup(true);
    try {
      const response = await api('POST', '/admin/group', { name: newGroupName, description: newGroupDescription }, token);
      if (response.ok && response.status === 200) {
        alert('스터디 그룹 생성 성공!');
        setNewGroupName('');
        setNewGroupDescription('');
        // 스터디 그룹 목록을 다시 불러오는 로직이 있다면 여기에 추가
      } else {
        alert(response.data.message || `스터디 그룹 생성 실패: ${response.status}`);
      }
    } catch (e) {
      alert(`스터디 그룹 생성 중 오류 발생: ${e.message}`);
      console.error(e);
    } finally {
      setCreatingGroup(false);
    }
  }, [token, newGroupName, newGroupDescription, creatingGroup]); // 필요한 상태와 함수를 의존성으로 추가

  // 스터디 그룹 수정 함수
  const handleUpdateGroup = useCallback(async (e) => {
    e.preventDefault();
    if (updatingGroup) return;
    if (!editGroupId || !editGroupName) {
      alert('그룹 ID와 그룹 이름을 입력해주세요.');
      return;
    }

    setUpdatingGroup(true);
    try {
      const response = await api('PUT', '/admin/group/update', { id: editGroupId, name: editGroupName, description: editGroupDescription }, token);
      if (response.ok && response.status === 200) {
        alert('스터디 그룹 수정 성공!');
        setEditGroupId('');
        setEditGroupName('');
        setEditGroupDescription('');
        // 스터디 그룹 목록을 다시 불러오는 로직이 있다면 여기에 추가
      } else {
        alert(response.data.message || `스터디 그룹 수정 실패: ${response.status}`);
      }
    } catch (e) {
      alert(`스터디 그룹 수정 중 오류 발생: ${e.message}`);
      console.error(e);
    } finally {
      setUpdatingGroup(false);
    }
  }, [token, editGroupId, editGroupName, editGroupDescription, updatingGroup]); // 필요한 상태와 함수를 의존성으로 추가

  useEffect(() => {
    if (!token || !user || user.role !== 'ROLE_ADMIN') {
      nav('/unauthorized', { replace: true }); // Unauthorized 페이지로 리다이렉션
      return;
    }

    fetchPendingMembers(); // useEffect 내부에서 호출
  }, [token, user, nav, fetchPendingMembers]); // fetchPendingMembers를 의존성으로 추가

  if (!token || !user || user.role !== 'ROLE_ADMIN') {
    console.log("Admin render guard - token:", token); // Added log
    console.log("Admin render guard - user:", user);   // Added log
    return null; // 리다이렉션 전에 컴포넌트 렌더링을 막음
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
                  <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}> {/* member.id는 실제 API 응답에 따라 달라질 수 있음 */}
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{member.studentNumber}</td>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{member.name}</td>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{member.email}</td>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{member.phoneNumber}</td>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{new Date(member.createdAt).toLocaleDateString()}</td> {/* API 응답에 createdAt 필드가 있다고 가정 */}
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
            <textarea placeholder="그룹 설명을 입력하세요 (선택 사항)" className="box" value={newGroupDescription} onChange={(e) => setNewGroupDescription(e.target.value)} maxLength={500} autoComplete="off" style={{ width: '100%', minHeight: '80px', marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.1em', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}></textarea>
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
            <input type="text" placeholder="새 그룹 이름을 입력하세요" className="box" required maxLength={100} value={editGroupName} onChange={(e) => setNewGroupName(e.target.value)} autoComplete="off" style={{ width: '100%', marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.1em', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }} />
            <p style={{ marginBottom: '10px', color: '#555', fontSize: '1.1em' }}>그룹 설명</p>
            <textarea placeholder="새 그룹 설명을 입력하세요 (선택 사항)" className="box" value={editGroupDescription} onChange={(e) => setEditGroupDescription(e.target.value)} maxLength={500} autoComplete="off" style={{ width: '100%', minHeight: '80px', marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.1em', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}></textarea>
            <button type="submit" className="btn" disabled={updatingGroup} style={{ background: 'linear-gradient(to right, #007bff, #0056b3)', color: '#fff', border: 'none', borderRadius: '5px', padding: '12px 25px', fontSize: '1.2em', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
              {updatingGroup ? '수정 중...' : '그룹 수정'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}