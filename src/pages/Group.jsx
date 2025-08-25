import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../components/auth"
import { api } from "../components/client"
import DatePicker from 'react-datepicker'
import { registerLocale } from 'react-datepicker'
import ko from 'date-fns/locale/ko'
import 'react-datepicker/dist/react-datepicker.css'

// 한국어 로케일 등록
registerLocale('ko', ko);

export default function Group() {
  const { groupId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // react-datepicker 테스트용 상태
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  
  // 수강중인 과목 데이터
  const [myStudies, setMyStudies] = useState([
    {
      groupId: 1,
      name: "리버싱크대나무행주",
      createdAt: "2025-09-08T07:47:49.803Z",
      description: "리버싱입니당",
      category: ["리버싱"],
      GroupImage: "----------------",
      createdById: 1,
      members: [
        { 
          id: 1, 
          name: "나건하", 
          attendance: "출석", 
          warning: 0,
          assignments: {
            week1: { status: "제출완료", url: "https://github.com/na-geonha/assignment1" },
            week2: { status: "미제출", url: "" },
            week3: { status: "검토중", url: "https://github.com/na-geonha/assignment3" }
          }
        },
        { 
          id: 2, 
          name: "최윤호", 
          attendance: "결석", 
          warning: 1,
          assignments: {
            week1: { status: "미제출", url: "" },
            week2: { status: "제출완료", url: "https://github.com/choi-yunho/assignment2" },
            week3: { status: "미제출", url: "" }
          }
        }
      ]
    },
    {
      groupId: 2,
      name: "웹심",
      createdAt: "2025-09-08T07:47:49.803Z",
      description: "웹심입니당",
      category: ["웹해킹"],
      GroupImage: "----------------",
      createdById: 1,
      members: [
        { 
          id: 1, 
          name: "나건하", 
          attendance: "출석", 
          warning: 0,
          assignments: {
            week1: { status: "제출완료", url: "https://github.com/na-geonha/web-assignment1" },
            week2: { status: "완료", url: "https://github.com/na-geonha/web-assignment2" },
            week3: { status: "수정요청", url: "https://github.com/na-geonha/web-assignment3" }
          }
        },
        { 
          id: 2, 
          name: "최윤호", 
          attendance: "출석", 
          warning: 0,
          assignments: {
            week1: { status: "제출완료", url: "https://github.com/choi-yunho/web-assignment1" },
            week2: { status: "제출완료", url: "https://github.com/choi-yunho/web-assignment2" },
            week3: { status: "제출완료", url: "https://github.com/choi-yunho/web-assignment3" }
          }
        }
      ]
    }
  ]);

  // 멘토 권한 확인 (어드민 또는 멘토 권한)
  const isMentor = user && (
    user.role === 'ROLE_ADMIN' || 
    user.role === 'ROLE_MENTOR' ||
    user.authorities?.some(auth => auth.authority === 'ROLE_ADMIN' || auth.authority === 'ROLE_MENTOR') ||
    user.roles?.includes('ROLE_ADMIN') ||
    user.roles?.includes('ROLE_MENTOR')
  );

  // 디버깅을 위한 사용자 정보 로그
  useEffect(() => {
    if (user) {
      console.log('Group - Current user info:', user);
      console.log('Group - User role:', user.role);
      console.log('Group - Is mentor (ROLE_ADMIN/ROLE_MENTOR):', isMentor);
      console.log('Group - User type:', user.role === 'ROLE_ADMIN' ? '관리자' : user.role === 'ROLE_MENTOR' ? '멘토' : '일반 사용자');
    }
  }, [user, isMentor]);

  // 주차별 과제 확장 상태 관리
  const [expandedWeeks, setExpandedWeeks] = useState({
    week1: false,
    week2: false,
    week3: false
  });

  // 과제 데이터 상태 관리
  const [assignments, setAssignments] = useState([
    {
      id: 1,
      title: "1주차 과제",
      description: "리버싱 기초 학습 및 실습",
      startDate: "2025-07-29T09:00:00",
      endDate: "2025-08-05T23:59:59",
      week: "week1"
    },
    {
      id: 2,
      title: "2주차 과제",
      description: "웹 해킹 기초 실습",
      startDate: "2025-08-06T09:00:00",
      endDate: "2025-08-12T23:59:59",
      week: "week2"
    },
    {
      id: 3,
      title: "3주차 과제",
      description: "고급 리버싱 기법 실습",
      startDate: "2025-08-13T09:00:00",
      endDate: "2025-08-19T23:59:59",
      week: "week3"
    }
  ]);

  // 과제 생성/수정 모달 상태 관리
  const [assignmentModal, setAssignmentModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' 또는 'edit'
    assignment: null
  });

  // 과제 폼 데이터 상태 관리
  const [assignmentFormData, setAssignmentFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: ""
  });

  // 주차별 과제 확장/축소 토글 함수
  const toggleWeekExpansion = (week) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [week]: !prev[week]
    }));
  };

  // 과제 생성 모달 열기 함수
  const openAssignmentModal = (mode = 'create', assignment = null) => {
    if (mode === 'edit' && assignment) {
      setAssignmentFormData({
        title: assignment.title,
        description: assignment.description,
        startDate: assignment.startDate.slice(0, 16), // datetime-local 형식에 맞게 변환
        endDate: assignment.endDate.slice(0, 16)
      });
    } else {
      setAssignmentFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: ""
      });
    }
    
    setAssignmentModal({
      isOpen: true,
      mode,
      assignment
    });
  };

  // 과제 모달 닫기 함수
  const closeAssignmentModal = () => {
    setAssignmentModal({
      isOpen: false,
      mode: 'create',
      assignment: null
    });
    setAssignmentFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: ""
    });
  };

  // 과제 생성 API 함수
  const createAssignment = async (assignmentData) => {
    try {
      if (!token) {
        throw new Error('토큰이 없습니다. 다시 로그인해주세요.');
      }
      const requestBody = {
        title: assignmentData.title,
        description: assignmentData.description,
        startDate: assignmentData.startDate,
        endDate: assignmentData.endDate
      };
      console.log('Creating assignment with data:', requestBody);
      const result = await api('POST', `/groups/${groupId}/assignments`, requestBody, token);
      console.log('Create assignment result:', result);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('과제 생성 오류:', error);
      return { success: false, error: { message: error.message || '과제 생성에 실패했습니다.' } };
    }
  };

  // 과제 삭제 API 함수
  const deleteAssignment = async (assignmentId) => {
    try {
      if (!token) {
        throw new Error('토큰이 없습니다. 다시 로그인해주세요.');
      }
      console.log('Deleting assignment with ID:', assignmentId);
      await api('DELETE', `/groups/${groupId}/assignments/${assignmentId}`, null, token);
      console.log('Delete assignment successful');
      return { success: true };
    } catch (error) {
      console.error('과제 삭제 오류:', error);
      return { success: false, error: { message: error.message || '과제 삭제에 실패했습니다.' } };
    }
  };

  // 과제 폼 제출 처리 함수
  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let result;
      
      if (assignmentModal.mode === 'create') {
        result = await createAssignment(assignmentFormData);
        if (result.success) {
          // 새로운 과제를 로컬 상태에 추가
          const newAssignment = {
            id: Date.now(), // 임시 ID
            ...assignmentFormData,
            week: `week${assignments.length + 1}`
          };
          setAssignments(prev => [...prev, newAssignment]);
        }
      }
      
      if (result.success) {
        closeAssignmentModal();
        alert(assignmentModal.mode === 'create' ? '과제가 생성되었습니다.' : '과제가 수정되었습니다.');
      } else {
        alert(result.error.message || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('과제 제출 오류:', error);
      alert('네트워크 오류가 발생했습니다.');
    }
  };

  // 과제 삭제 확인 함수
  const handleAssignmentDelete = async (assignmentId) => {
    if (!confirm('정말로 이 과제를 삭제하시겠습니까?')) return;
    
    try {
      const result = await deleteAssignment(assignmentId);
      if (result.success) {
        setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
        alert('과제가 삭제되었습니다.');
      } else {
        alert(result.error.message || '과제 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('과제 삭제 오류:', error);
      alert('네트워크 오류가 발생했습니다.');
    }
  };

  // 경고 모달 상태 관리
  const [warningModal, setWarningModal] = useState({
    isOpen: false,
    memberId: null,
    memberName: '',
    action: '' // 'add' 또는 'remove'
  });

  // 멘토 관리 모달 상태 관리
  const [mentorModal, setMentorModal] = useState({
    isOpen: false,
    activeTab: 'add' // 'add' 또는 'remove'
  });

  // 동아리 전체 부원 목록 (임시 데이터)
  const [clubMembers, setClubMembers] = useState([
    { id: 1, name: "나건하", email: "na@example.com", role: "member" },
    { id: 2, name: "최윤호", email: "choi@example.com", role: "member" },
    { id: 3, name: "김철수", email: "kim@example.com", role: "member" },
    { id: 4, name: "이영희", email: "lee@example.com", role: "member" },
    { id: 5, name: "박민수", email: "park@example.com", role: "member" },
    { id: 6, name: "정수진", email: "jung@example.com", role: "member" }
  ]);

  // 경고 모달 열기 함수
  const openWarningModal = (memberId, memberName, action) => {
    setWarningModal({
      isOpen: true,
      memberId,
      memberName,
      action
    });
  };

  // 경고 모달 닫기 함수
  const closeWarningModal = () => {
    setWarningModal({
      isOpen: false,
      memberId: null,
      memberName: '',
      action: ''
    });
  };

  // 멘토 관리 모달 열기 함수
  const openMentorModal = () => {
    setMentorModal({
      isOpen: true,
      activeTab: 'add'
    });
  };

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

  // 멤버 추가 함수
  const addMemberToStudy = (memberId) => {
    const memberToAdd = clubMembers.find(member => member.id === memberId);
    if (!memberToAdd) return;

    const newMember = {
      id: memberToAdd.id,
      name: memberToAdd.name,
      attendance: "출석",
      warning: 0,
      assignments: {
        week1: { status: "미제출", url: "" },
        week2: { status: "미제출", url: "" },
        week3: { status: "미제출", url: "" }
      }
    };

    setMyStudies(prevStudies => 
      prevStudies.map(study => 
        study.groupId === parseInt(groupId)
          ? {
              ...study,
              members: [...study.members, newMember]
            }
          : study
      )
    );
  };

  // 멤버 삭제 함수
  const removeMemberFromStudy = (memberId) => {
    setMyStudies(prevStudies => 
      prevStudies.map(study => 
        study.groupId === parseInt(groupId)
          ? {
              ...study,
              members: study.members.filter(member => member.id !== memberId)
            }
          : study
      )
    );
  };

  // 현재 스터디에 없는 멤버들만 필터링
  const getAvailableMembers = () => {
    const currentStudy = myStudies.find(study => study.groupId === parseInt(groupId));
    const currentMemberIds = currentStudy ? currentStudy.members.map(member => member.id) : [];
    return clubMembers.filter(member => !currentMemberIds.includes(member.id));
  };

  // 경고 부여/삭감 함수
  const handleWarningAction = () => {
    if (!warningModal.memberId) return;

    setMyStudies(prevStudies => 
      prevStudies.map(study => 
        study.groupId === parseInt(groupId)
          ? {
              ...study,
              members: study.members.map(member =>
                member.id === warningModal.memberId
                  ? {
                      ...member,
                      warning: warningModal.action === 'add' 
                        ? member.warning + 1 
                        : Math.max(0, member.warning - 1)
                    }
                  : member
              )
            }
          : study
      )
    );

    closeWarningModal();
  };

  // 과제 상태 변경 함수
  const handleAssignmentChange = (studyId, memberId, week, newStatus) => {
    setMyStudies(prevStudies => 
      prevStudies.map(study => 
        study.groupId === studyId 
          ? {
              ...study,
              members: study.members.map(member =>
                member.id === memberId
                  ? { 
                      ...member, 
                      assignments: {
                        ...member.assignments,
                        [week]: { ...member.assignments[week], status: newStatus }
                      }
                    }
                  : member
              )
            }
          : study
      )
    );
  };

  // 과제 URL 변경 함수
  const handleAssignmentUrlChange = (studyId, memberId, week, newUrl) => {
    setMyStudies(prevStudies => 
      prevStudies.map(study => 
        study.groupId === studyId 
          ? {
              ...study,
              members: study.members.map(member =>
                member.id === memberId
                  ? { 
                      ...member, 
                      assignments: {
                        ...member.assignments,
                        [week]: { ...member.assignments[week], url: newUrl }
                      }
                    }
                  : member
              )
            }
          : study
      )
    );
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 특정 그룹 페이지인지 확인
  if (groupId) {
    const selectedStudy = myStudies.find(study => study.groupId === parseInt(groupId));
    
    if (!selectedStudy) {
      return (
        <section className="contact">
          <h1 className="heading">Study Not Found</h1>
          <div className="studies-container">
                         <p>해당 스터디를 찾을 수 없습니다.</p>
                                                       <Link to="/groups" className="btn">Back to Groups</Link>
          </div>
        </section>
      );
    }

    return (
      <section className="contact">
        <div className="groups-container">
          <div className="group-detail">
                         {/* 뒤로가기 버튼 */}
             <div className="group-detail-back">
                             <Link to="/groups" className="group-back-btn">
                <i className="fas fa-arrow-left"></i> Back to Groups
              </Link>
             </div>
             
             {/* 스터디 제목 */}
             <div className="group-detail-title">
               <h1 className="heading">{selectedStudy.name}</h1>
             </div>
            
            
            
                         {/* 멤버 관리 테이블 */}
             <div className="group-members">
               <div className="group-members-header">
                 <h2 className="group-members-title">멤버 관리</h2>
                 {isMentor && (
                   <button 
                     className="group-mentor-manage-btn"
                     onClick={openMentorModal}
                   >
                     <i className="fas fa-users-cog"></i>
                     멤버 관리
                   </button>
                 )}
               </div>
               <div className="group-members-table-container">
                 <table className="group-members-table">
                   <thead>
                     <tr>
                       <th>이름</th>
                       <th>출석상태</th>
                       <th>경고횟수</th>
                       <th>관리</th>
                     </tr>
                   </thead>
                   <tbody>
                     {selectedStudy.members.map((member) => (
                       <tr key={member.id} className="group-member-row">
                         <td className="group-member-name">{member.name}</td>
                         <td className="member-attendance">
                           <span className={`status-badge ${member.attendance === '출석' ? 'present' : 'absent'}`}>
                             {member.attendance}
                           </span>
                         </td>
                         <td className="member-warning">
                           <span className={`warning-count ${member.warning > 0 ? 'has-warning' : 'no-warning'}`}>
                             {member.warning}회
                           </span>
                         </td>
                                                   <td className="member-actions">
                            <div className="action-buttons">
                              <button className="action-btn attendance-btn" title="출석체크">
                                <i className="fas fa-calendar-check"></i>
                              </button>
                              <button 
                                className="action-btn warning-btn" 
                                title="경고부여"
                                onClick={() => openWarningModal(member.id, member.name, 'add')}
                              >
                                <i className="fas fa-exclamation-triangle"></i>
                              </button>
                              {member.warning > 0 && (
                                <button 
                                  className="action-btn warning-remove-btn" 
                                  title="경고삭감"
                                  onClick={() => openWarningModal(member.id, member.name, 'remove')}
                                >
                                  <i className="fas fa-minus-circle"></i>
                                </button>
                              )}
                            </div>
                          </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>

             {/* 주차별 과제 제출 테이블 */}
             <div className="group-assignments">
               <div className="group-assignments-header">
                 <h2 className="group-assignments-title">과제</h2>
                 {isMentor && (
                   <button 
                     className="btn assignment-create-btn"
                     onClick={() => openAssignmentModal('create')}
                   >
                     <i className="fas fa-plus"></i> 과제 생성
                   </button>
                 )}
               </div>
               
               {/* 1주차 과제 */}
               <div className="week-assignment">
                 <button 
                   className={`week-button ${expandedWeeks.week1 ? 'expanded' : ''}`}
                   onClick={() => toggleWeekExpansion('week1')}
                 >
                   <div className="week-button-content">
                     <h3 className="week-title">1주차 과제</h3>
                     <div className="week-summary">
                       <span className="week-status">
                         {selectedStudy.members.filter(m => m.assignments.week1.status === '제출완료').length}/
                         {selectedStudy.members.length} 제출완료
                       </span>
                     </div>
                     <i className={`fas fa-chevron-${expandedWeeks.week1 ? 'up' : 'down'} week-icon`}></i>
                   </div>
                 </button>
                 
                 <div className={`week-content ${expandedWeeks.week1 ? 'expanded' : ''}`}>
                   {/* 과제 설명 섹션 */}
                   <div className="assignment-description">
                     <h4 className="assignment-description-title">과제 설명</h4>
                     <p className="assignment-description-text">
                       {assignments.find(a => a.week === 'week1')?.description || '과제 설명이 없습니다.'}
                     </p>
                     <div className="assignment-dates">
                       <span className="assignment-date">
                         <i className="fas fa-calendar-alt"></i>
                         시작: {assignments.find(a => a.week === 'week1')?.startDate ? 
                           new Date(assignments.find(a => a.week === 'week1').startDate).toLocaleString('ko-KR') : '미정'}
                       </span>
                       <span className="assignment-date">
                         <i className="fas fa-calendar-check"></i>
                         마감: {assignments.find(a => a.week === 'week1')?.endDate ? 
                           new Date(assignments.find(a => a.week === 'week1').endDate).toLocaleString('ko-KR') : '미정'}
                       </span>
                     </div>
                     {isMentor && (
                       <div className="assignment-actions">
                         <button 
                           className="btn btn-small btn-secondary"
                           onClick={() => openAssignmentModal('edit', assignments.find(a => a.week === 'week1'))}
                         >
                           <i className="fas fa-edit"></i> 수정
                         </button>
                         <button 
                           className="btn btn-small btn-danger"
                           onClick={() => handleAssignmentDelete(assignments.find(a => a.week === 'week1')?.id)}
                         >
                           <i className="fas fa-trash"></i> 삭제
                         </button>
                       </div>
                     )}
                   </div>
                   
                                      {/* 멤버 제출 현황 섹션 */}
                   <div className="assignment-submissions">
                     <h4 className="assignment-submissions-title">멤버 제출 현황</h4>
                     <div className="group-members-table-container">
                     <table className="group-members-table">
                       <thead>
                         <tr>
                           <th>이름</th>
                           <th>과제상태</th>
                           <th>과제주소</th>
                         </tr>
                       </thead>
                       <tbody>
                         {selectedStudy.members.map((member) => (
                           <tr key={member.id} className="group-member-row">
                             <td className="group-member-name">{member.name}</td>
                             <td className="member-assignment">
                               {isMentor ? (
                                 <select 
                                   className="assignment-select"
                                   value={member.assignments.week1.status}
                                   onChange={(e) => handleAssignmentChange(selectedStudy.groupId, member.id, 'week1', e.target.value)}
                                 >
                                   <option value="미제출">미제출</option>
                                   <option value="제출완료">제출완료</option>
                                   <option value="검토중">검토중</option>
                                   <option value="수정요청">수정요청</option>
                                   <option value="완료">완료</option>
                                 </select>
                               ) : (
                                 <span className={`status-badge ${member.assignments.week1.status === '제출완료' ? 'submitted' : 'not-submitted'}`}>
                                   {member.assignments.week1.status}
                                 </span>
                               )}
                             </td>
                             <td className="member-assignment-url">
                               {isMentor ? (
                                 <input
                                   type="text"
                                   className="assignment-url-input"
                                   placeholder="과제 주소 입력"
                                   value={member.assignments.week1.url || ""}
                                   onChange={(e) => handleAssignmentUrlChange(selectedStudy.groupId, member.id, 'week1', e.target.value)}
                                 />
                               ) : (
                                 member.assignments.week1.url ? (
                                   <a 
                                     href={member.assignments.week1.url} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="assignment-link"
                                   >
                                     <i className="fas fa-external-link-alt"></i> 보기
                                   </a>
                                 ) : (
                                   <span className="no-url">주소 없음</span>
                                 )
                               )}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                   </div>
                 </div>
               </div>

               {/* 2주차 과제 */}
               <div className="week-assignment">
                 <button 
                   className={`week-button ${expandedWeeks.week2 ? 'expanded' : ''}`}
                   onClick={() => toggleWeekExpansion('week2')}
                 >
                   <div className="week-button-content">
                     <h3 className="week-title">2주차 과제</h3>
                     <div className="week-summary">
                       <span className="week-status">
                         {selectedStudy.members.filter(m => m.assignments.week2.status === '제출완료').length}/
                         {selectedStudy.members.length} 제출완료
                       </span>
                     </div>
                     <i className={`fas fa-chevron-${expandedWeeks.week2 ? 'up' : 'down'} week-icon`}></i>
                   </div>
                 </button>
                 
                 <div className={`week-content ${expandedWeeks.week2 ? 'expanded' : ''}`}>
                   {/* 과제 설명 섹션 */}
                   <div className="assignment-description">
                     <h4 className="assignment-description-title">과제 설명</h4>
                     <p className="assignment-description-text">
                       {assignments.find(a => a.week === 'week2')?.description || '과제 설명이 없습니다.'}
                     </p>
                     <div className="assignment-dates">
                       <span className="assignment-date">
                         <i className="fas fa-calendar-alt"></i>
                         시작: {assignments.find(a => a.week === 'week2')?.startDate ? 
                           new Date(assignments.find(a => a.week === 'week2').startDate).toLocaleString('ko-KR') : '미정'}
                       </span>
                       <span className="assignment-date">
                         <i className="fas fa-calendar-check"></i>
                         마감: {assignments.find(a => a.week === 'week2')?.endDate ? 
                           new Date(assignments.find(a => a.week === 'week2').endDate).toLocaleString('ko-KR') : '미정'}
                       </span>
                     </div>
                     {isMentor && (
                       <div className="assignment-actions">
                         <button 
                           className="btn btn-small btn-secondary"
                           onClick={() => openAssignmentModal('edit', assignments.find(a => a.week === 'week2'))}
                         >
                           <i className="fas fa-edit"></i> 수정
                         </button>
                         <button 
                           className="btn btn-small btn-danger"
                           onClick={() => handleAssignmentDelete(assignments.find(a => a.week === 'week2')?.id)}
                         >
                           <i className="fas fa-trash"></i> 삭제
                         </button>
                       </div>
                     )}
                   </div>
                   
                   {/* 멤버 제출 현황 섹션 */}
                   <div className="assignment-submissions">
                     <h4 className="assignment-submissions-title">멤버 제출 현황</h4>
                     <div className="group-members-table-container">
                     <table className="group-members-table">
                       <thead>
                         <tr>
                           <th>이름</th>
                           <th>과제상태</th>
                           <th>과제주소</th>
                         </tr>
                       </thead>
                       <tbody>
                         {selectedStudy.members.map((member) => (
                           <tr key={member.id} className="group-member-row">
                             <td className="group-member-name">{member.name}</td>
                             <td className="member-assignment">
                               {isMentor ? (
                                 <select 
                                   className="assignment-select"
                                   value={member.assignments.week2.status}
                                   onChange={(e) => handleAssignmentChange(selectedStudy.groupId, member.id, 'week2', e.target.value)}
                                 >
                                   <option value="미제출">미제출</option>
                                   <option value="제출완료">제출완료</option>
                                   <option value="검토중">검토중</option>
                                   <option value="수정요청">수정요청</option>
                                   <option value="완료">완료</option>
                                 </select>
                               ) : (
                                 <span className={`status-badge ${member.assignments.week2.status === '제출완료' ? 'submitted' : 'not-submitted'}`}>
                                   {member.assignments.week2.status}
                                 </span>
                               )}
                             </td>
                             <td className="member-assignment-url">
                               {isMentor ? (
                                 <input
                                   type="text"
                                   className="assignment-url-input"
                                   placeholder="과제 주소 입력"
                                   value={member.assignments.week2.url || ""}
                                   onChange={(e) => handleAssignmentUrlChange(selectedStudy.groupId, member.id, 'week2', e.target.value)}
                                 />
                               ) : (
                                 member.assignments.week2.url ? (
                                   <a 
                                     href={member.assignments.week2.url} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="assignment-link"
                                   >
                                     <i className="fas fa-external-link-alt"></i> 보기
                                   </a>
                                 ) : (
                                   <span className="no-url">주소 없음</span>
                                 )
                               )}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                   </div>
                 </div>
               </div>

               {/* 3주차 과제 */}
               <div className="week-assignment">
                 <button 
                   className={`week-button ${expandedWeeks.week3 ? 'expanded' : ''}`}
                   onClick={() => toggleWeekExpansion('week3')}
                 >
                   <div className="week-button-content">
                     <h3 className="week-title">3주차 과제</h3>
                     <div className="week-summary">
                       <span className="week-status">
                         {selectedStudy.members.filter(m => m.assignments.week3.status === '제출완료').length}/
                         {selectedStudy.members.length} 제출완료
                       </span>
                     </div>
                     <i className={`fas fa-chevron-${expandedWeeks.week3 ? 'up' : 'down'} week-icon`}></i>
                   </div>
                 </button>
                 
                 <div className={`week-content ${expandedWeeks.week3 ? 'expanded' : ''}`}>
                   {/* 과제 설명 섹션 */}
                   <div className="assignment-description">
                     <h4 className="assignment-description-title">과제 설명</h4>
                     <p className="assignment-description-text">
                       {assignments.find(a => a.week === 'week3')?.description || '과제 설명이 없습니다.'}
                     </p>
                     <div className="assignment-dates">
                       <span className="assignment-date">
                         <i className="fas fa-calendar-alt"></i>
                         시작: {assignments.find(a => a.week === 'week3')?.startDate ? 
                           new Date(assignments.find(a => a.week === 'week3').startDate).toLocaleString('ko-KR') : '미정'}
                       </span>
                       <span className="assignment-date">
                         <i className="fas fa-calendar-check"></i>
                         마감: {assignments.find(a => a.week === 'week3')?.endDate ? 
                           new Date(assignments.find(a => a.week === 'week3').endDate).toLocaleString('ko-KR') : '미정'}
                       </span>
                     </div>
                     {isMentor && (
                       <div className="assignment-actions">
                         <button 
                           className="btn btn-small btn-secondary"
                           onClick={() => openAssignmentModal('edit', assignments.find(a => a.week === 'week3'))}
                         >
                           <i className="fas fa-edit"></i> 수정
                         </button>
                         <button 
                           className="btn btn-small btn-danger"
                           onClick={() => handleAssignmentDelete(assignments.find(a => a.week === 'week3')?.id)}
                         >
                           <i className="fas fa-trash"></i> 삭제
                         </button>
                       </div>
                     )}
                   </div>
                   
                   {/* 멤버 제출 현황 섹션 */}
                   <div className="assignment-submissions">
                     <h4 className="assignment-submissions-title">멤버 제출 현황</h4>
                     <div className="group-members-table-container">
                     <table className="group-members-table">
                       <thead>
                         <tr>
                           <th>이름</th>
                           <th>과제상태</th>
                           <th>과제주소</th>
                         </tr>
                       </thead>
                       <tbody>
                         {selectedStudy.members.map((member) => (
                           <tr key={member.id} className="group-member-row">
                             <td className="group-member-name">{member.name}</td>
                             <td className="member-assignment">
                               {isMentor ? (
                                 <select 
                                   className="assignment-select"
                                   value={member.assignments.week3.status}
                                   onChange={(e) => handleAssignmentChange(selectedStudy.groupId, member.id, 'week3', e.target.value)}
                                 >
                                   <option value="미제출">미제출</option>
                                   <option value="제출완료">제출완료</option>
                                   <option value="검토중">검토중</option>
                                   <option value="수정요청">수정요청</option>
                                   <option value="완료">완료</option>
                                 </select>
                               ) : (
                                 <span className={`status-badge ${member.assignments.week3.status === '제출완료' ? 'submitted' : 'not-submitted'}`}>
                                   {member.assignments.week3.status}
                                 </span>
                               )}
                             </td>
                             <td className="member-assignment-url">
                               {isMentor ? (
                                 <input
                                   type="text"
                                   className="assignment-url-input"
                                   placeholder="과제 주소 입력"
                                   value={member.assignments.week3.url || ""}
                                   onChange={(e) => handleAssignmentUrlChange(selectedStudy.groupId, member.id, 'week3', e.target.value)}
                                 />
                               ) : (
                                 member.assignments.week3.url ? (
                                   <a 
                                     href={member.assignments.week3.url} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="assignment-link"
                                   >
                                     <i className="fas fa-external-link-alt"></i> 보기
                                   </a>
                                 ) : (
                                   <span className="no-url">주소 없음</span>
                                 )
                               )}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                   </div>
                 </div>
               </div>
                          </div>
           </div>
         </div>

         {/* 경고 모달 */}
         {warningModal.isOpen && (
           <div className="group-modal-overlay" onClick={closeWarningModal}>
             <div className="group-modal-content" onClick={(e) => e.stopPropagation()}>
               <div className="group-modal-header">
                 <h3 className="group-modal-title">
                   {warningModal.action === 'add' ? '경고 부여' : '경고 삭감'}
                 </h3>
                 <button className="group-modal-close" onClick={closeWarningModal}>
                   <i className="fas fa-times"></i>
                 </button>
               </div>
               <div className="group-modal-body">
                 <p className="group-modal-message">
                   <strong>{warningModal.memberName}</strong>님에게{' '}
                   {warningModal.action === 'add' ? '경고를 부여' : '경고를 삭감'}하시겠습니까?
                 </p>
                 <div className="group-modal-actions">
                   <button 
                     className="group-modal-btn group-modal-btn-cancel" 
                     onClick={closeWarningModal}
                   >
                     취소
                   </button>
                   <button 
                     className={`group-modal-btn ${warningModal.action === 'add' ? 'group-modal-btn-warning' : 'group-modal-btn-success'}`}
                     onClick={handleWarningAction}
                   >
                     {warningModal.action === 'add' ? '경고 부여' : '경고 삭감'}
                   </button>
                 </div>
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
                   멤버 삭제
                 </button>
               </div>

               <div className="group-mentor-modal-body">
                 {mentorModal.activeTab === 'add' ? (
                   <div className="group-mentor-add-section">
                     <h4 className="group-mentor-section-title">동아리 부원 목록</h4>
                     <div className="group-mentor-member-list">
                       {getAvailableMembers().map((member) => (
                         <div key={member.id} className="group-mentor-member-item">
                           <div className="group-mentor-member-info">
                             <span className="group-mentor-member-name">{member.name}</span>
                             <span className="group-mentor-member-email">{member.email}</span>
                           </div>
                           <button 
                             className="group-mentor-add-btn"
                             onClick={() => addMemberToStudy(member.id)}
                           >
                             <i className="fas fa-plus"></i>
                           </button>
                         </div>
                       ))}
                       {getAvailableMembers().length === 0 && (
                         <p className="group-mentor-no-members">추가할 수 있는 부원이 없습니다.</p>
                       )}
                     </div>
                   </div>
                 ) : (
                   <div className="group-mentor-remove-section">
                     <h4 className="group-mentor-section-title">현재 스터디 멤버</h4>
                     <div className="group-mentor-member-list">
                       {selectedStudy.members.map((member) => (
                         <div key={member.id} className="group-mentor-member-item">
                           <div className="group-mentor-member-info">
                             <span className="group-mentor-member-name">{member.name}</span>
                             <span className="group-mentor-member-status">
                               경고: {member.warning}회
                             </span>
                           </div>
                           <button 
                             className="group-mentor-remove-btn"
                             onClick={() => removeMemberFromStudy(member.id)}
                           >
                             <i className="fas fa-minus"></i>
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             </div>
           </div>
         )}

         {/* 과제 생성/수정 모달 */}
         {assignmentModal.isOpen && (
           <div className="assignment-modal-overlay" onClick={closeAssignmentModal}>
             <div className="assignment-modal-content" onClick={(e) => e.stopPropagation()}>
               <div className="assignment-modal-header">
                 <h3 className="assignment-modal-title">
                   {assignmentModal.mode === 'create' ? '과제 생성' : '과제 수정'}
                 </h3>
                 <button className="assignment-modal-close" onClick={closeAssignmentModal}>
                   <i className="fas fa-times"></i>
                 </button>
               </div>
               
               <form onSubmit={handleAssignmentSubmit} className="assignment-modal-body">
                 <div className="form-group">
                   <label>과제 제목</label>
                   <input
                     type="text"
                     value={assignmentFormData.title}
                     onChange={(e) => setAssignmentFormData({...assignmentFormData, title: e.target.value})}
                     required
                     maxLength={200}
                     placeholder="과제 제목을 입력하세요"
                   />
                 </div>
                 
                 <div className="form-group">
                   <label>과제 설명</label>
                   <textarea
                     value={assignmentFormData.description}
                     onChange={(e) => setAssignmentFormData({...assignmentFormData, description: e.target.value})}
                     required
                     rows={4}
                     placeholder="과제 설명을 입력하세요"
                   />
                 </div>
                 
                 <div className="form-row">
                   <div className="form-group">
                     <label>시작 날짜</label>
                     <input
                       type="datetime-local"
                       value={assignmentFormData.startDate}
                       onChange={(e) => setAssignmentFormData({...assignmentFormData, startDate: e.target.value})}
                       required
                     />
                   </div>
                   
                   <div className="form-group">
                     <label>마감 날짜</label>
                     <input
                       type="datetime-local"
                       value={assignmentFormData.endDate}
                       onChange={(e) => setAssignmentFormData({...assignmentFormData, endDate: e.target.value})}
                       required
                     />
                   </div>
                 </div>
               </form>
               
               <div className="assignment-modal-footer">
                 <button className="btn btn-secondary" onClick={closeAssignmentModal}>
                   취소
                 </button>
                 <button className="btn btn-primary" onClick={handleAssignmentSubmit}>
                   {assignmentModal.mode === 'create' ? '생성' : '수정'}
                 </button>
               </div>
             </div>
           </div>
         )}
       </section>
     );
   }

  // groupId가 있으면 상세 페이지, 없으면 목록 페이지
  if (groupId) {
    const currentGroup = myStudies.find(study => study.groupId === parseInt(groupId));
    
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

    return (
      <section className="contact">
        <div className="group-detail-header">
          <button onClick={() => navigate('/groups')} className="btn btn-secondary">
            ← 목록으로 돌아가기
          </button>
          <h1 className="heading">{currentGroup.name} - 상세보기</h1>
        </div>

        <div className="group-detail-container">
          <div className="group-info-section">
            <h2>그룹 정보</h2>
            <div className="group-info">
              <p><strong>설명:</strong> {currentGroup.description}</p>
              <p><strong>생성일:</strong> {formatDate(currentGroup.createdAt)}</p>
              <p><strong>카테고리:</strong> {currentGroup.category.join(', ')}</p>
            </div>
          </div>

          <div className="datepicker-test-section">
            <h2>📅 React DatePicker 테스트</h2>
            
            <div className="datepicker-examples">
              <div className="datepicker-example">
                <h3>1. 기본 날짜 선택</h3>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  locale="ko"
                  dateFormat="yyyy/MM/dd"
                  placeholderText="날짜를 선택하세요"
                  className="datepicker-input"
                />
                <p>선택된 날짜: {selectedDate ? selectedDate.toLocaleDateString('ko-KR') : '없음'}</p>
              </div>

              <div className="datepicker-example">
                <h3>2. 날짜 범위 선택</h3>
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  locale="ko"
                  dateFormat="yyyy/MM/dd"
                  placeholderText="날짜 범위를 선택하세요"
                  className="datepicker-input"
                />
                <p>
                  시작일: {startDate ? startDate.toLocaleDateString('ko-KR') : '없음'} | 
                  종료일: {endDate ? endDate.toLocaleDateString('ko-KR') : '없음'}
                </p>
              </div>

              <div className="datepicker-example">
                <h3>3. 날짜 + 시간 선택</h3>
                <DatePicker
                  selected={selectedDateTime}
                  onChange={(date) => setSelectedDateTime(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy/MM/dd HH:mm"
                  locale="ko"
                  placeholderText="날짜와 시간을 선택하세요"
                  className="datepicker-input"
                />
                <p>선택된 날짜/시간: {selectedDateTime ? selectedDateTime.toLocaleString('ko-KR') : '없음'}</p>
              </div>

              <div className="datepicker-example">
                <h3>4. 제한된 날짜 선택 (오늘부터 30일 후까지)</h3>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  minDate={new Date()}
                  maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                  locale="ko"
                  dateFormat="yyyy/MM/dd"
                  placeholderText="오늘부터 30일 후까지 선택"
                  className="datepicker-input"
                />
              </div>
            </div>

            <div className="datepicker-actions">
              <button 
                onClick={() => {
                  setSelectedDate(null);
                  setDateRange([null, null]);
                  setSelectedDateTime(null);
                }} 
                className="btn btn-secondary"
              >
                모든 날짜 초기화
              </button>
            </div>
          </div>

          <div className="group-members-section">
            <h2>멤버 목록</h2>
            <div className="members-list">
              {currentGroup.members.map((member) => (
                <div key={member.id} className="member-card">
                  <h4>{member.name}</h4>
                  <p>출석: {member.attendance}</p>
                  <p>경고: {member.warning}회</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 전체 Groups 페이지
  return (
    <section className="contact">
      <h1 className="heading">Groups</h1>
      
      <div className="groups-container">
        <div className="groups-grid">
          {myStudies.map((study) => (
            <div key={study.groupId} className="group-card">
              <div className="group-header">
                <h3 className="group-title">{study.name}</h3>
                <span className="group-date">{formatDate(study.createdAt)}</span>
              </div>
              
                             <div className="group-content">
                 <div className="group-image">
                   <img 
                     src={study.GroupImage || "/images/default-study.svg"} 
                     alt={study.name}
                     onError={(e) => {
                       e.target.src = "/images/default-study.svg";
                     }}
                   />
                 </div>
                 <p className="group-description">{study.description}</p>
                 
                 <div className="group-categories">
                   {study.category.map((cat, index) => (
                     <span key={index} className="group-category-tag">
                       {cat}
                     </span>
                   ))}
                 </div>
               </div>
              
              <div className="group-footer">
                <Link 
                  to={`/groups/${study.groupId}`} 
                  className="btn group-more-btn"
                >
                  More
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
