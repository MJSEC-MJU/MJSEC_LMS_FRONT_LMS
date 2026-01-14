import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../client";
import { Editor } from '@tinymce/tinymce-react';
import { getMenteeProfileImageSrc, getMenteeProfileImageSrcCropped } from "../../utils/imageUtils";
import CurriculumSection from './CurriculumSection';


export default function GroupDetail({ groupId, myStudies }) {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  // BASE_URL 기반 이미지 경로 설정
  const base = (import.meta.env.BASE_URL || "/");
  const logoFallback = `${base}images/logo.png`;

  // 프로필 이미지 URL 생성 함수 (유틸리티로 이동됨)
  const [croppedImages, setCroppedImages] = useState({});
  
  // 그룹 멘티 목록 및 제출 상태
  const [mentees, setMentees] = useState([]);
  const [isMentor, setIsMentor] = useState(null);
  
  // 그룹 상세 정보 상태 (설명, 기수만)
  const [groupDetail, setGroupDetail] = useState(null);
  // 화면 표시용 그룹명(수정 반영)
  const [displayName, setDisplayName] = useState('');
  // 그룹 수정 모달
  const [editGroupModal, setEditGroupModal] = useState({
    isOpen: false,
    name: '',
    content: '',
    imageFile: null,
    submitting: false,
  });
  
  // 멘티 이미지들을 정사각형으로 자르기
  useEffect(() => {
    if (mentees && mentees.length > 0) {
      mentees.forEach(mentee => {
        if (mentee.profileImage && !croppedImages[mentee.userId]) {
          getMenteeProfileImageSrcCropped(mentee.profileImage, (croppedImage) => {
            setCroppedImages(prev => ({
              ...prev,
              [mentee.userId]: croppedImage
            }));
          }, logoFallback);
        }
      });
    }
  }, [mentees, logoFallback, croppedImages]);
  const [mentorModal, setMentorModal] = useState({
    isOpen: false,
    activeTab: 'add'
  });
  const [addMenteeModal, setAddMenteeModal] = useState({
    studentNumber: '',
    submitting: false
  });
  const [confirmDeleteMentee, setConfirmDeleteMentee] = useState({ 
    isOpen: false, 
    studentNumber: '' 
  });
  const [warnModal, setWarnModal] = useState({
    isOpen: false,
    studentNumber: '',
    studentName: ''
  });
  const [mentorInfo, setMentorInfo] = useState(null);
  const [_menteeSubmissions, setMenteeSubmissions] = useState({});
  const [_menteesLoading, setMenteesLoading] = useState(false);

  const initializeMenteeSubmissions = React.useCallback((list) => {
    const next = {};
    (list || []).forEach(m => { next[m.userId] = next[m.userId] || { status: '미제출', url: '' }; });
    setMenteeSubmissions(next);
  }, []);

  // 경고 횟수 조회
  const [menteeWarnings, setMenteeWarnings] = useState([]); // 멘티 경고 횟수 데이터
  const [loadingWarnings, setLoadingWarnings] = useState(false); // 로딩 상태
  // 멘토 관리 모달 닫기 함수
  const closeMentorModal = () => {
    setMentorModal({
      isOpen: false,
      activeTab: 'add'
    });
  };

  // 멘토 관리 탭 변경 함수
  const changeMentorTab = (tab) => {
    setMentorModal(prev => ({
      ...prev,
      activeTab: tab
    }));
  };

  // 멘티 추가 함수
  const handleAddMentee = async () => {
    if (!addMenteeModal.studentNumber.trim()) {
      alert('학번을 입력해주세요.');
      return;
    }

    setAddMenteeModal(prev => ({ ...prev, submitting: true }));
    
    try {
      const studentNumber = addMenteeModal.studentNumber.trim();
      const response = await api('POST', `/mentor/group/${groupId}/add-member/${studentNumber}`, null, token);

      if (response.code === 'SUCCESS') {
        alert('멘티가 성공적으로 추가되었습니다!');
        setAddMenteeModal({ studentNumber: '', submitting: false });
        fetchMentees(); // 멘티 목록 새로고침
      } else {
        alert(response.message || '멘티 추가에 실패했습니다.');
      }
    } catch {
      // 멘티 추가 오류 처리
      alert('멘티 추가 중 오류가 발생했습니다.');
    } finally {
      setAddMenteeModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // 멘티 삭제 함수
  const handleDeleteMentee = async () => {
    if (!confirmDeleteMentee.studentNumber) {
      alert('삭제할 멘티를 선택해주세요.');
      return;
    }

    try {
      const studentNumber = confirmDeleteMentee.studentNumber;
      const response = await api('DELETE', `/mentor/group/${groupId}/delete-member/${studentNumber}`, null, token);

      if (response.code === 'SUCCESS') {
        alert('멘티가 성공적으로 삭제되었습니다!');
        setConfirmDeleteMentee({ isOpen: false, studentNumber: '' });
        fetchMentees(); // 멘티 목록 새로고침
      } else {
        alert(response.message || '멘티 삭제에 실패했습니다.');
      }
    } catch {
      // 멘티 삭제 오류 처리
      alert('멘티 삭제 중 오류가 발생했습니다.');
    }
  };

  // 경고 부여 함수
  const handleWarnMentee = async () => {
    if (!warnModal.studentNumber) {
      alert('경고를 부여할 멘티를 선택해주세요.');
      return;
    }

    try {
      // 경고 부여 요청
      
      const response = await api('POST', `/mentor/warn/${groupId}/${warnModal.studentNumber}`, null, token);
      
      // 경고 부여 응답

      if (response.code === 'SUCCESS') {
        // API에서 최신 경고 데이터 다시 가져오기
        const result = await fetchMenteeWarnings();
        if (result.success) {
          setMenteeWarnings(result.data);
        }
        
        alert('경고가 성공적으로 부여되었습니다.');
        setWarnModal({ isOpen: false, studentNumber: '', studentName: '' });
      } else {
        alert(response.message || '경고 부여에 실패했습니다.');
      }
    } catch {
      alert('경고 부여 중 오류가 발생했습니다.');
    }
  };


  // 멘토 권한 확인
  const checkMentor = React.useCallback(async () => {
    if (!token || !groupId || isNaN(groupId)) {
      setIsMentor(false);
      return;
    }
    
    try {
      // /group/{groupId}/member API를 사용해서 멤버 목록과 역할 확인
      const res = await api('GET', `/group/${groupId}/member`, null, token);
      const members = res?.data || [];
      
      // 현재 사용자가 멘토인지 확인
      const myStudentNo = (user?.studentNumber ?? '').toString();
      const myEmail = (user?.email ?? '').toLowerCase();
      
      const myMemberInfo = members.find(member => {
        const memberStudent = (member?.studentNumber ?? '').toString();
        const memberEmail = (member?.email ?? '').toLowerCase();
        return (!!myStudentNo && myStudentNo === memberStudent) || (!!myEmail && !!memberEmail && myEmail === memberEmail);
      });
      
      // 멤버 정보에서 role이 MENTOR인지 확인
      const isMentor = myMemberInfo?.role === 'MENTOR';
      setIsMentor(isMentor);
      
      // 멘토 정보 추출
      const mentor = members.find(member => member.role === 'MENTOR');
      setMentorInfo(mentor);
      
    } catch {
      // 멘토 권한 확인 오류 처리
      // 에러 발생 시 사용자 role로 판단
      if (user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_MENTOR') {
        setIsMentor(true);
      } else {
        setIsMentor(false);
      }
    }
  }, [token, groupId, user]);

  // 그룹 상세 정보 조회 (설명, 기수만)
  const fetchGroupDetail = React.useCallback(async () => {
    if (!token || !groupId || isNaN(groupId)) return;
    
    try {
      const res = await api('GET', `/group/${groupId}/info`, null, token);
      if (res?.code === 'SUCCESS') {
        setGroupDetail({
          content: res.data.content,
          generation: res.data.generation
        });
      }
    } catch {
      // 그룹 상세 정보 조회 오류 처리
    }
  }, [token, groupId]);

  // 멘티 목록 조회
  const fetchMentees = React.useCallback(async () => {
    if (!token || !groupId || isNaN(groupId)) return;
    
    setMenteesLoading(true);
    try {
      const res = await api('GET', `/group/${groupId}/mentee`, null, token);
      const members = (res && res.code === 'SUCCESS') ? (res.data || []) : (Array.isArray(res) ? res : []);
      setMentees(members);
      initializeMenteeSubmissions(members);
    } catch {
      // 멘티 목록 조회 오류 처리
    } finally {
      setMenteesLoading(false);
    }
  }, [token, groupId, initializeMenteeSubmissions]);

  // 현재 테마 감지
  const isDarkMode = document.body.classList.contains('dark');
  
  // TinyMCE 설정
  const _tinymceConfig = {
    height: 400,
    language: 'ko_KR',
    menubar: false,
    plugins: 'advlist autolink lists link image charmap anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat code',
    font_formats: 'Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace; Times New Roman=times new roman,times; Noto Sans KR=noto sans kr,sans-serif; Malgun Gothic=malgun gothic,sans-serif',
    fontsize_formats: '8pt 10pt 12pt 14pt 16pt 18pt 20pt 24pt 28pt 32pt 36pt',
    content_style: `body { 
      font-family: "Noto Sans KR", "Malgun Gothic", sans-serif; 
      font-size: 14px; 
      line-height: 1.6; 
      background-color: ${isDarkMode ? '#222' : '#ffffff'};
      color: ${isDarkMode ? '#ffffff' : '#000000'};
    }
    .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before {
      color: ${isDarkMode ? '#aaa' : '#888'} !important;
      font-style: italic;
    }
    a {
      color: #0066cc;
      text-decoration: underline;
    }
    a:hover {
      color: #0052a3;
      text-decoration: none;
    }`,
    toolbar_mode: 'wrap',
    placeholder: '커리큘럼 설명을 입력하세요...',
    branding: false,
    elementpath: false,
    resize: false,
    statusbar: false,
    content_css: isDarkMode ? 'dark' : 'default',
    link_list: [
      {title: 'My page 1', value: 'https://www.tiny.cloud'},
      {title: 'My page 2', value: 'https://about.tiny.cloud'}
    ],
    link_title: false,
    link_quicklink: true,
    link_assume_external_targets: true,
    link_default_target: '_blank'
  };

  // 페이지 진입 시 역할 판별 및 데이터 조회
  useEffect(() => {
    if (groupId && token) {
      setIsMentor(null);
      checkMentor();
      fetchGroupDetail(); // 그룹 상세 정보 조회
      fetchMentees(); // 멘티 목록도 함께 조회
    }
  }, [groupId, token, checkMentor, fetchGroupDetail, fetchMentees]);

  // 멘티 경고 횟수 조회 함수
  const fetchMenteeWarnings = async () => {
    try {
      const result = await api('GET', `/group/${groupId}/mentee/warn`, null, token);
      
      if (result.code === 'SUCCESS') {
        return { success: true, data: result.data };
      }
      return { success: false, error: result.message || '경고 횟수 조회에 실패했습니다.' };
    } catch {
      // 경고 횟수 조회 오류
      return { success: false, error: '경고 횟수 조회 중 오류가 발생했습니다.' };
    }
  };

  // 멘티 경고 횟수 조회
  useEffect(() => {
    const loadMenteeWarnings = async () => {
      if (isMentor && groupId && token) {
        setLoadingWarnings(true);
        const result = await fetchMenteeWarnings();
        if (result.success) {
          setMenteeWarnings(result.data);
        } else {
          // 경고 횟수 조회 실패
        }
        setLoadingWarnings(false);
      }
    };
    
    loadMenteeWarnings();
  }, [isMentor, groupId, token]);

  const currentGroup = myStudies.find(study => study.groupId === parseInt(groupId));
  

  useEffect(() => {
    setDisplayName(currentGroup?.name || '');
  }, [currentGroup?.name]);
  
  if (!currentGroup) {
    return (
      <section className="contact">
        <h1 className="heading">그룹을 찾을 수 없습니다</h1>
        <button onClick={() => navigate('/groups')} className="btn btn-primary">
          목록으로 돌아가기
        </button>
      </section>
    );
  }


  const openEditModal = () => {
    setEditGroupModal({
      isOpen: true,
      name: (displayName || currentGroup?.name || '').toString(),
      content: (groupDetail?.content || currentGroup?.description || '').toString(),
      imageFile: null,
      submitting: false,
    });
  };

  const closeEditModal = () => {
    setEditGroupModal((prev) => ({ ...prev, isOpen: false, imageFile: null, submitting: false }));
  };

  const handleSaveGroup = async () => {
    if (!token) return;
    if (!groupId || isNaN(groupId)) return;
    if (!isMentor) return;

    setEditGroupModal((prev) => ({ ...prev, submitting: true }));
    try {
      const dto = {
        name: editGroupModal.name?.trim() || '',
        content: editGroupModal.content?.trim() || '',
      };

      const formData = new FormData();
      // JSON 파트를 application/json으로 전송
      if (dto.name || dto.content) {
        formData.append(
          'StudyGroupPutDto',
          new Blob([JSON.stringify(dto)], { type: 'application/json' })
        );
      }
      if (editGroupModal.imageFile) {
        formData.append('image', editGroupModal.imageFile);
      }

      const res = await api('PUT', `/mentor/group/${groupId}`, formData, token);
      if (res?.code === 'SUCCESS') {
        // 화면 갱신
        if (res?.data?.name) setDisplayName(res.data.name);
        if (res?.data?.content) setGroupDetail((prev) => ({ ...(prev || {}), content: res.data.content }));
        alert('스터디 그룹이 수정되었습니다.');
        closeEditModal();
      } else {
        alert(res?.message || '스터디 그룹 수정에 실패했습니다.');
      }
    } catch (e) {
      alert(e?.message || '스터디 그룹 수정 중 오류가 발생했습니다.');
    } finally {
      setEditGroupModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  return (
    <section className="contact">
      <div className="group-detail-header">
        <button onClick={() => navigate('/groups')} className="btn btn-secondary">
          ← 목록으로 돌아가기
        </button>
        <h1 className="group-title">
          {displayName || currentGroup.name}
          {isMentor && (
            <button
              type="button"
              className="group-inline-edit-btn"
              onClick={openEditModal}
              title="그룹 정보 수정"
            >
              <i className="fas fa-pen"></i>
            </button>
          )}
        </h1>
        {isMentor && (
          <button 
            className="btn btn-primary"
            onClick={() => setMentorModal({ isOpen: true, activeTab: 'add' })}
          >
            멤버 관리
          </button>
        )}
      </div>

      <div className="group-detail-container">
        <div className="group-info-section">
          <h2>그룹 정보</h2>
          <div className="group-info">
            {mentorInfo && (
              <p><strong>멘토:</strong> {mentorInfo.name || '정보 없음'}</p>
            )}
            <p className="group-info-row">
              <strong>설명:</strong> {groupDetail?.content || currentGroup.description || '설명 없음'}
              {isMentor && (
                <button
                  type="button"
                  className="group-inline-edit-btn"
                  onClick={openEditModal}
                  title="그룹 정보 수정"
                >
                  <i className="fas fa-pen"></i>
                </button>
              )}
            </p>
            <p><strong>카테고리:</strong> {Array.isArray(currentGroup.category) ? currentGroup.category.join(', ') : currentGroup.category || '일반'}</p>
            {groupDetail?.generation && (
              <p><strong>기수:</strong> {groupDetail.generation}</p>
            )}
          </div>
          
          {/* 멘티 목록 섹션 - 멘토만 볼 수 있음 */}
          {isMentor && (
            <div className="mentees-section">
              <h3>멘티 목록</h3>
              <div className="mentees-list">
                {_menteesLoading ? (
                  <div className="loading-mentees">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>멘티 목록을 불러오는 중...</span>
                  </div>
                ) : mentees.length > 0 ? (
                  <div className="mentees-grid">
                    {mentees.map((mentee) => (
                      <div key={mentee.userId} className="mentee-card">
                        <div className="mentee-profile">
                          <img 
                            src={croppedImages[mentee.userId] || getMenteeProfileImageSrc(mentee.profileImage)} 
                            alt={mentee.name || '프로필'} 
                            className="mentee-profile-image"
                            onError={(e) => { e.currentTarget.src = logoFallback }}
                          />
                        </div>
                        <div className="mentee-info">
                          <div className="mentee-name">{mentee.name || '이름 없음'}</div>
                          <div className="mentee-email">{mentee.email || '이메일 없음'}</div>
                          <div className="mentee-student-number">학번: {mentee.studentNumber || '정보 없음'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-mentees">
                    <i className="fas fa-users"></i>
                    <p>현재 멘티가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>



        {/* 커리큘럼 섹션 */}
        <CurriculumSection 
          groupId={groupId}
          isMentor={isMentor}
          token={token}
        />
      </div>

      {/* 그룹 정보 수정 모달 (멘토 전용) */}
      {editGroupModal.isOpen && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">그룹 정보 수정</h3>
              <button className="modal-close" onClick={closeEditModal} aria-label="close">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>그룹명</label>
                <input
                  type="text"
                  value={editGroupModal.name}
                  onChange={(e) => setEditGroupModal((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="그룹명을 입력하세요"
                />
              </div>

              <div className="form-group">
                <label>설명</label>
                <textarea
                  value={editGroupModal.content}
                  onChange={(e) => setEditGroupModal((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="설명을 입력하세요"
                />
              </div>

              <div className="form-group">
                <label>이미지</label>
                <div className="group-image-upload-row">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      setEditGroupModal((prev) => ({ ...prev, imageFile: f || null }));
                    }}
                  />
                  {editGroupModal.imageFile && (
                    <span className="group-image-file-name">{editGroupModal.imageFile.name}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeEditModal} disabled={editGroupModal.submitting}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleSaveGroup} disabled={editGroupModal.submitting}>
                {editGroupModal.submitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 멘토 관리 모달 */}
      {mentorModal.isOpen && (
        <div className="group-mentor-modal-overlay" onClick={closeMentorModal}>
          <div className="group-mentor-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="group-mentor-modal-header">
              <h3 className="group-mentor-modal-title">멤버 관리</h3>
              <button className="group-mentor-modal-close" onClick={closeMentorModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="group-mentor-modal-tabs">
              <button 
                className={`group-mentor-tab ${mentorModal.activeTab === 'add' ? 'active' : ''}`}
                onClick={() => changeMentorTab('add')}
              >
                <i className="fas fa-plus"></i>
                멤버 추가
              </button>
              <button 
                className={`group-mentor-tab ${mentorModal.activeTab === 'remove' ? 'active' : ''}`}
                onClick={() => changeMentorTab('remove')}
              >
                <i className="fas fa-minus"></i>
                멤버 경고/삭제
              </button>
            </div>

            <div className="group-mentor-modal-body">
              {mentorModal.activeTab === 'add' ? (
                <div className="group-mentor-add-section">
                  <h4 className="group-mentor-section-title">학번으로 멤버 추가</h4>
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="학번을 입력하세요"
                      value={addMenteeModal.studentNumber}
                      onChange={(e) => setAddMenteeModal(prev => ({ ...prev, studentNumber: e.target.value }))}
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={handleAddMentee}
                      disabled={addMenteeModal.submitting}
                    >
                      {addMenteeModal.submitting ? '추가 중...' : '추가'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group-mentor-remove-section">
                  <h4 className="group-mentor-section-title">현재 멤버 목록</h4>
                  <div className="group-mentor-member-list">
                    {mentees.map((mentee) => (
                      <div key={mentee.userId} className="group-mentor-member-item">
                        <div className="group-mentor-member-profile">
                          <img 
                            src={croppedImages[mentee.userId] || getMenteeProfileImageSrc(mentee.profileImage)} 
                            alt={mentee.name || '프로필'} 
                            className="mentee-profile-image"
                            onError={(e) => { e.currentTarget.src = logoFallback }}
                          />
                        </div>
                        <div className="group-mentor-member-info">
                          <div className="group-mentor-member-details">
                            <span className="group-mentor-member-name">{mentee.name}</span>
                            <span className="group-mentor-member-email">{mentee.email}</span>
                          </div>
                          <span className="group-mentor-member-warnings">
                            {loadingWarnings ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              `경고: ${menteeWarnings.find(w => w.studentNumber === mentee.studentNumber)?.warn || 0}회`
                            )}
                          </span>
                        </div>
                        <div className="group-mentor-member-actions">
                          <button 
                            className="group-mentor-warn-btn"
                            onClick={() => setWarnModal({
                              isOpen: true,
                              studentNumber: mentee.studentNumber,
                              studentName: mentee.name
                            })}
                            title="경고 부여"
                          >
                            <i className="fas fa-exclamation-triangle"></i>
                          </button>
                          <button 
                            className="group-mentor-remove-btn"
                            onClick={() => setConfirmDeleteMentee({ isOpen: true, studentNumber: mentee.studentNumber })}
                            title="멤버 삭제"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                    {mentees.length === 0 && (
                      <p className="group-mentor-no-members">현재 멤버가 없습니다.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 멤버 삭제 확인 모달 */}
      {confirmDeleteMentee.isOpen && (
        <div className="group-mentor-modal-overlay" onClick={() => setConfirmDeleteMentee({ isOpen: false, studentNumber: '' })}>
          <div className="group-mentor-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="group-mentor-modal-header">
              <h3 className="group-mentor-modal-title">멤버 삭제 확인</h3>
              <button className="group-mentor-modal-close" onClick={() => setConfirmDeleteMentee({ isOpen: false, studentNumber: '' })}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="group-mentor-modal-body">
              <p>정말로 이 멤버를 삭제하시겠습니까?</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setConfirmDeleteMentee({ isOpen: false, studentNumber: '' })}
                >
                  취소
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={handleDeleteMentee}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 경고 부여 모달 */}
      {warnModal.isOpen && (
        <div className="group-mentor-modal-overlay" onClick={() => setWarnModal({ isOpen: false, studentNumber: '', studentName: '' })}>
          <div className="group-mentor-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="group-mentor-modal-header">
              <h3 className="group-mentor-modal-title">경고 부여</h3>
              <button className="group-mentor-modal-close" onClick={() => setWarnModal({ isOpen: false, studentNumber: '', studentName: '' })}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="group-mentor-modal-body">
              <p><strong>{warnModal.studentName}</strong>에게 경고를 부여하시겠습니까?</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setWarnModal({ isOpen: false, studentNumber: '', studentName: '' })}
                >
                  취소
                </button>
                <button 
                  className="btn btn-warning"
                  onClick={handleWarnMentee}
                >
                  경고 부여
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
