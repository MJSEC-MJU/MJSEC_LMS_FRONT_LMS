import React, { useState, useEffect } from 'react';
import { api } from "../client";
import { getMenteeProfileImageSrcCropped, getMenteeProfileImageSrc } from "../../utils/imageUtils";

export default function MenteeManagement({ groupId, isMentor, mentees, menteesLoading, fetchMentees }) {
  // BASE_URL 기반 이미지 경로 설정
  const base = (import.meta.env.BASE_URL || "/");
  const logoFallback = `${base}images/logo.png`;

  // 프로필 이미지 URL 생성 함수 (유틸리티로 이동됨)
  const [croppedImages, setCroppedImages] = useState({});
  
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
    isOpen: false,
    studentNumber: '',
    submitting: false
  });
  const [confirmDeleteMentee, setConfirmDeleteMentee] = useState({ 
    isOpen: false, 
    studentNumber: '' 
  });

  // 멘토 관리 모달 열기 함수
  const openMentorModal = () => {
    setMentorModal({ isOpen: true, activeTab: 'add' });
  };

  // 멘토 관리 모달 닫기 함수
  const closeMentorModal = () => {
    setMentorModal({ isOpen: false, activeTab: 'add' });
  };

  // 멘티 추가 함수
  const handleAddMentee = async () => {
    if (!addMenteeModal.studentNumber.trim()) {
      alert('학번을 입력해주세요.');
      return;
    }

    setAddMenteeModal(prev => ({ ...prev, submitting: true }));
    
    try {
      const response = await api('POST', `/group/${groupId}/members`, {
        studentNumber: addMenteeModal.studentNumber.trim()
      });

      if (response.code === 'SUCCESS') {
        alert('멘티가 성공적으로 추가되었습니다!');
        setAddMenteeModal({ isOpen: false, studentNumber: '', submitting: false });
        fetchMentees(); // 멘티 목록 새로고침
      } else {
        alert(response.message || '멘티 추가에 실패했습니다.');
      }
    } catch {
      // 멘티 추가 오류 처리
      alert('멘티 추가에 실패했습니다.');
    } finally {
      setAddMenteeModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // 멘티 삭제 확인 함수
  const handleConfirmDeleteMentee = async () => {
    if (!confirmDeleteMentee.studentNumber) return;

    try {
      const response = await api('DELETE', `/group/${groupId}/members/${confirmDeleteMentee.studentNumber}`);

      if (response.code === 'SUCCESS') {
        alert('멘티가 성공적으로 삭제되었습니다!');
        setConfirmDeleteMentee({ isOpen: false, studentNumber: '' });
        fetchMentees(); // 멘티 목록 새로고침
      } else {
        alert(response.message || '멘티 삭제에 실패했습니다.');
      }
    } catch {
      // 멘티 삭제 오류 처리
      alert('멘티 삭제에 실패했습니다.');
    }
  };

  // 사용 가능한 멘티 목록 (현재 그룹에 속하지 않은 멘티들)
  // const getAvailableMentees = () => {
  //   const currentMemberIds = mentees.map(member => member.id);
  //   return clubMembers.filter(member => !currentMemberIds.includes(member.id));
  // };

  return (
    <div className="mentee-management-section">
      <div className="group-members">
        <div className="group-members-header">
          <h2 className="group-members-title">멘티 관리</h2>
          {isMentor && (
            <button 
              className="group-mentor-manage-btn"
              onClick={openMentorModal}
            >
              <i className="fas fa-users"></i> 멘티 관리
            </button>
          )}
        </div>

        <div className="group-members-table-container">
          <table className="group-members-table">
            <thead>
              <tr>
                <th>프로필</th>
                <th>이름</th>
                <th>학번</th>
                <th>이메일</th>
                <th>상태</th>
                {isMentor && <th>액션</th>}
              </tr>
            </thead>
            <tbody>
              {menteesLoading ? (
                <tr>
                  <td colSpan={isMentor ? 6 : 5} style={{ textAlign: 'center', padding: '2rem' }}>
                    <i className="fas fa-spinner fa-spin"></i> 멘티 목록을 불러오는 중...
                  </td>
                </tr>
              ) : mentees.length > 0 ? (
                mentees.map((mentee) => (
                  <tr key={mentee.userId || mentee.studentNumber} className="group-member-row">
                    <td className="group-member-profile">
                      <img 
                        src={croppedImages[mentee.userId] || getMenteeProfileImageSrc(mentee.profileImage)} 
                        alt={mentee.name || '프로필'} 
                        className="mentee-profile-image"
                        onError={(e) => { e.currentTarget.src = logoFallback }}
                      />
                    </td>
                    <td className="group-member-name">{mentee.name || '익명'}</td>
                    <td>{mentee.studentNumber || '-'}</td>
                    <td>{mentee.email || '-'}</td>
                    <td>
                      <span className="status-badge present">활성</span>
                    </td>
                    {isMentor && (
                      <td className="action-buttons">
                        <button 
                          className="action-btn warning-btn"
                          onClick={() => setConfirmDeleteMentee({ 
                            isOpen: true, 
                            studentNumber: mentee.studentNumber 
                          })}
                          title="멘티 삭제"
                        >
                          <i className="fas fa-user-minus"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isMentor ? 6 : 5} style={{ textAlign: 'center', padding: '2rem' }}>
                    등록된 멘티가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 멘토 관리 모달 */}
      {mentorModal.isOpen && (
        <div className="group-mentor-modal-overlay">
          <div className="group-mentor-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="group-mentor-modal-header">
              <h3 className="group-mentor-modal-title">멘토 관리</h3>
              <button className="group-mentor-modal-close" onClick={closeMentorModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="group-mentor-modal-tabs">
              <button 
                className={`group-mentor-tab ${mentorModal.activeTab === 'add' ? 'active' : ''}`}
                onClick={() => setMentorModal(prev => ({ ...prev, activeTab: 'add' }))}
              >
                <i className="fas fa-user-plus"></i> 멘티 추가
              </button>
              <button 
                className={`group-mentor-tab ${mentorModal.activeTab === 'remove' ? 'active' : ''}`}
                onClick={() => setMentorModal(prev => ({ ...prev, activeTab: 'remove' }))}
              >
                <i className="fas fa-user-minus"></i> 멘티 삭제
              </button>
            </div>
            
            <div className="group-mentor-modal-body">
              {mentorModal.activeTab === 'add' && (
                <div>
                  <h4 className="group-mentor-section-title">멘티 추가</h4>
                  <div className="mentee-action">
                    <input
                      type="text"
                      placeholder="학번을 입력하세요"
                      value={addMenteeModal.studentNumber}
                      onChange={(e) => setAddMenteeModal(prev => ({ ...prev, studentNumber: e.target.value }))}
                      style={{
                        padding: '0.8rem 1rem',
                        border: '1px solid #ddd',
                        borderRadius: '0.5rem',
                        fontSize: '1.2rem',
                        marginRight: '0.5rem',
                        width: '200px'
                      }}
                    />
                    <button 
                      className="btn-mentee inline-btn"
                      onClick={handleAddMentee}
                      disabled={addMenteeModal.submitting}
                    >
                      {addMenteeModal.submitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> 추가 중...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus"></i> 멘티 추가
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {mentorModal.activeTab === 'remove' && (
                <div>
                  <h4 className="group-mentor-section-title">멘티 삭제</h4>
                  <div className="group-mentor-member-list">
                    {mentees.length > 0 ? (
                      mentees.map((mentee) => (
                        <div key={mentee.userId || mentee.studentNumber} className="group-mentor-member-item">
                          <div className="group-mentor-member-info">
                            <div className="group-mentor-member-name">{mentee.name || '익명'}</div>
                            <div className="group-mentor-member-email">{mentee.email || '-'}</div>
                            <div className="group-mentor-member-status">학번: {mentee.studentNumber || '-'}</div>
                          </div>
                          <button 
                            className="group-mentor-remove-btn"
                            onClick={() => setConfirmDeleteMentee({ 
                              isOpen: true, 
                              studentNumber: mentee.studentNumber 
                            })}
                            title="멘티 삭제"
                          >
                            <i className="fas fa-user-minus"></i>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="group-mentor-no-members">
                        등록된 멘티가 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 멘티 삭제 확인 모달 */}
      {confirmDeleteMentee.isOpen && (
        <div className="assignment-modal-overlay">
          <div className="assignment-modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="assignment-modal-header">
              <h3 className="assignment-modal-title">멘티 삭제 확인</h3>
              <button 
                className="assignment-modal-close" 
                onClick={() => setConfirmDeleteMentee({ isOpen: false, studentNumber: '' })}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="assignment-modal-body">
              <p>정말로 학번 "{confirmDeleteMentee.studentNumber}" 스터디원을 삭제하시겠습니까?</p>
            </div>
            <div className="assignment-modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setConfirmDeleteMentee({ isOpen: false, studentNumber: '' })}
              >
                취소
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleConfirmDeleteMentee}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
