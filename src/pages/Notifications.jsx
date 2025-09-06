import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { useAuth } from "../components/auth"
import { Editor } from '@tinymce/tinymce-react'
import { api } from "../components/client"

export default function Notifications() {
  const { user, token, isInitialized } = useAuth();
  
  // 실제 사용자 권한 기반으로 어드민 여부 확인
  const isAdmin = user && user.role === 'ROLE_ADMIN';

  // 어드민 권한 확인 함수
  const checkAdminPermission = () => {
    if (!isAdmin) {
      alert('관리자(ROLE_ADMIN) 권한이 필요합니다.');
      return false;
    }
    return true;
  };

  // 작성자 권한 확인 함수
  const checkCreatorPermission = (notification) => {
    if (!user) return false;
    
    // 관리자는 모든 공지사항 수정/삭제 가능
    if (isAdmin) return true;
    
    // creator가 null인 경우 관리자만 수정/삭제 가능
    if (!notification.userId && !notification.creator) {
      alert('작성자 정보가 없는 공지사항은 관리자만 수정/삭제할 수 있습니다.');
      return false;
    }
    
    // 일반 사용자는 작성자 본인만 수정/삭제 가능
    const isCreator = notification.userId === user.userId || 
                     notification.creator?.userId === user.userId;
    
    if (!isCreator) {
      alert('작성자 본인만 수정/삭제할 수 있습니다.');
      return false;
    }
    
    return true;
  };
  
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState("all")
  
  // 모달 상태 관리
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("")
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

  // API 호출 함수들
  const getAuthToken = () => {
    if (!isInitialized) {
      throw new Error('인증이 아직 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.');
    }
    if (!token) {
      throw new Error('토큰이 없습니다. 다시 로그인해주세요.');
    }
    return token
  }

  // 공지사항 생성 API
  const createAnnouncement = async (announcementData) => {
    try {
      const token = getAuthToken()
      
      // 데이터 검증
      if (!announcementData.title || announcementData.title.trim() === '') {
        throw new Error('공지사항 제목은 필수입니다.');
      }
      if (!announcementData.content || announcementData.content.trim() === '') {
        throw new Error('공지사항 내용은 필수입니다.');
      }
      if (!announcementData.type) {
        throw new Error('공지 타입은 필수입니다.');
      }
      
      // API 명세서에 맞는 body 구조
      const requestBody = {
        title: announcementData.title.trim(),
        content: announcementData.content.trim(),
        type: announcementData.type
      }
      const result = await api('POST', '/users/create-announcement', requestBody, token)
      return { success: true, data: result.data }
    } catch (error) {
      return { success: false, error: { message: error.message || '네트워크 오류가 발생했습니다.' } }
    }
  }

  // 공지사항 목록 조회 API (GET)
  const fetchAnnouncements = async () => {
    try {
      const token = getAuthToken()
      const result = await api('GET', '/users/announcements', null, token)
      return { success: true, data: result.data }
    } catch (error) {
      return { success: false, error: { message: error.message || '공지사항 목록을 불러오는데 실패했습니다.' } }
    }
  }

  // 공지사항 상세 조회 API (GET)
  const fetchAnnouncementDetail = async (announcementId) => {
    try {
      const token = getAuthToken()
      const result = await api('GET', `/users/announcements/${announcementId}`, null, token)
      return { success: true, data: result.data }
    } catch (error) {
      return { success: false, error: { message: error.message || '공지사항 상세 정보를 불러오는데 실패했습니다.' } }
    }
  }

  // 공지사항 수정 API (PUT)
  const updateAnnouncement = async (announcementId, announcementData) => {
    try {
      const token = getAuthToken()
      // API 명세서에 맞는 body 구조
      const requestBody = {
        title: announcementData.title.trim(),
        content: announcementData.content.trim(),
        type: announcementData.type
      }
      const result = await api('PUT', `/users/announcements/${announcementId}`, requestBody, token)
      return { success: true, data: result.data }
    } catch (error) {
      return { success: false, error: { message: error.message || '네트워크 오류가 발생했습니다.' } }
    }
  }

  // 공지사항 삭제 API (DELETE)
  const deleteAnnouncement = async (announcementId) => {
    try {
      const token = getAuthToken()
      await api('DELETE', `/users/announcements/${announcementId}`, null, token)
      return { success: true }
    } catch (error) {
      return { success: false, error: { message: error.message || '공지사항 삭제에 실패했습니다.' } }
    }
  }
  
  // TinyMCE 설정
  const tinymceConfig = {
    height: 400,
    language: 'ko_KR',
    menubar: false,
    plugins: 'advlist autolink lists link image charmap anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
    toolbar: 'undo redo | formatselect fontselect fontsizeselect | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat code',
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
    placeholder: '공지사항 내용을 입력하세요...',
    branding: false,
    elementpath: false,
    resize: false,
    statusbar: false,
    content_css: isDarkMode ? 'dark' : 'default',
    // 링크 관련 설정
    link_list: [
      {title: 'My page 1', value: 'https://www.tiny.cloud'},
      {title: 'My page 2', value: 'https://about.tiny.cloud'}
    ],
    link_title: false,
    link_quicklink: true,
    link_assume_external_targets: true,
    link_default_target: '_blank'
  }
  

  // 드래그 이벤트 핸들러
  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    // 약간의 지연을 두어 클릭 이벤트와 충돌 방지
    setTimeout(() => setIsDragging(false), 100)
  }

  // 공지사항 데이터 상태 관리
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 공지사항 목록 조회
  useEffect(() => {
    // 인증이 초기화된 후에만 API 호출
    if (!isInitialized) {
      return;
    }

    const loadAnnouncements = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const result = await fetchAnnouncements()
        
        if (result.success) {
          setNotifications(result.data)
        } else {
          setError(result.error.message)
          // 에러 발생 시 빈 배열로 설정
          setNotifications([])
        }
      } catch (error) {
        setError('공지사항을 불러오는 중 오류가 발생했습니다.')
        setNotifications([])
      }
      
      setLoading(false)
    }
    
    loadAnnouncements()
  }, [isInitialized])


  //공지사항 정렬 
  const filteredNotifications = notifications
    .filter(notification => {
      const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notification.content.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || notification.type === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {

      const idA = a.announcementId || 0;
      const idB = b.announcementId || 0;
      return idB - idA;
    })

  // 페이지네이션
  const itemsPerPage = 5
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentNotifications = filteredNotifications.slice(startIndex, endIndex)

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
  }

  // 모달 관련 핸들러들
  const handleCreate = () => {
    if (!checkAdminPermission()) return;
    setModalType("create")
    setFormData({ title: "", content: "", type: "NOTICE" })
    setShowModal(true)
  }

  const handleEdit = (notification) => {
    if (!checkCreatorPermission(notification)) return;
    setModalType("edit")
    setSelectedNotification(notification)
    setFormData({
      title: notification.title,
      content: notification.content,
      type: notification.type
    })
    setShowModal(true)
  }

  const handleDelete = (notification) => {
    if (!checkCreatorPermission(notification)) return;
    setModalType("delete")
    setSelectedNotification(notification)
    setShowModal(true)
  }

  // 모달 닫기 핸들러 (드래그 중에는 닫히지 않음)
  const handleModalClose = () => {
    if (isDragging) return // 드래그 중에는 닫히지 않음
    
    setShowModal(false)
    setModalType("")
    setSelectedNotification(null)
    setFormData({ title: "", content: "", type: "NOTICE" })
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    try {
      let result
      
      if (modalType === "create") {
        result = await createAnnouncement(formData)
      } else if (modalType === "edit") {
        // ID 필드 확인
        const notificationId = selectedNotification.announcementId || selectedNotification.id || selectedNotification.noticeId
        if (!notificationId) {
          alert('공지사항 ID를 찾을 수 없습니다.')
          return
        }
        
        result = await updateAnnouncement(notificationId, formData)
      }
      
      if (result.success) {
        handleModalClose()
        // 공지사항 목록 새로고침
        const refreshResult = await fetchAnnouncements()
        if (refreshResult.success) {
          setNotifications(refreshResult.data)
        }
      } else {
        alert(result.error.message || "오류가 발생했습니다.")
      }
    } catch (error) {
      alert("네트워크 오류가 발생했습니다.")
    }
  }

  const handleConfirmDelete = async () => {
    try {
      // ID 필드 확인
      const notificationId = selectedNotification.announcementId || selectedNotification.id || selectedNotification.noticeId
      if (!notificationId) {
        alert('공지사항 ID를 찾을 수 없습니다.')
        return
      }
      
      const result = await deleteAnnouncement(notificationId)
      
      if (result.success) {
        handleModalClose()
        // 공지사항 목록 새로고침
        const refreshResult = await fetchAnnouncements()
        if (refreshResult.success) {
          setNotifications(refreshResult.data)
        }
      } else {
        alert(result.error.message || "삭제에 실패했습니다.")
      }
    } catch (error) {
      alert("네트워크 오류가 발생했습니다.")
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
          {loading ? (
            <div className="loading-message">
              <i className="fas fa-spinner fa-spin"></i>
              공지사항을 불러오는 중...
            </div>
          ) : error ? (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          ) : currentNotifications.length === 0 ? (
            <div className="empty-message">
              <i className="fas fa-inbox"></i>
              공지사항이 없습니다.
            </div>
          ) : (
            <div className="notifications-list">
              {currentNotifications.map((notification) => {
                return (
                  <article 
                    key={notification.announcementId || notification.id || notification.noticeId} 
                    className={`notification-item ${getTypeClass(notification.type)}`}
                    onClick={() => handleNotificationClick(notification)}
                    style={{ cursor: 'pointer' }}
                  >
                <div className="notification-header">
                  <div className="notification-meta">
                    <span className={`notification-badge ${getTypeClass(notification.type)}`}>
                      {getTypeLabel(notification.type)}
                    </span>
                                         <span className="notification-date">{formatDate(notification.createdAt)}</span>
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
                <h3 className="notification-title">{notification.title}</h3>
              </article>
                )
              })}
            </div>
          )}
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
                  key={page}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
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
        <div className="notification-modal-overlay">
          <div className={`notification-modal-content ${modalType === "delete" ? "delete-modal" : ""} ${modalType === "view" ? "view-modal" : ""}`} onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <h3>
                {modalType === "create" && "공지사항 등록"}
                {modalType === "edit" && "공지사항 수정"}
                {modalType === "delete" && "공지사항 삭제"}
              </h3>
              <button className="notification-modal-close" onClick={handleModalClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {modalType === "delete" ? (
              <div className="notification-modal-body">
                <p>정말로 "{selectedNotification?.title}" 공지사항을 삭제하시겠습니까?</p>
                <p>이 작업은 되돌릴 수 없습니다.</p>
              </div>
            ) : modalType === "view" ? (
              <div className="notification-modal-body">
                <div className="notification-detail">
                  <div className="detail-header">
                    <span className={`detail-badge ${getTypeClass(selectedNotification?.type)}`}>
                      {getTypeLabel(selectedNotification?.type)}
                    </span>
                                         <span className="detail-date">
                       {formatDate(selectedNotification?.createdAt)}
                     </span>
                  </div>
                  
                  <h2 className="detail-title">{selectedNotification?.title}</h2>
                  <div className="detail-content" dangerouslySetInnerHTML={{ __html: selectedNotification?.content }}></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="notification-modal-body">
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

            <div className="notification-modal-footer">
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