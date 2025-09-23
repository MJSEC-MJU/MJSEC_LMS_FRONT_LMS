import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../components/client'; // api 함수
import '../../public/css/admin.css';

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
  const [newGroupGeneration, setNewGroupGeneration] = useState(''); // ← generation 추가
  const [newGroupMentor, setNewGroupMentor] = useState(''); // mentorStudentNumber
  const [creatingGroup, setCreatingGroup] = useState(false);

  // 스터디 그룹 수정 폼 상태
  const [currentGroupName, setCurrentGroupName] = useState('');
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState(''); // ← content로 전송
  const [editGroupCategory, setEditGroupCategory] = useState('WEB');
  const [editGroupGeneration, setEditGroupGeneration] = useState(''); // ← generation 추가
  const [editGroupMentor, setEditGroupMentor] = useState('');
  const [editGroupImage, setEditGroupImage] = useState(null); // 이미지 파일 추가
  const [updatingGroup, setUpdatingGroup] = useState(false);
  
  //스터디 그룹 정보 조회
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState(null);
  
  // 그룹 삭제 모달 상태
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    groupName: '',
    groupId: null
  });
  
  
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
    if (!newGroupGeneration) {
      alert('기수를 입력해주세요.');
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
        generation: newGroupGeneration,      // ← generation 추가
        mentorStudentNumber: mentorNum,
      };
      const res = await api('POST', '/admin/group', payload, token);
      if (res?.code === 'SUCCESS') {
        alert('스터디 그룹 생성 성공!');
        setNewGroupName('');
        setNewGroupDescription('');
        setNewGroupCategory('WEB');
        setNewGroupGeneration('');
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
  }, [token, newGroupName, newGroupDescription, newGroupCategory, newGroupGeneration, newGroupMentor, creatingGroup]);

  // 스터디 그룹 수정 (명세 동일 가정)
  const handleUpdateGroup = useCallback(async (e) => {
    e.preventDefault();
    if (updatingGroup) return;
    if (!currentGroupName || !editGroupName) {
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
        generation: editGroupGeneration,     // ← generation 추가
        mentorStudentNumber: mentorNum,
      };
      formData.append(
        'studyGroupUpdateDto',
        new Blob([JSON.stringify(groupDto)], { type: 'application/json' })
      );

      const res = await api('PUT', `/admin/group/${encodeURIComponent(currentGroupName)}`, formData,  token, { 'Content-Type': 'multipart/form-data' });
      if (res?.code === 'SUCCESS') {
        alert('스터디 그룹 수정 성공!');
        setCurrentGroupName('');
        setEditGroupName('');
        setEditGroupDescription('');
        setEditGroupCategory('WEB');
        setEditGroupGeneration('');
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
  }, [token, currentGroupName, editGroupName, editGroupDescription, editGroupCategory, editGroupGeneration, editGroupMentor, editGroupImage, updatingGroup]);

  // 스터디 그룹 이름 중복 확인 함수
  const checkGroupNameDuplicate = async (groupName, token) => {
    if (!groupName) throw new Error('그룹 이름이 필요합니다');
    // 예시: /admin/group/check-name/{groupName}
    return await api('GET', `/admin/group/name-check/${encodeURIComponent(groupName)}`, null, token);
  };

  // 예시: 그룹 이름 입력 시 중복 체크
  const handleCheckGroupName = async () => {
    try {
      const res = await checkGroupNameDuplicate(editGroupName, token);
      if (res?.data === true||res?.status===200) {
        alert('사용 가능한 그룹 이름입니다.');
      } else {
        alert('이미 존재하는 그룹 이름입니다.');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // 그룹 삭제 함수
  const handleDeleteGroup = useCallback(async () => {
    if (!deleteModal.groupName) return;
    
    try {
      const res = await api('DELETE', `/admin/group/${deleteModal.groupName}`, null, token);
      if (res?.code === 'SUCCESS') {
        alert('스터디 그룹이 성공적으로 삭제되었습니다!');
        setDeleteModal({ isOpen: false, groupName: '', groupId: null });
        fetchGroups(); // 그룹 목록 새로고침
      } else {
        alert(res?.message || '스터디 그룹 삭제 실패');
      }
    } catch (e) {
      alert(`스터디 그룹 삭제 중 오류 발생: ${e.message}`);
    }
  }, [token, deleteModal.groupName, fetchGroups]);

  // 그룹 상태 변경 함수
  const handleToggleGroupStatus = useCallback(async (groupId) => {
    try {
      const res = await api('PUT', `/admin/group/status/${groupId}`, null, token);
      if (res?.code === 'SUCCESS') {
        alert('스터디 그룹 상태가 성공적으로 변경되었습니다!');
        fetchGroups(); // 그룹 목록 새로고침
      } else {
        alert(res?.message || '스터디 그룹 상태 변경 실패');
      }
    } catch (e) {
      alert(`스터디 그룹 상태 변경 중 오류 발생: ${e.message}`);
    }
  }, [token, fetchGroups]);

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
    <section className="admin-dashboard">
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
      <div className="admin-tab-navigation">
        {[
          { key: 'users', label: '전체 사용자' },
          { key: 'approvals', label: '회원가입 승인 대기' },
          { key: 'groups', label: '스터디 그룹' },
        ].map(t => (
          <button
            key={t.key}
            className={`admin-tab-button ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-box-container">
        {activeTab === 'users' && (
        <div className="admin-box" style={{ flex: '1 1 600px' }}>
          <div className="admin-box-header">
            <h3 className="admin-box-title">전체 사용자 목록</h3>
            <button
              className="admin-action-btn"
              onClick={fetchAllUsers}
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
              <table className="admin-dashboard-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>학번</th>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={`${u.userId}-${u.studentNumber}`}>
                      <td>{u.userId}</td>
                      <td>{u.studentNumber}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <button
                          className="admin-delete-user-btn"
                          onClick={() => handleDeleteUser(u.userId)}
                          disabled={deletingUserId === u.userId}
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
        <div className="admin-box" style={{ flex: '1 1 800px' }}>
          <h3 className="admin-box-title primary">회원가입 승인 대기 명단</h3>
          {loading && <p>회원가입 대기 명단을 불러오는 중...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && (pendingMembers.length === 0 ? (
            <p>승인 대기 중인 회원이 없습니다.</p>
          ) : (
            <table className="admin-dashboard-table">
              <thead className="primary">
                <tr>
                  <th className="primary">학번</th>
                  <th className="primary">이름</th>
                  <th className="primary">이메일</th>
                  <th className="primary">전화번호</th>
                  <th className="primary">가입일</th>
                  <th className="primary">액션</th>
                </tr>
              </thead>
              <tbody>
                {pendingMembers.map(member => (
                  <tr key={member.studentNumber}>
                    <td className="primary">{member.studentNumber}</td>
                    <td className="primary">{member.name}</td>
                    <td className="primary">{member.email}</td>
                    <td className="primary">{member.phoneNumber}</td>
                    <td className="primary">{new Date(member.createdAt).toLocaleDateString()}</td>
                    <td className="primary">
                      <div className="admin-action-container">
                        <button
                          className="admin-approve-btn"
                          onClick={() => handleApproveMember(member.studentNumber)}
                        >
                          승인
                        </button>
                        <button
                          className="admin-reject-btn"
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
        <div className="admin-box" style={{ flex: '1 1 400px' }}>
          <h3 className="admin-box-title primary">스터디 그룹 생성</h3>
          <form onSubmit={handleCreateGroup} className="admin-form-group">
            <p className="admin-form-label">그룹 이름 <span>*</span></p>
            <input
              type="text"
              placeholder="그룹 이름을 입력하세요"
              className="admin-form-input"
              required
              maxLength={100}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              autoComplete="off"
            />

            <p className="admin-form-label">그룹 설명</p>
            <textarea
              placeholder="그룹 설명을 입력하세요"
              className="admin-form-textarea"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              maxLength={1000}
              autoComplete="off"
            ></textarea>

            {/* 카테고리 + 기수 + 멘토 학번 */}
            <div className="admin-form-row">
              <select
                value={newGroupCategory}
                onChange={(e)=>setNewGroupCategory(e.target.value)}
                className="admin-form-select"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="text"
                placeholder="기수(예:1기)"
                className="admin-form-input-generation"
                value={newGroupGeneration}
                onChange={(e)=>setNewGroupGeneration(e.target.value)}
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="멘토 학번"
                className="admin-form-input-number"
                value={newGroupMentor}
                onChange={(e)=>setNewGroupMentor(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="admin-submit-btn"
              disabled={creatingGroup}
            >
              {creatingGroup ? '생성 중...' : '그룹 생성'}
            </button>
          </form>
        </div>

        {/* 스터디 그룹 수정 */}
        <div className="admin-box" style={{ flex: '1 1 400px' }}>
          <h3 className="admin-box-title primary">스터디 그룹 수정</h3>
          <form onSubmit={handleUpdateGroup} className="admin-form-group">
            
            <p className="admin-form-label">그룹 대표 이미지</p>
            <input
              type="file"
              accept="image/*"
              onChange={e => setEditGroupImage(e.target.files[0] || null)}
              style={{ marginBottom: '20px' }}
            />
            

            <p className="admin-form-label">현재 스터디 그룹 이름 <span>*</span></p>
            <input
              type="text"
              placeholder="수정할 현재 스터디 그룹 이름 입력하세요"
              className="admin-form-input"
              required
              value={currentGroupName}
              onChange={(e) => setCurrentGroupName(e.target.value)}
              autoComplete="off"
            />

            <p className="admin-form-label">변경될 스터디 그룹 이름 <span>*</span></p>
            <div className="admin-form-row">
              <input
                type="text"
                placeholder="변경될 스터디 그룹 이름을 입력하세요"
                className="admin-form-input"
                required
                maxLength={100}
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="admin-check-btn"
                onClick={handleCheckGroupName}
              >
                중복 확인
              </button>
            </div>

            <p className="admin-form-label">그룹 설명</p>
            <textarea
              placeholder="새 그룹 설명을 입력하세요"
              className="admin-form-textarea"
              value={editGroupDescription}
              onChange={(e) => setEditGroupDescription(e.target.value)}
              maxLength={1000}
              autoComplete="off"
            ></textarea>

            {/* 카테고리 + 기수 + 멘토 학번 */}
            <div className="admin-form-row">
              <select
                value={editGroupCategory}
                onChange={(e)=>setEditGroupCategory(e.target.value)}
                className="admin-form-select"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="text"
                placeholder="기수(예:1기)"
                className="admin-form-input-generation"
                value={editGroupGeneration}
                onChange={(e)=>setEditGroupGeneration(e.target.value)}
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="멘토 학번"
                className="admin-form-input-number"
                value={editGroupMentor}
                onChange={(e)=>setEditGroupMentor(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="admin-submit-btn"
              disabled={updatingGroup}
            >
              {updatingGroup ? '수정 중...' : '그룹 수정'}
            </button>
          </form>
        </div>
                {/* 스터디 그룹 조회 테이블 추가 */}
        <div className="admin-box" style={{ flex: '1 1 800px' }}>
          <h3 className="admin-box-title primary">전체 스터디 그룹 목록</h3>
          {groupsLoading && <div className="admin-loading">스터디 그룹 목록을 불러오는 중...</div>}
          {groupsError && <div className="admin-error">{groupsError}</div>}
          {!groupsLoading && !groupsError && (
            groups.length === 0 ? (
              <div className="admin-empty">
                <i className="fas fa-users"></i>
                스터디 그룹이 없습니다.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-groups-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>이름</th>
                      <th>카테고리</th>
                      <th>기수</th>
                      <th>상태</th>
                      <th>이미지</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map(g => (
                      <tr key={g.studyGroupId} className={g.status === 'ACTIVE' ? 'active-group' : 'inactive-group'}>
                        <td><span className="group-id">#{g.studyGroupId}</span></td>
                        <td><span className="group-name">{g.name}</span></td>
                        <td>
                          <span className="admin-category-badge">
                            {g.category}
                          </span>
                        </td>
                        <td>
                          <span className="generation-text">
                            {g.generation || '미설정'}
                          </span>
                        </td>
                        <td>
                          <div 
                            className={`status-toggle-container ${g.status === 'ACTIVE' ? 'active' : 'inactive'}`}
                            onClick={() => handleToggleGroupStatus(g.studyGroupId)}
                          >
                            <i className={`fas ${g.status === 'ACTIVE' ? 'fa-play-circle' : 'fa-pause-circle'} status-icon`}></i>
                            <span className="status-text">
                              {g.status === 'ACTIVE' ? '진행중' : g.status === 'INACTIVE' ? '종료' : g.status || '알 수 없음'}
                            </span>
                            <div className="toggle-switch"></div>
                          </div>
                        </td>
                        <td>
                          <div className="admin-group-image-container">
                            {g.studyImage ? (
                              <img 
                                src={g.studyImage} 
                                alt={g.name} 
                                className="admin-group-image"
                              />
                            ) : (
                              <span style={{ color: '#6c757d', fontSize: '12px' }}>
                                No Image
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            {/* 삭제 버튼 */}
                            <button
                              className="admin-delete-btn"
                              onClick={() => setDeleteModal({ 
                                isOpen: true, 
                                groupName: g.name, 
                                groupId: g.studyGroupId 
                              })}
                            >
                              <i className="fas fa-trash-alt"></i>
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
          </>
        )}
      </div>

      {/* 그룹 삭제 확인 모달 */}
      {deleteModal.isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setDeleteModal({ isOpen: false, groupName: '', groupId: null })}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              padding: '30px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px' 
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#dc3545', 
                fontSize: '1.5rem',
                fontWeight: '600'
              }}>
                그룹 삭제 확인
              </h3>
              <button
                onClick={() => setDeleteModal({ isOpen: false, groupName: '', groupId: null })}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6c757d',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#f8f9fa';
                  e.target.style.color = '#dc3545';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6c757d';
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '20px',
                padding: '20px',
                backgroundColor: '#fff5f5',
                borderRadius: '10px',
                border: '1px solid #fed7d7'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ 
                  fontSize: '3rem', 
                  color: '#dc3545', 
                  marginBottom: '15px' 
                }}></i>
                <p style={{ 
                  margin: 0, 
                  fontSize: '1.1rem', 
                  color: '#2d3748',
                  lineHeight: '1.5'
                }}>
                  <strong>"{deleteModal.groupName}"</strong> 그룹을 정말로 삭제하시겠습니까?
                </p>
                <p style={{ 
                  margin: '10px 0 0 0', 
                  fontSize: '0.9rem', 
                  color: '#718096'
                }}>
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end' 
            }}>
              <button 
                onClick={() => setDeleteModal({ isOpen: false, groupName: '', groupId: null })}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#f9fafb',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.borderColor = '#9ca3af';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.borderColor = '#d1d5db';
                }}
              >
                취소
              </button>
              <button 
                onClick={handleDeleteGroup}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#c82333';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#dc3545';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
    
  );
}
