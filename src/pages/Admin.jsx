import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../components/client'; // api 함수

const fetchAdminUsers = (token) => adminUsers(token).list();
const deleteAdminUser = (userId, token) => adminUsers(token).remove(userId);
const ensureToken = (token) => {
  if (!token) throw new Error('토큰이 필요합니다');
};

const adminUsers = (token) => {
  ensureToken(token);
  return {
    list: () => api('GET', '/admin/users', null, token),
    remove: (userId) => {
      if (userId === undefined || userId === null || userId === '') {
        throw new Error('userId가 필요합니다');
      }
      return api('DELETE', `/admin/users/${userId}`, null, token);
    },
  };
};
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

  // 전체 사용자 목록
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  // 탭 상태: 'users' | 'approvals' | 'groups'
  const [activeTab, setActiveTab] = useState('users');

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
  const [editGroupImage, setEditGroupImage] = useState(null); // 이미지 파일 추가
  const [updatingGroup, setUpdatingGroup] = useState(false);
  
  //스터디 그룹 정보 조회
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState(null);
  
  const fetchGroups = useCallback(async () => {
  setGroupsLoading(true);
  setGroupsError(null);
  try {
    const res = await api('GET', '/admin/group/all', null, token);
    if (res?.code === 'SUCCESS') {
      setGroups(res.data || []);
    } else {
      setGroupsError(res?.message || '스터디 그룹 목록을 불러오지 못했습니다.');
    }
  } catch (e) {
    setGroupsError(`스터디 그룹 목록 조회 오류: ${e.message}`);
  } finally {
    setGroupsLoading(false);
  }
}, [token]);

