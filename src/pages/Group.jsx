import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { useAuth } from "../components/auth"

export default function Group() {
  const { groupId } = useParams();
  const { user } = useAuth();
  
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

  // 멘토 권한 확인 (임시로 true로 설정)
  const isMentor = true;

  // 주차별 과제 확장 상태 관리
  const [expandedWeeks, setExpandedWeeks] = useState({
    week1: false,
    week2: false,
    week3: false
  });

  // 주차별 과제 확장/축소 토글 함수
  const toggleWeekExpansion = (week) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [week]: !prev[week]
    }));
  };

  // 경고 모달 상태 관리
  const [warningModal, setWarningModal] = useState({
    isOpen: false,
    memberId: null,
    memberName: '',
    action: '' // 'add' 또는 'remove'
  });

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
        <div className="studies-container">
          <div className="study-detail">
                         {/* 뒤로가기 버튼 */}
             <div className="study-detail-back">
                             <Link to="/groups" className="back-btn">
                <i className="fas fa-arrow-left"></i> Back to Groups
              </Link>
             </div>
             
             {/* 스터디 제목 */}
             <div className="study-detail-title">
               <h1 className="heading">{selectedStudy.name}</h1>
             </div>
            
            
            
                         {/* 멤버 관리 테이블 */}
             <div className="study-members">
               <h2 className="members-title">멤버 관리</h2>
               <div className="members-table-container">
                 <table className="members-table">
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
                       <tr key={member.id} className="member-row">
                         <td className="member-name">{member.name}</td>
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
             <div className="study-assignments">
               <h2 className="assignments-title">과제 제출 현황</h2>
               
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
                   <div className="members-table-container">
                     <table className="members-table">
                       <thead>
                         <tr>
                           <th>이름</th>
                           <th>과제상태</th>
                           <th>과제주소</th>
                         </tr>
                       </thead>
                       <tbody>
                         {selectedStudy.members.map((member) => (
                           <tr key={member.id} className="member-row">
                             <td className="member-name">{member.name}</td>
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
                   <div className="members-table-container">
                     <table className="members-table">
                       <thead>
                         <tr>
                           <th>이름</th>
                           <th>과제상태</th>
                           <th>과제주소</th>
                         </tr>
                       </thead>
                       <tbody>
                         {selectedStudy.members.map((member) => (
                           <tr key={member.id} className="member-row">
                             <td className="member-name">{member.name}</td>
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
                   <div className="members-table-container">
                     <table className="members-table">
                       <thead>
                         <tr>
                           <th>이름</th>
                           <th>과제상태</th>
                           <th>과제주소</th>
                         </tr>
                       </thead>
                       <tbody>
                         {selectedStudy.members.map((member) => (
                           <tr key={member.id} className="member-row">
                             <td className="member-name">{member.name}</td>
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

         {/* 경고 모달 */}
         {warningModal.isOpen && (
           <div className="modal-overlay" onClick={closeWarningModal}>
             <div className="modal-content" onClick={(e) => e.stopPropagation()}>
               <div className="modal-header">
                 <h3 className="modal-title">
                   {warningModal.action === 'add' ? '경고 부여' : '경고 삭감'}
                 </h3>
                 <button className="modal-close" onClick={closeWarningModal}>
                   <i className="fas fa-times"></i>
                 </button>
               </div>
               <div className="modal-body">
                 <p className="modal-message">
                   <strong>{warningModal.memberName}</strong>님에게{' '}
                   {warningModal.action === 'add' ? '경고를 부여' : '경고를 삭감'}하시겠습니까?
                 </p>
                 <div className="modal-actions">
                   <button 
                     className="modal-btn modal-btn-cancel" 
                     onClick={closeWarningModal}
                   >
                     취소
                   </button>
                   <button 
                     className={`modal-btn ${warningModal.action === 'add' ? 'modal-btn-warning' : 'modal-btn-success'}`}
                     onClick={handleWarningAction}
                   >
                     {warningModal.action === 'add' ? '경고 부여' : '경고 삭감'}
                   </button>
                 </div>
               </div>
             </div>
           </div>
         )}
       </section>
     );
   }

  // 전체 Groups 페이지
  return (
    <section className="contact">
      <h1 className="heading">Groups</h1>
      
      <div className="studies-container">
        <div className="studies-grid">
          {myStudies.map((study) => (
            <div key={study.groupId} className="study-card">
              <div className="study-header">
                <h3 className="study-title">{study.name}</h3>
                <span className="study-date">{formatDate(study.createdAt)}</span>
              </div>
              
                             <div className="study-content">
                 <div className="study-image">
                   <img 
                     src={study.GroupImage || "/images/default-study.svg"} 
                     alt={study.name}
                     onError={(e) => {
                       e.target.src = "/images/default-study.svg";
                     }}
                   />
                 </div>
                 <p className="study-description">{study.description}</p>
                 
                 <div className="study-categories">
                   {study.category.map((cat, index) => (
                     <span key={index} className="category-tag">
                       {cat}
                     </span>
                   ))}
                 </div>
               </div>
              
              <div className="study-footer">
                <Link 
                  to={`/groups/${study.groupId}`} 
                  className="btn more-btn"
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
