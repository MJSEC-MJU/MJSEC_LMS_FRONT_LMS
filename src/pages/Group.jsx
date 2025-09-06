    import React, { useState, useEffect } from 'react';
    import { Link, useParams, useNavigate } from "react-router-dom"
    import { useAuth } from "../components/auth"
    import { api } from "../components/client"
    import DatePicker from 'react-datepicker'
    import { registerLocale } from 'react-datepicker'
    import ko from 'date-fns/locale/ko'
    import 'react-datepicker/dist/react-datepicker.css'
    import { Editor } from '@tinymce/tinymce-react'

    // 한국어 로케일 등록
    registerLocale('ko', ko);

    export default function Group() {
    const { groupId: groupIdParam } = useParams();
    const groupId = parseInt(groupIdParam, 10);
    const { user, token } = useAuth();
    const navigate = useNavigate();
    
    // react-datepicker 테스트용 상태
    const [selectedDate, setSelectedDate] = useState(null);
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [selectedDateTime, setSelectedDateTime] = useState(null);
    
    // 수강중인 과목 데이터 (하드코딩 제거하고 샘플 1개만 유지)
    const [myStudies, setMyStudies] = useState([
        {
        groupId: 1, // DB의 study_group.study_id와 일치
        name: "샘플 그룹",
        createdAt: new Date().toISOString(),
        description: "샘플 스터디입니다.",
        category: ["WEB"],
        GroupImage: null,
        createdById: 1,
        members: []
        }
    ]);





    // 디버깅을 위한 사용자 정보 로그
    useEffect(() => {
        if (user) {
        console.log('Group - Current user info:', user);
        console.log('Group - Current groupId:', groupId);
        }
    }, [user, groupId]);

    // 과제 목록 조회
    useEffect(() => {
        if (groupId && token) {
        fetchAssignments();
        }
    }, [groupId, token]);

    // 주차별 과제 확장 상태 관리
    const [expandedWeeks, setExpandedWeeks] = useState({
        week1: false,
        week2: false,
        week3: false
    });

    // 과제 데이터 상태 관리
    const [assignments, setAssignments] = useState([]);
    
    // 마감 시간이 지났는지 확인하는 함수
    const isDeadlinePassed = (endDate) => {
        if (!endDate) return false;
        const now = new Date();
        const deadline = new Date(endDate);
        return now > deadline;
    };
    
    // 과제 목록 조회 함수
    const fetchAssignments = async () => {
        try {
        if (!token || !groupId || isNaN(groupId)) {
            console.log('fetchAssignments: Missing token or invalid groupId', { token: !!token, groupId, isNaN: isNaN(groupId) });
            return;
        }
        
        console.log('=== fetchAssignments 디버깅 정보 ===');
        console.log('GroupId:', groupId, '(타입:', typeof groupId, ')');
        console.log('Token available:', !!token);
        console.log('Token 길이:', token ? token.length : 0);
                console.log('API endpoint:', `/groups/${groupId}/assignments`);
        console.log('Full URL:', `http://localhost:8080/api/v1/groups/${groupId}/assignments`);
        
        const result = await api('GET', `/groups/${groupId}/assignments`, null, token);
        console.log('Fetch assignments result:', result);
        console.log('Result type:', typeof result);
        console.log('Result structure:', Object.keys(result));
        
        // 백엔드 응답 구조에 따라 처리
        if (result.code === 'SUCCESS') {
            console.log('과제 목록 조회 성공, 데이터:', result.data);
            setAssignments(result.data);
        } else if (Array.isArray(result)) {
            // 백엔드에서 직접 리스트를 반환하는 경우
            console.log('백엔드에서 직접 리스트 반환:', result);
            setAssignments(result);
        } else {
            console.error('과제 목록 조회 실패:', result.message || '알 수 없는 응답 구조');
            setAssignments([]);
        }
        } catch (error) {
        console.error('=== 과제 목록 조회 오류 상세 정보 ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('GroupId:', groupId);
        console.error('Has token:', !!token);
        console.error('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
        setAssignments([]);
        
        // 사용자에게 더 명확한 에러 메시지 제공
        if (error.message.includes('500')) {
            console.error('백엔드 서버 오류가 발생했습니다. 백엔드 개발자에게 문의하세요.');
        }
        }
    };
    


    // 과제 생성/수정 모달 상태 관리
    const [assignmentModal, setAssignmentModal] = useState({
        isOpen: false,
        mode: 'create', // 'create' 또는 'edit'
        assignment: null
    });

    // 과제 삭제 모달 상태 관리
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        assignment: null
    });

    // 과제 폼 데이터 상태 관리
    const [assignmentFormData, setAssignmentFormData] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: ""
    });

    // 현재 테마 감지
    const isDarkMode = document.body.classList.contains('dark');
    
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
        placeholder: '과제 설명을 입력하세요...',
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
            description: assignment.content, // API에서는 content로 오지만 프론트에서는 description으로 사용
            startDate: assignment.startDate ? assignment.startDate.slice(0, 16) : '', // datetime-local 형식에 맞게 변환
            endDate: assignment.endDate ? assignment.endDate.slice(0, 16) : ''
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

    // 과제 삭제 모달 열기 함수
    const openDeleteModal = (assignment) => {
        setDeleteModal({
        isOpen: true,
        assignment: assignment
        });
    };

    // 과제 삭제 모달 닫기 함수
    const closeDeleteModal = () => {
        setDeleteModal({
        isOpen: false,
        assignment: null
        });
    };

    // 과제 생성 API 함수
    const createAssignment = async (assignmentData) => {
        try {
        if (!token) {
            throw new Error('토큰이 없습니다. 다시 로그인해주세요.');
        }
        
        if (!groupId || isNaN(groupId)) {
            throw new Error('유효하지 않은 그룹 ID입니다.');
        }
        
        const requestBody = {
            title: assignmentData.title,
            content: assignmentData.description, // API에서는 content로 보내야 함
            startDate: assignmentData.startDate,
            endDate: assignmentData.endDate
        };
        
        console.log('Creating assignment with data:', requestBody);
        console.log('API endpoint:', `/groups/${groupId}/create-assignment`);
        
        const result = await api('POST', `/groups/${groupId}/create-assignment`, requestBody, token);
        console.log('Create assignment result:', result);
        
        if (result.code === 'SUCCESS') {
            return { success: true, data: result.data };
        } else {
            throw new Error(result.message || '과제 생성에 실패했습니다.');
        }
        } catch (error) {
        console.error('과제 생성 오류:', error);
        return { success: false, error: { message: error.message || '과제 생성에 실패했습니다.' } };
        }
    };

    // 과제 수정 API 함수
    const updateAssignment = async (assignmentId, assignmentData) => {
        try {
        if (!token) {
            throw new Error('토큰이 없습니다. 다시 로그인해주세요.');
        }
        
        if (!groupId || isNaN(groupId)) {
            throw new Error('유효하지 않은 그룹 ID입니다.');
        }
        
        const requestBody = {
            title: assignmentData.title,
            content: assignmentData.description, // API에서는 content로 보내야 함
            startDate: assignmentData.startDate,
            endDate: assignmentData.endDate
        };
        
        console.log('Updating assignment with data:', requestBody);
                console.log('API endpoint:', `/groups/${groupId}/assignments/${assignmentId}`);
        
        const result = await api('PUT', `/groups/${groupId}/assignments/${assignmentId}`, requestBody, token);
        console.log('Update assignment result:', result);
        
        if (result.code === 'SUCCESS') {
            return { success: true, data: result.data };
        } else {
            throw new Error(result.message || '과제 수정에 실패했습니다.');
        }
        } catch (error) {
        console.error('과제 수정 오류:', error);
        return { success: false, error: { message: error.message || '과제 수정에 실패했습니다.' } };
        }
    };

    // 과제 삭제 API 함수
    const deleteAssignment = async (assignmentId) => {
        try {
        if (!token) {
            throw new Error('토큰이 없습니다. 다시 로그인해주세요.');
        }
        
        if (!groupId || isNaN(groupId)) {
            throw new Error('유효하지 않은 그룹 ID입니다.');
        }
                console.log('Deleting assignment with ID:', assignmentId);
        const result = await api('DELETE', `/groups/${groupId}/assignments/${assignmentId}`, null, token);
        console.log('Delete assignment result:', result);
        
        if (result.code === 'SUCCESS') {
            return { success: true };
        } else {
            throw new Error(result.message || '과제 삭제에 실패했습니다.');
        }
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
            // 과제 생성 후 목록 새로고침 (에러 처리 추가)
            console.log('Assignment created successfully, now fetching assignments...');
            console.log('Current groupId:', groupId);
            console.log('Current token available:', !!token);
            try {
                await fetchAssignments();
            } catch (fetchError) {
                console.error('과제 목록 새로고침 실패:', fetchError);
                alert('과제가 생성되었지만 목록을 새로고침하는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
            }
            }
        } else if (assignmentModal.mode === 'edit') {
            result = await updateAssignment(assignmentModal.assignment.assignmentId, assignmentFormData);
            if (result.success) {
            // 과제 수정 후 목록 새로고침 (에러 처리 추가)
            console.log('Assignment updated successfully, now fetching assignments...');
            console.log('Current groupId:', groupId);
            console.log('Current token available:', !!token);
            try {
                await fetchAssignments();
            } catch (fetchError) {
                console.error('과제 목록 새로고침 실패:', fetchError);
                alert('과제가 수정되었지만 목록을 새로고침하는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
            }
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

    // 과제 삭제 확인 함수 (모달에서 호출)
    const handleConfirmDelete = async () => {
        if (!deleteModal.assignment) return;
        
        try {
        const result = await deleteAssignment(deleteModal.assignment.assignmentId);
        if (result.success) {
            // 과제 삭제 후 목록 새로고침 (에러 처리 추가)
            try {
            await fetchAssignments();
            closeDeleteModal();
            alert('과제가 삭제되었습니다.');
            } catch (fetchError) {
            console.error('과제 목록 새로고침 실패:', fetchError);
            alert('과제가 삭제되었지만 목록을 새로고침하는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
            }
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

    // 동아리 전체 부원 목록 (하드코딩 제거)
    const [clubMembers, setClubMembers] = useState([]);

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
                            [week]: { 
                            ...member.assignments[week], 
                            url: newUrl,
                            // tistory.com이 포함되어 있으면 자동으로 제출완료로 변경
                            status: newUrl.toLowerCase().includes('tistory.com') ? '제출완료' : member.assignments[week].status
                            }
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
                                        {/* 스터디 제목과 뒤로가기 버튼 */}
                <div className="group-detail-title">
                    <Link to="/groups" className="group-back-btn">
                    <i className="fas fa-arrow-left"></i> Back to Groups
                    </Link>
                    <h1 className="heading">{selectedStudy.name}</h1>
                </div>
                
                
                
                            

                            {/* 주차별 과제 제출 테이블 */}
                <div className="group-assignments">
                    <div className="group-assignments-header">
                    <h2 className="group-assignments-title">
                        과제

                        <button 
                        className="btn assignment-create-btn"
                        onClick={() => openAssignmentModal('create')}
                        >
                        <i className="fas fa-plus"></i> 과제 생성
                        </button>
                    </h2>
                    </div>
                
                                                                {/* 과제 목록 */}
                    {assignments.length > 0 ? (
                    assignments.map((assignment, index) => (
                        <div key={assignment.assignmentId} className="week-assignment">
                        <button 
                            className={`week-button ${expandedWeeks[`assignment-${assignment.assignmentId}`] ? 'expanded' : ''}`}
                            onClick={() => toggleWeekExpansion(`assignment-${assignment.assignmentId}`)}
                        >
                            <div className="week-button-content">
                            <div className="week-title-container">
                                <h3 className="week-title">{assignment.title}</h3>
                                {isDeadlinePassed(assignment.endDate) && (
                                <span className="deadline-badge">마감</span>
                                )}
                            </div>
                            <div className="week-summary">
                                <span className="week-status">
                                {selectedStudy.members.filter(m => m.assignments.week1.status === '제출완료').length}/
                                {selectedStudy.members.length} 제출완료
                                </span>
                            </div>
                            <i className={`fas fa-chevron-${expandedWeeks[`assignment-${assignment.assignmentId}`] ? 'up' : 'down'} week-icon`}></i>
                            </div>
                        </button>
                        
                        <div className={`week-content ${expandedWeeks[`assignment-${assignment.assignmentId}`] ? 'expanded' : ''}`}>
                            {/* 과제 설명 섹션 */}
                            <div className="assignment-description">
                            <div className="assignment-description-header">
                                <h4 className="assignment-description-title">과제 설명</h4>
                                <div className="assignment-actions">
                                <button 
                                    className="btn btn-small btn-secondary"
                                    onClick={() => openAssignmentModal('edit', assignment)}
                                >
                                    <i className="fas fa-edit"></i> 수정
                                </button>
                                <button 
                                    className="btn btn-small btn-danger"
                                    onClick={() => openDeleteModal(assignment)}
                                >
                                    <i className="fas fa-trash"></i> 삭제
                                </button>
                                </div>
                            </div>
                            <p className="assignment-description-text">
                                <div dangerouslySetInnerHTML={{ __html: assignment.content }}></div>
                            </p>
                            <div className="assignment-dates">
                                <span className="assignment-date">
                                <i className="fas fa-calendar-alt"></i>
                                시작: {assignment.startDate ? 
                                    new Date(assignment.startDate).toLocaleString('ko-KR') : '미정'}
                                </span>
                                <span className="assignment-date">
                                <i className="fas fa-calendar-check"></i>
                                마감: {assignment.endDate ? 
                                    new Date(assignment.endDate).toLocaleString('ko-KR') : '미정'}
                                </span>
                            </div>
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
                                        <select 
                                            className="assignment-select"
                                            value={member.assignments.week1.status}
                                            onChange={(e) => handleAssignmentChange(selectedStudy.groupId, member.id, 'week1', e.target.value)}
                                        >
                                            <option value="미제출">미제출</option>
                                            <option value="제출완료">제출완료</option>
                                        </select>
                                        </td>
                                        <td className="member-assignment-url">
                                        <input
                                            type="text"
                                            className="assignment-url-input"
                                            placeholder="과제 주소 입력"
                                            value={member.assignments.week1.url || ""}
                                            onChange={(e) => handleAssignmentUrlChange(selectedStudy.groupId, member.id, 'week1', e.target.value)}
                                        />
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>
                            </div>
                            </div>
                        </div>
                        </div>
                    ))
                    ) : (
                    <div className="no-assignments">
                        <p className="no-assignments-text">아직 등록된 과제가 없습니다.</p>
                        <p className="no-assignments-hint">과제 생성 버튼을 클릭하여 첫 번째 과제를 등록해보세요.</p>
                    </div>
                    )}

                
                            </div>
            </div>
            </div>

                    {/* 경고 모달 */}
            {warningModal.isOpen && (
                <div className="group-modal-overlay">
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
                <div className="group-mentor-modal-overlay">
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
                <div className="assignment-modal-overlay">
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
                    <label>제목</label>
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
                    <label>설명</label>
                    <div className="tinymce-editor-container">
                        <Editor
                        apiKey="r8m7hvh9qbys442qwv4rtviyoy86dqrshoqtwq18z96lol4w"
                        init={tinymceConfig}
                        value={assignmentFormData.description}
                        onEditorChange={(content) => setAssignmentFormData({...assignmentFormData, description: content})}
                        />
                    </div>
                    </div>
                    
                    <div className="form-row">
                    <div className="form-group">
                        <label>시작 날짜</label>
                                            <DatePicker
                            selected={assignmentFormData.startDate ? new Date(assignmentFormData.startDate) : null}
                            onChange={(date) => {
                            if (date) {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const hours = String(date.getHours()).padStart(2, '0');
                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
                                setAssignmentFormData({...assignmentFormData, startDate: formattedDate});
                            } else {
                                setAssignmentFormData({...assignmentFormData, startDate: ''});
                            }
                            }}
                            showTimeSelect
                            showTimeSelectOnly={false}
                            timeFormat="HH:mm"
                            timeIntervals={60}
                            dateFormat="yyyy-MM-dd HH:mm"
                            placeholderText="시작 날짜와 시간을 선택하세요"
                            className="datepicker-input"
                            locale="ko"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>마감 날짜</label>
                                            <DatePicker
                            selected={assignmentFormData.endDate ? new Date(assignmentFormData.endDate) : null}
                            onChange={(date) => {
                            if (date) {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const hours = String(date.getHours()).padStart(2, '0');
                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
                                setAssignmentFormData({...assignmentFormData, endDate: formattedDate});
                            } else {
                                setAssignmentFormData({...assignmentFormData, endDate: ''});
                            }
                            }}
                            showTimeSelect
                            showTimeSelectOnly={false}
                            timeFormat="HH:mm"
                            timeIntervals={60}
                            dateFormat="yyyy-MM-dd HH:mm"
                            placeholderText="마감 날짜와 시간을 선택하세요"
                            className="datepicker-input"
                            locale="ko"
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

            {/* 과제 삭제 모달 */}
            {deleteModal.isOpen && (
                <div className="assignment-modal-overlay">
                <div className="assignment-modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="assignment-modal-header">
                    <h3 className="assignment-modal-title">과제 삭제</h3>
                    <button className="assignment-modal-close" onClick={closeDeleteModal}>
                        <i className="fas fa-times"></i>
                    </button>
                    </div>
                    
                    <div className="assignment-modal-body">
                    <p>정말로 "{deleteModal.assignment?.title}" 과제를 삭제하시겠습니까?</p>
                    <p>이 작업은 되돌릴 수 없습니다.</p>
                    </div>
                    
                    <div className="assignment-modal-footer">
                    <button className="btn btn-secondary" onClick={closeDeleteModal}>
                        취소
                    </button>
                    <button className="btn btn-danger" onClick={handleConfirmDelete}>
                        삭제
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