useEffect(() => {
  if (activeTab === 'groups') {
    fetchGroups();
  }
}, [activeTab, fetchGroups]);

  
  
  // 회원가입 대기 명단 불러오기
  const fetchPendingMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api('GET', '/admin/member-approval', null, token);
      if (res?.code === 'SUCCESS') {
        setPendingMembers(res.data || []);
      } else {
        setError(res?.message || 'Failed to fetch pending members');
      }
    } catch (e) {
      setError(`Error fetching pending members: ${e.message}`);
      // 에러 발생
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 회원 승인
  const handleApproveMember = useCallback(async (memberStudentNumber) => {
    try {
      const res = await api('POST', `/admin/member-approval/${memberStudentNumber}`, null, token);
      if (res?.code === 'SUCCESS') {
        alert('회원 승인 성공!');
        fetchPendingMembers();
      } else {
        alert(res?.message || '회원 승인 실패');
      }
    } catch (e) {
      alert(`회원 승인 중 오류 발생: ${e.message}`);
      // 에러 발생
    }
  }, [token, fetchPendingMembers]);

  // 회원가입 승인 요청 반려
  const handleRejectMember = useCallback(async (memberStudentNumber) => {
    try {
      const res = await api('POST', `/admin/member-refusal/${memberStudentNumber}`, null, token);
      if (res?.code === 'SUCCESS') {
        alert('회원 승인 반려되었습니다!');
        fetchPendingMembers();
      } else {
        alert(res?.message || '회원 거부 실패');
      }
    } catch (e) {
      alert(`회원 거부 중 오류 발생: ${e.message}`);
      // 에러 발생
    }
  }, [token, fetchPendingMembers]);

  // 스터디 그룹 생성 (명세: name, content, category, mentorStudentNumber)
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
      const res = await api('POST', '/admin/group', payload, token);
      if (res?.code === 'SUCCESS') {
        alert('스터디 그룹 생성 성공!');
        setNewGroupName('');
        setNewGroupDescription('');
        setNewGroupCategory('WEB');
        setNewGroupMentor('');
      } else {
        alert(res?.message || '스터디 그룹 생성 실패');
      }
    } catch (e) {
      alert(`스터디 그룹 생성 중 오류 발생: ${e.message}`);
      // 에러 발생
    } finally {
      setCreatingGroup(false);
    }
  }, [token, newGroupName, newGroupDescription, newGroupCategory, newGroupMentor, creatingGroup]);

  // 스터디 그룹 수정 (명세 동일 가정)
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

      const formData = new FormData();
      // 이미지가 있으면 추가
      if (editGroupImage) {
        formData.append('studyImage', editGroupImage);
      }

      const groupDto = {
        name: editGroupName,
        content: editGroupDescription,       // ← description을 content로 보냄
        category: editGroupCategory,
        mentorStudentNumber: mentorNum,
      };
      formData.append(
        'studyGroupUpdateDto',
        new Blob([JSON.stringify(groupDto)], { type: 'application/json' })
      );

      const res = await api('PUT', `/admin/group/${editGroupName}`, formData,  token, { 'Content-Type': 'multipart/form-data' });
      if (res?.code === 'SUCCESS') {
        alert('스터디 그룹 수정 성공!');
        setEditGroupId('');
        setEditGroupName('');
        setEditGroupDescription('');
        setEditGroupCategory('WEB');
        setEditGroupMentor('');
      } else {
        alert(res?.message || '스터디 그룹 수정 실패');
      }
    } catch (e) {
      alert(`스터디 그룹 수정 중 오류 발생: ${e.message}`);
      // 에러 발생
    } finally {
      setUpdatingGroup(false);
    }
  }, [token, editGroupId, editGroupName, editGroupDescription, editGroupCategory, editGroupMentor, updatingGroup]);

  // 전체 사용자 목록 불러오기
  const fetchAllUsers = useCallback(async () => {
    if (!token) return;
    try {
      setUsersLoading(true);
      setUsersError(null);
      const res = await fetchAdminUsers(token);
      if (res?.code === 'SUCCESS') {
        setUsers(res.data || []);
      } else {
        setUsersError(res?.message || '사용자 목록을 불러오지 못했습니다.');
      }
    } catch (e) {
      setUsersError(`사용자 목록 조회 오류: ${e.message}`);
      // 에러 발생
    } finally {
      setUsersLoading(false);
    }
  }, [token]);

  // 초기 로드 시 사용자 목록도 함께 불러오기 (권한 체크는 주석 유지)
  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);
  
  // 사용자 삭제
  const handleDeleteUser = useCallback(async (userId) => {
    if (!window.confirm('해당 사용자를 삭제하시겠습니까?')) return;
    try {
      setDeletingUserId(userId);
      const res = await deleteAdminUser(userId, token);
      if (res?.code === 'SUCCESS') {
        setUsers(prev => prev.filter(u => u.userId !== userId));
      } else {
        alert(res?.message || '삭제에 실패했습니다.');
      }
    } catch (e) {
      alert(`사용자 삭제 오류: ${e.message}`);
      // 에러 발생
    } finally {
      setDeletingUserId(null);
    }
  }, [token]);

  useEffect(() => {
    if (!token || !user || user.role !== 'ROLE_ADMIN') {
      nav('/unauthorized', { replace: true });
      return;
    }
    fetchPendingMembers();
  }, [token, user, nav, fetchPendingMembers]);

  if (!token || !user || user.role !== 'ROLE_ADMIN') {
    return null;
  }

  return (
    <section className="admin-dashboard" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 0' }}>
      <h1
        className="heading"
        style={{
          textAlign: 'center',
          marginBottom: '40px',
          color: '#333',
          fontSize: '3em',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        관리자 대시보드
      </h1>
      {/* 탭 네비게이션 */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
        {[
          { key: 'users', label: '전체 사용자' },
          { key: 'approvals', label: '회원가입 승인 대기' },
          { key: 'groups', label: '스터디 그룹' },
        ].map(t => (
          <button
            key={t.key}
            className="btn"
            onClick={() => setActiveTab(t.key)}
            style={{
              background: activeTab === t.key ? 'linear-gradient(to right, #6f42c1, #59359a)' : 'linear-gradient(to right, #adb5bd, #868e96)',
              color: '#fff', border: 'none', borderRadius: '20px', padding: '8px 18px', cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="box-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
        {activeTab === 'users' && (
        <div className="box" style={{ flex: '1 1 600px', backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.15)', border: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ color: '#343a40', fontSize: '2.0em', fontWeight: '600', margin: 0 }}>전체 사용자 목록</h3>
            <button
              className="btn"
              onClick={fetchAllUsers}
              style={{ background: 'linear-gradient(to right, #17a2b8, #117a8b)', color: '#fff', border: 'none', borderRadius: '5px', padding: '8px 16px', fontSize: '1em', cursor: 'pointer' }}
            >
              새로고침
            </button>
          </div>
          {usersLoading && <p>사용자 목록을 불러오는 중...</p>}
          {usersError && <p className="error-message">{usersError}</p>}
          {!usersLoading && !usersError && (
            users.length === 0 ? (
              <p>사용자가 없습니다.</p>
            ) : (
              <table className="dashboard-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', backgroundColor: '#343a40', color: '#ffffff' }}>ID</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', backgroundColor: '#343a40', color: '#ffffff' }}>학번</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', backgroundColor: '#343a40', color: '#ffffff' }}>이름</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', backgroundColor: '#343a40', color: '#ffffff' }}>이메일</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', backgroundColor: '#343a40', color: '#ffffff' }}>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={`${u.userId}-${u.studentNumber}`} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px 12px', border: '1px solid #ddd' }}>{u.userId}</td>
                      <td style={{ padding: '10px 12px', border: '1px solid #ddd' }}>{u.studentNumber}</td>
                      <td style={{ padding: '10px 12px', border: '1px solid #ddd' }}>{u.name}</td>
                      <td style={{ padding: '10px 12px', border: '1px solid #ddd' }}>{u.email}</td>
                      <td style={{ padding: '10px 12px', border: '1px solid #ddd' }}>
                        <button
                          className="btn"
                          onClick={() => handleDeleteUser(u.userId)}
                          disabled={deletingUserId === u.userId}
                          style={{ background: 'linear-gradient(to right, #dc3545, #c82333)', color: '#fff', border: 'none', borderRadius: '5px', padding: '6px 12px', fontSize: '0.95em', cursor: 'pointer' }}
                        >
                          {deletingUserId === u.userId ? '삭제 중...' : '삭제'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
        )}
        {activeTab === 'approvals' && (
        <div className="box" style={{ flex: '1 1 800px', backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.15)', border: '1px solid #eee' }}>
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
                  <tr key={member.studentNumber} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{member.studentNumber}</td>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{member.name}</td>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{member.email}</td>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{member.phoneNumber}</td>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd', fontSize: '1em' }}>{new Date(member.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 15px', border: '1px solid #ddd' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn"
                          style={{ background: 'linear-gradient(to right, #28a745, #218838)', color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 18px', fontSize: '1.05em', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                          onClick={() => handleApproveMember(member.studentNumber)}
                        >
                          승인
                        </button>
                        <button
                          className="btn"
                          style={{ background: 'linear-gradient(to right, #dc3545, #c82333)', color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 18px', fontSize: '1.05em', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                          onClick={() => handleRejectMember(member.studentNumber)}
                        >
                          거절
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
        )}

        {activeTab === 'groups' && (
          <>
        <div className="box" style={{ flex: '1 1 400px', backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.15)', border: '1px solid #eee' }}>
          <h3 style={{ color: '#007bff', marginBottom: '20px', fontSize: '2.2em', fontWeight: '600' }}>스터디 그룹 생성</h3>
          <form onSubmit={handleCreateGroup} className="form-group-create">
            <p style={{ marginBottom: '10px', color: '#555', fontSize: '1.1em' }}>그룹 이름 <span>*</span></p>
            <input
              type="text"
              placeholder="그룹 이름을 입력하세요"
              className="box"
              required
              maxLength={100}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              autoComplete="off"
              style={{ width: '100%', marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.1em', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}
            />

            <p style={{ marginBottom: '10px', color: '#555', fontSize: '1.1em' }}>그룹 설명</p>
            <textarea
              placeholder="그룹 설명을 입력하세요 (선택 사항)"
              className="box"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              maxLength={1000}
              autoComplete="off"
              style={{ width: '100%', minHeight: '80px', marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.1em', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}
            ></textarea>

            {/* 카테고리 + 멘토 학번 */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <select
                value={newGroupCategory}
                onChange={(e)=>setNewGroupCategory(e.target.value)}
                style={{ flex: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.05em' }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number"
                inputMode="numeric"
                placeholder="멘토 학번"
                className="box"
                value={newGroupMentor}
                onChange={(e)=>setNewGroupMentor(e.target.value)}
                style={{ width: 220, padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.05em' }}
              />
            </div>

            <button
              type="submit"
              className="btn"
              disabled={creatingGroup}
              style={{ background: 'linear-gradient(to right, #007bff, #0056b3)', color: '#fff', border: 'none', borderRadius: '5px', padding: '12px 25px', fontSize: '1.2em', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
            >
              {creatingGroup ? '생성 중...' : '그룹 생성'}
            </button>
          </form>
        </div>

        {/* 스터디 그룹 수정 */}
        <div className="box" style={{ flex: '1 1 400px', backgroundColor: '#ffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.15)', border: '1px solid #eee' }}>
          <h3 style={{ color: '#007bff', marginBottom: '20px', fontSize: '2.2em', fontWeight: '600' }}>스터디 그룹 수정</h3>
          <form onSubmit={handleUpdateGroup} className="form-group-update">
            
            <p style={{ marginBottom: '10px', color: '#555', fontSize: '1.1em' }}>그룹 대표 이미지</p>
            <input
              type="file"
              accept="image/*"
              onChange={e => setEditGroupImage(e.target.files[0] || null)}
              style={{ marginBottom: '20px' }}
            />
            
            <p style={{ marginBottom: '10px', color: '#555', fontSize: '1.1em' }}>그룹 ID <span>*</span></p>
            <input
              type="text"
              placeholder="수정할 그룹 ID를 입력하세요"
              className="box"
              required
              value={editGroupId}
              onChange={(e) => setEditGroupId(e.target.value)}
              autoComplete="off"
              style={{ width: '100%', marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.1em', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}
            />

            <p style={{ marginBottom: '10px', color: '#555', fontSize: '1.1em' }}>그룹 이름 <span>*</span></p>
            <input
              type="text"
              placeholder="새 그룹 이름을 입력하세요"
              className="box"
              required
              maxLength={100}
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              autoComplete="off"
              style={{ width: '100%', marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.1em', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}
            />

            <p style={{ marginBottom: '10px', color: '#555', fontSize: '1.1em' }}>그룹 설명</p>
            <textarea
              placeholder="새 그룹 설명을 입력하세요 (선택 사항)"
              className="box"
              value={editGroupDescription}
              onChange={(e) => setEditGroupDescription(e.target.value)}
              maxLength={1000}
              autoComplete="off"
              style={{ width: '100%', minHeight: '80px', marginBottom: '20px', padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.1em', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}
            ></textarea>

            {/* 카테고리 + 멘토 학번 */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <select
                value={editGroupCategory}
                onChange={(e)=>setEditGroupCategory(e.target.value)}
                style={{ flex: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.05em' }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number"
                inputMode="numeric"
                placeholder="멘토 학번"
                className="box"
                value={editGroupMentor}
                onChange={(e)=>setEditGroupMentor(e.target.value)}
                style={{ width: 220, padding: '12px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1.05em' }}
              />
            </div>

            <button
              type="submit"
              className="btn"
              disabled={updatingGroup}
              style={{ background: 'linear-gradient(to right, #007bff, #0056b3)', color: '#fff', border: 'none', borderRadius: '5px', padding: '12px 25px', fontSize: '1.2em', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
            >
              {updatingGroup ? '수정 중...' : '그룹 수정'}
            </button>
          </form>
        </div>
                {/* 스터디 그룹 조회 테이블 추가 */}
        <div className="box" style={{ flex: '1 1 800px', backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.15)', border: '1px solid #eee' }}>
          <h3 style={{ color: '#007bff', marginBottom: '20px', fontSize: '2.2em', fontWeight: '600' }}>전체 스터디 그룹 목록</h3>
          {groupsLoading && <p>스터디 그룹 목록을 불러오는 중...</p>}
          {groupsError && <p className="error-message">{groupsError}</p>}
          {!groupsLoading && !groupsError && (
            groups.length === 0 ? (
              <p>스터디 그룹이 없습니다.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', border: '1px solid #ddd', backgroundColor: '#343a40', color: '#fff' }}>ID</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', backgroundColor: '#343a40', color: '#fff' }}>이름</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', backgroundColor: '#343a40', color: '#fff' }}>카테고리</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', backgroundColor: '#343a40', color: '#fff' }}>이미지</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(g => (
                    <tr key={g.studyGroupId}>
                      <td style={{ padding: '10px 12px', border: '1px solid #ddd' }}>{g.studyGroupId}</td>
                      <td style={{ padding: '10px 12px', border: '1px solid #ddd' }}>{g.name}</td>
                      <td style={{ padding: '10px 12px', border: '1px solid #ddd' }}>{g.category}</td>
                      <td style={{ padding: '10px 12px', border: '1px solid #ddd' }}>
                        {g.studyImage && <img src={g.studyImage} alt={g.name} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 5 }} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
          </>
        )}
      </div>
    </section>
    
  );
}
