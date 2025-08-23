import { Link, useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { useAuth } from "../components/auth"
import { Editor } from '@tinymce/tinymce-react'

export default function Notifications() {
  const { user } = useAuth();
  const { notificationId } = useParams();
  const navigate = useNavigate();
  
  // 임시로 어드민 권한 부여 (테스트용)
  const isAdmin = true; // 또는 user?.role === 'admin' || true
  
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState("all")
  
  // 모달 상태 관리
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("") // "create", "edit", "delete"
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "NOTICE"
  })

  // 드래그 상태 관리
  const [isDragging, setIsDragging] = useState(false)

  // 현재 테마 감지
  const isDarkMode = document.body.classList.contains('dark')
  
  // 네브바 상태 감지
  const [isNavbarOpen, setIsNavbarOpen] = useState(false)
  
  // URL 파라미터에 따른 모달 자동 열기
  useEffect(() => {
    if (notificationId) {
      const notification = notifications.find(n => n.announcement_id === parseInt(notificationId));
      if (notification) {
        // URL 쿼리 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        
        if (mode === 'edit') {
          setModalType("edit");
          setFormData({
            title: notification.title,
            content: notification.content,
            type: notification.type
          });
        } else if (mode === 'delete') {
          setModalType("delete");
        } else {
          setModalType("view");
        }
        
        setSelectedNotification(notification);
        setShowModal(true);
      } else {
        // 해당 ID의 공지사항이 없으면 메인 페이지로 리다이렉트
        navigate('/notifications');
      }
    }
  }, [notificationId, navigate]);

  // 네브바 상태 변화 감지
  useEffect(() => {
    const checkNavbarState = () => {
      const isActive = document.body.classList.contains('active')
      setIsNavbarOpen(isActive)
    }
    
    // 초기 상태 확인
    checkNavbarState()
    
    // DOM 변화 감지
    const observer = new MutationObserver(checkNavbarState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])
  
  // TinyMCE 설정
  const tinymceConfig = {
    height: 400,
    language: 'ko_KR',
    menubar: false,
    plugins: [
      'advlist autolink lists link image charmap print preview anchor',
      'searchreplace visualblocks code fullscreen',
      'insertdatetime media table paste code help wordcount'
    ],
    toolbar: 'undo redo | formatselect | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat code',
    content_style: `body { 
      font-family: "Noto Sans KR", "Malgun Gothic", sans-serif; 
      font-size: 14px; 
      line-height: 1.6; 
      background-color: ${isDarkMode ? '#2d3748' : '#ffffff'};
      color: ${isDarkMode ? '#ffffff' : '#000000'};
    }`,
    placeholder: '공지사항 내용을 입력하세요...',
    branding: false,
    elementpath: false,
    resize: false,
    statusbar: false,
    skin: isDarkMode ? 'oxide-dark' : 'oxide',
    content_css: isDarkMode ? 'dark' : 'default'
  }

  // 드래그 이벤트 핸들러
  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    // 약간의 지연을 두어 클릭 이벤트와 충돌 방지
    setTimeout(() => setIsDragging(false), 100)
  }

  // 공지사항 데이터 (DB 스키마에 맞춤)
  const notifications = [
    {
      announcement_id: 1,
      type: "COMPETITION",
      title: "MSG CTF 대회 안내",
      content: "OO월 OO일에 MSG CTF 대회가 개최됩니다.",
      created_at: "2024-01-15T00:00:00.000Z",
      updated_at: "2024-01-15T00:00:00.000Z"
    },
    {
      announcement_id: 2,
      type: "EVENT",
      title: "학기말 프로젝트 발표회",
      content: "학기말 프로젝트 발표회가 예정되어 있습니다. 모든 학생들의 참여를 바랍니다.",
      created_at: "2024-01-14T00:00:00.000Z",
      updated_at: "2024-01-14T00:00:00.000Z"
    },
    {
      announcement_id: 3,
      type: "GENERAL",
      title: "앱 버전 2.1.0 출시",
      content: "버그 수정 및 성능 개선이 포함된 새로운 버전이 출시되었습니다. 앱스토어에서 업데이트를 진행해주세요.",
      created_at: "2024-01-13T00:00:00.000Z",
      updated_at: "2024-01-13T00:00:00.000Z"
    },
    {
      announcement_id: 4,
      type: "NOTICE",
      title: "동아리 운영 방침",
      content: "동아리 운여에 있어서 가이드라인이 업데이트되었습니다. 모든 사용자분들의 참고 부탁드립니다.",
      created_at: "2024-01-12T00:00:00.000Z",
      updated_at: "2024-01-12T00:00:00.000Z"
    },
    {
      announcement_id: 5,
      type: "COMPETITION",
      title: "해킹 대회 참가자 모집",
      content: "보안에 관심이 있는 학생들을 위한 해킹 대회가 개최됩니다. 신청 기간은 한 달간입니다.",
      created_at: "2024-01-11T00:00:00.000Z",
      updated_at: "2024-01-11T00:00:00.000Z"
    },
    {
      announcement_id: 6,
      type: "EVENT",
      title: "웹사이트 디자인 개선",
      content: "사용자 경험 향상을 위해 웹사이트 디자인이 개선되었습니다. 더욱 직관적이고 편리한 인터페이스를 제공합니다.",
      created_at: "2024-01-10T00:00:00.000Z",
      updated_at: "2024-01-10T00:00:00.000Z"
    },
    {
      announcement_id: 7,
      type: "EVENT",
      title: "웹사이트 디자인 개선1",
      content: "사용자 경험 향상을 위해 웹사이트 디자인이 개선되었습니다. 더욱 직관적이고 편리한 인터페이스를 제공합니다.",
      created_at: "2024-01-10T00:00:00.000Z",
      updated_at: "2024-01-10T00:00:00.000Z"
    },
    {
      announcement_id: 8,
      type: "EVENT",
      title: "웹사이트 디자인 개선2",
      content: "사용자 경험 향상을 위해 웹사이트 디자인이 개선되었습니다. 더욱 직관적이고 편리한 인터페이스를 제공합니다.",
      created_at: "2024-01-10T00:00:00.000Z",
      updated_at: "2024-01-10T00:00:00.000Z"
    },
    {
      announcement_id: 9,
      type: "EVENT",
      title: "웹사이트 디자인 개선3",
      content: "사용자 경험 향상을 위해 웹사이트 디자인이 개선되었습니다. 더욱 직관적이고 편리한 인터페이스를 제공합니다.",
      created_at: "2024-01-10T00:00:00.000Z",
      updated_at: "2024-01-10T00:00:00.000Z"
    },
    {
      announcement_id: 10,
      type: "EVENT",
      title: "웹사이트 디자인 개선4",
      content: "사용자 경험 향상을 위해 웹사이트 디자인이 개선되었습니다. 더욱 직관적이고 편리한 인터페이스를 제공합니다.",
      created_at: "2024-01-10T00:00:00.000Z",
      updated_at: "2024-01-10T00:00:00.000Z"
    },
    {
      announcement_id: 11,
      type: "EVENT",
      title: "웹사이트 디자인 개선5",
      content: "사용자 경험 향상을 위해 웹사이트 디자인이 개선되었습니다. 더욱 직관적이고 편리한 인터페이스를 제공합니다.",
      created_at: "2024-01-10T00:00:00.000Z",
      updated_at: "2024-01-10T00:00:00.000Z"
    },
    {
      announcement_id: 12,
      type: "EVENT",
      title: "웹사이트 디자인 개선6",
      content: "사용자 경험 향상을 위해 웹사이트 디자인이 개선되었습니다. 더욱 직관적이고 편리한 인터페이스를 제공합니다.",
      created_at: "2024-01-10T00:00:00.000Z",
      updated_at: "2024-01-10T00:00:00.000Z"
    }
  ]

  // 카테고리별 필터링
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        notification.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || notification.type === selectedCategory
    return matchesSearch && matchesCategory
  })

  // 페이지네이션
  const itemsPerPage = 5
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentNotifications = filteredNotifications.slice(startIndex, endIndex)

  // 현재 페이지가 총 페이지 수를 초과하는 경우 1페이지로 리셋
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // 카테고리 선택 핸들러
  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  // 공지사항 클릭 핸들러
  const handleNotificationClick = (notification) => {
    setModalType("view")
    setSelectedNotification(notification)
    setShowModal(true)
    
    // URL 업데이트
    navigate(`/notifications/${notification.announcement_id}`);
  }

  // 모달 관련 핸들러들
  const handleCreate = () => {
    setModalType("create")
    setFormData({ title: "", content: "", type: "NOTICE" })
    setShowModal(true)
  }

  const handleEdit = (notification) => {
    setModalType("edit")
    setSelectedNotification(notification)
    setFormData({
      title: notification.title,
      content: notification.content,
      type: notification.type
    })
    setShowModal(true)
    
    // URL 업데이트 (수정 모드)
    navigate(`/notifications/${notification.announcement_id}?mode=edit`);
  }

  const handleDelete = (notification) => {
    setModalType("delete")
    setSelectedNotification(notification)
    setShowModal(true)
    
    // URL 업데이트 (삭제 모드)
    navigate(`/notifications/${notification.announcement_id}?mode=delete`);
  }

  // 모달 닫기 핸들러 (드래그 중에는 닫히지 않음)
  const handleModalClose = () => {
    if (isDragging) return // 드래그 중에는 닫히지 않음
    
    setShowModal(false)
    setModalType("")
    setSelectedNotification(null)
    setFormData({ title: "", content: "", type: "NOTICE" })
    
    // URL이 /notifications/{id} 형태라면 메인 페이지로 이동
    if (notificationId) {
      navigate('/notifications');
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (modalType === "create") {
        // TODO: API 호출로 공지사항 생성
        console.log("공지사항 생성:", formData)
      } else if (modalType === "edit") {
        // TODO: API 호출로 공지사항 수정
        console.log("공지사항 수정:", selectedNotification.announcement_id, formData)
      }
      
      handleModalClose()
      // TODO: 공지사항 목록 새로고침
    } catch (error) {
      console.error("오류 발생:", error)
    }
  }

  const handleConfirmDelete = async () => {
    try {
      // TODO: API 호출로 공지사항 삭제
      console.log("공지사항 삭제:", selectedNotification.announcement_id)
      
      handleModalClose()
      // TODO: 공지사항 목록 새로고침
    } catch (error) {
      console.error("삭제 오류:", error)
    }
  }

  const getTypeLabel = (type) => {
    switch(type) {
      case 'COMPETITION': return '대회'
      case 'EVENT': return '행사'
      case 'NOTICE': return '알림'
      default: return '일반'
    }
  }

  const getTypeClass = (type) => {
    switch(type) {
      case 'COMPETITION': return 'competition'
      case 'EVENT': return 'event'
      case 'NOTICE': return 'notice'
      default: return 'general'
    }
  }

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  return (
    <>
      <section className="reviews">
        <h1 className="heading">공지사항</h1>
        
        {/* 검색 섹션 */}
        <div className="search-section">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="공지사항을 검색하세요..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-submit">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>

        {/* 카테고리 필터 버튼 */}
        <div className="category-filter">
          <button 
            className={`category-btn ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => handleCategorySelect("all")}
          >
            전체
          </button>
          <button 
            className={`category-btn ${selectedCategory === "COMPETITION" ? "active" : ""}`}
            onClick={() => handleCategorySelect("COMPETITION")}
          >
            대회
          </button>
          <button 
            className={`category-btn ${selectedCategory === "EVENT" ? "active" : ""}`}
            onClick={() => handleCategorySelect("EVENT")}
          >
            행사
          </button>
          <button 
            className={`category-btn ${selectedCategory === "NOTICE" ? "active" : ""}`}
            onClick={() => handleCategorySelect("NOTICE")}
          >
            알림
          </button>
          <button 
            className={`category-btn ${selectedCategory === "GENERAL" ? "active" : ""}`}
            onClick={() => handleCategorySelect("GENERAL")}
          >
            일반
          </button>
        </div>

        {/* 공지사항 목록 */}
        <div className="notifications-section">
          <div className="notifications-list">
                         {currentNotifications.map((notification) => (
               <article 
                 key={notification.announcement_id} 
                 className={`notification-item ${getTypeClass(notification.type)}`}
                 style={{ cursor: 'pointer' }}
                 onClick={() => handleNotificationClick(notification)}
               >
                <div className="notification-header">
                  <div className="notification-meta">
                    <span className={`notification-badge ${getTypeClass(notification.type)}`}>
                      {getTypeLabel(notification.type)}
                    </span>
                    <span className="notification-date">{formatDate(notification.created_at)}</span>
                  </div>
                  
                  {/* 어드민 전용 수정/삭제 버튼 */}
                  {isAdmin && (
                    <div className="admin-actions">
                      <button 
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(notification);
                        }}
                        title="수정"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification);
                        }}
                        title="삭제"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
                                 <h3 className="notification-title">
                   <Link 
                     to={`/notifications/${notification.announcement_id}`}
                     className="notification-link"
                     onClick={(e) => {
                       e.stopPropagation();
                       handleNotificationClick(notification);
                     }}
                   >
                     {notification.title}
                   </Link>
                 </h3>
              </article>
            ))}
          </div>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="pagination-section">
            <div className="pagination">
              <button 
                className="page-btn prev"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={`page-${page}`}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                  disabled={currentPage === page}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className="page-btn next"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            
            {/* 어드민 전용 등록 버튼 */}
            {isAdmin && (
              <button className="btn admin-btn" onClick={handleCreate}>
                <i className="fas fa-plus"></i> 공지사항 등록
              </button>
            )}
          </div>
        )}

        {/* 페이지가 1개 이하일 때도 등록 버튼 표시 */}
        {totalPages <= 1 && isAdmin && (
          <div className="pagination-section">
            <div className="pagination">
              <button className="btn admin-btn" onClick={handleCreate}>
                <i className="fas fa-plus"></i> 공지사항 등록
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 모달 */}
      {showModal && (
        <div className="modal-overlay">
          <div className={`modal-content ${modalType === "delete" ? "delete-modal" : ""} ${modalType === "view" ? "view-modal" : ""}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === "create" && "공지사항 등록"}
                {modalType === "edit" && "공지사항 수정"}
                {modalType === "delete" && "공지사항 삭제"}
              </h3>
              <button className="modal-close" onClick={handleModalClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {modalType === "delete" ? (
              <div className="modal-body">
                <p>정말로 "{selectedNotification?.title}" 공지사항을 삭제하시겠습니까?</p>
                <p>이 작업은 되돌릴 수 없습니다.</p>
              </div>
            ) : modalType === "view" ? (
              <div className="modal-body">
                <div className="notification-detail">
                  <div className="detail-header">
                    <span className={`detail-badge ${getTypeClass(selectedNotification?.type)}`}>
                      {getTypeLabel(selectedNotification?.type)}
                    </span>
                    <span className="detail-date">
                      {formatDate(selectedNotification?.created_at)}
                    </span>
                  </div>
                  
                  <h2 className="detail-title">{selectedNotification?.title}</h2>
                  <div className="detail-content" dangerouslySetInnerHTML={{ __html: selectedNotification?.content }}></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="modal-body">
                <div className="form-group">
                  <label>제목</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    maxLength={200}
                  />
                </div>
                
                <div className="form-group">
                  <label>내용</label>
                  <div className="tinymce-editor-container">
                    <Editor
                      apiKey="r8m7hvh9qbys442qwv4rtviyoy86dqrshoqtwq18z96lol4w"
                      init={tinymceConfig}
                      value={formData.content}
                      onEditorChange={(content) => setFormData({...formData, content: content})}
                      onMouseDown={handleDragStart}
                      onMouseUp={handleDragEnd}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>유형</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="NOTICE">알림</option>
                    <option value="EVENT">행사</option>
                    <option value="COMPETITION">대회</option>
                    <option value="GENERAL">일반</option>
                  </select>
                </div>
              </form>
            )}

            <div className="modal-footer">
              {modalType === "delete" ? (
                <>
                  <button className="btn btn-secondary" onClick={handleModalClose}>
                    취소
                  </button>
                  <button className="btn btn-danger" onClick={handleConfirmDelete}>
                    삭제
                  </button>
                </>
              ) : modalType === "view" ? (
                <button className="btn btn-secondary" onClick={handleModalClose}>
                  닫기
                </button>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={handleModalClose}>
                    취소
                  </button>
                  <button className="btn btn-primary" onClick={handleFormSubmit}>
                    {modalType === "create" ? "등록" : "수정"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
