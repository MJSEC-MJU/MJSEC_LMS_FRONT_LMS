import React, { useState, useEffect, useCallback } from 'react';
import { api } from "../client";
import { useAuth } from "../../hooks/useAuth";
import { Editor } from '@tinymce/tinymce-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
const BASE_URL = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
const RAW_BASE   = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
const RAW_PREFIX = (import.meta.env.VITE_API_PREFIX ?? "/api/v1")
  .replace(/\/+$/, "")
  .replace(/^\/?/, "/");
const API_BASE = (() => {
  if (!RAW_PREFIX || RAW_PREFIX === "/") return RAW_BASE;
  if (RAW_BASE.endsWith(RAW_PREFIX)) return RAW_BASE;
  if (RAW_BASE.endsWith("/api") && RAW_PREFIX === "/api/v1") {
    return RAW_BASE.replace(/\/api$/, "/api/v1");
  }
  if (RAW_BASE.includes("/api/v1")) return RAW_BASE;
  return `${RAW_BASE}${RAW_PREFIX}`;
})();

const API_URL = new URL(API_BASE, window.location.origin);
const ORIGIN = API_URL.origin;

// 원본 경로/URL에서 파일명만 추출
const extractFileName = (raw) => {
  if (!raw) return "";
  try {
    const u = new URL(raw, ORIGIN); // 절대/상대/파일명 단독 모두 처리
    const parts = u.pathname.split("/");
    return parts.pop() || "";
  } catch {
    const parts = String(raw).split("/");
    return parts.pop() || "";
  }
};

// /api/v1/image/{파일명} 로 정규화
const toImageApiUrl = (raw) => {
  const name = extractFileName(raw);
  return name ? `${API_BASE}/image/${name}` : null;
};
export default function CurriculumSection({ groupId, isMentor }) {
  const { user, token } = useAuth();
  // 과제/커리큘럼 관련 상태
  const [assignments, setAssignments] = useState([]);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [assignmentModal, setAssignmentModal] = useState({
    isOpen: false,
    mode: 'create',
    assignment: null
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    assignment: null
  });
  const [activityModal, setActivityModal] = useState({
    isOpen: false
  });
  const [activityPhotosModal, setActivityPhotosModal] = useState({
    isOpen: false
  });
  const [activityPhotos, setActivityPhotos] = useState([]);
  const [menteeList, setMenteeList] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [activityDetailModal, setActivityDetailModal] = useState({
    isOpen: false,
    activity: null
  });
  const [activityEditModal, setActivityEditModal] = useState({
    isOpen: false,
    activity: null
  });
  const [activityEditFormData, setActivityEditFormData] = useState({
    title: "",
    content: "",
    week: "",
    image: null,
    attendance: {}
  });
  const [assignmentFormData, setAssignmentFormData] = useState({
    title: "",
    description: "",
    hasAssignment: false,
    startDate: "",
    endDate: ""
  });
  const [assignmentFilter, setAssignmentFilter] = useState('all'); // 'all', 'with-assignment', 'without-assignment'
  
  // 과제 제출 관련 상태
  const [assignmentSubmissionModal, setAssignmentSubmissionModal] = useState({
    isOpen: false,
    planId: null,
    assignment: null,
    mode: 'create' // 'create' | 'edit'
  });
  const [assignmentSubmissionFormData, setAssignmentSubmissionFormData] = useState({
    content: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submittedAssignments, setSubmittedAssignments] = useState({}); // planId별 제출 정보
  const [assignmentSubmissionList, setAssignmentSubmissionList] = useState({}); // planId별 제출 목록 (멘토용)
  const [showSubmissionList, setShowSubmissionList] = useState({}); // 제출 목록 표시 여부
  const [expandedSubmissions, setExpandedSubmissions] = useState({}); // 확장된 제출 상세 정보
  const [userProfile, setUserProfile] = useState(null); // 사용자 프로필 정보
  const [mentees, setMentees] = useState([]); // 멘티 목록 (미제출자 수 계산용)
  
  // 필터링된 커리큘럼 계산
  const filteredAssignments = React.useMemo(() => {
    if (assignmentFilter === 'all') return assignments;
    if (assignmentFilter === 'with-assignment') return assignments.filter(assignment => assignment.hasAssignment);
    if (assignmentFilter === 'without-assignment') return assignments.filter(assignment => !assignment.hasAssignment);
    return assignments;
  }, [assignments, assignmentFilter]);
  
  const [activityFormData, setActivityFormData] = useState({
    title: "",
    content: "",
    week: "",
    image: null
  });
  const [attendanceData, setAttendanceData] = useState({});
  const [menteeAttendanceData, setMenteeAttendanceData] = useState({});
  const [attendanceRate, setAttendanceRate] = useState(0);

  // 현재 테마 감지
  const isDarkMode = document.body.classList.contains('dark');
  
  // TinyMCE 설정
  const tinymceConfig = {
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

  // 커리큘럼 데이터 매핑 함수
  const mapPlanToAssignment = useCallback((p) => ({
    assignmentId: p.planId ?? p.assignmentId,
    title: p.title,
    content: p.content ?? p.description ?? '',
    hasAssignment: p.hasAssignment,
    startDate: p.startDate,
    endDate: p.endDate,
    creatorName: p.creatorName,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }), []);

  // 커리큘럼 목록 조회
  const fetchAssignments = useCallback(async () => {
    if (!token || !groupId || isNaN(groupId)) return;
    
    try {
      const result = await api('GET', `/group/${groupId}/plan`, null, token);
      let plans = [];
      if (result && result.code === 'SUCCESS' && Array.isArray(result.data)) plans = result.data;
      else if (Array.isArray(result)) plans = result;
      
      // 데이터 매핑 적용
      const mappedAssignments = plans.map(mapPlanToAssignment);
      setAssignments(mappedAssignments);
    } catch {
      // 커리큘럼 목록 조회 오류 처리
    }
  }, [token, groupId, mapPlanToAssignment]);

  // 커리큘럼 생성 API 함수
  const createAssignment = async (assignmentData) => {
    try {
      // 백엔드 API 형식에 맞게 데이터 변환
      const apiData = {
        title: assignmentData.title,
        content: assignmentData.description, // description -> content
        hasAssignment: assignmentData.hasAssignment,
        startDate: assignmentData.startDate ? new Date(assignmentData.startDate).toISOString() : null,
        endDate: assignmentData.endDate ? new Date(assignmentData.endDate).toISOString() : null
      };
      
      const result = await api('POST', `/mentor/group/${groupId}/create-plan`, apiData, token);
      
      if (result.code === 'SUCCESS') {
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || '커리큘럼 생성에 실패했습니다.');
      }
    } catch (error) {
      return { success: false, error: { message: error.message || '커리큘럼 생성에 실패했습니다.' } };
    }
  };

  // 커리큘럼 수정 API 함수
  const updateAssignment = async (assignmentId, assignmentData) => {
    try {
      // 백엔드 API 형식에 맞게 데이터 변환
      const apiData = {
        title: assignmentData.title,
        content: assignmentData.description, // description -> content
        hasAssignment: assignmentData.hasAssignment,
        startDate: assignmentData.startDate ? new Date(assignmentData.startDate).toISOString() : null,
        endDate: assignmentData.endDate ? new Date(assignmentData.endDate).toISOString() : null
      };
      
      const result = await api('PUT', `/mentor/group/${groupId}/plan/${assignmentId}`, apiData, token);
      
      if (result.code === 'SUCCESS') {
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || '커리큘럼 수정에 실패했습니다.');
      }
    } catch (error) {
      return { success: false, error: { message: error.message || '커리큘럼 수정에 실패했습니다.' } };
    }
  };

  // 커리큘럼 삭제 API 함수
  const deleteAssignment = async (assignmentId) => {
    try {
      const result = await api('DELETE', `/mentor/group/${groupId}/plan/${assignmentId}`, null, token);
      
      if (result.code === 'SUCCESS') {
        return { success: true };
      } else {
        throw new Error(result.message || '커리큘럼 삭제에 실패했습니다.');
      }
    } catch (error) {
      return { success: false, error: { message: error.message || '커리큘럼 삭제에 실패했습니다.' } };
    }
  };

  // 과제 생성 모달 열기 함수
  const openAssignmentModal = (mode = 'create', assignment = null) => {
    if (mode === 'edit' && assignment) {
      setAssignmentFormData({
        title: assignment.title,
        description: assignment.content,
        hasAssignment: assignment.hasAssignment ?? false,
        startDate: assignment.startDate ? assignment.startDate.slice(0, 16) : '',
        endDate: assignment.endDate ? assignment.endDate.slice(0, 16) : ''
      });
    } else {
      setAssignmentFormData({
        title: "",
        description: "",
        hasAssignment: false,
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

  // 활동 기록 모달 열기 함수
  const openActivityModal = () => {
    setActivityModal({
      isOpen: true
    });
    setActivityFormData({
      title: "",
      content: "",
      week: "",
      image: null
    });
    // 멘티 목록으로 출석체크 데이터 초기화
    const initialAttendance = {};
    menteeList.forEach(mentee => {
      initialAttendance[mentee.studentNumber] = 'ATTEND';
    });
    setAttendanceData(initialAttendance);
  };

  // 활동 기록 모달 닫기 함수
  const closeActivityModal = () => {
    setActivityModal({
      isOpen: false
    });
    setActivityFormData({
      title: "",
      content: "",
      week: "",
      image: null
    });
    // 멘티 목록으로 출석체크 데이터 초기화
    const initialAttendance = {};
    menteeList.forEach(mentee => {
      initialAttendance[mentee.studentNumber] = 'ATTEND';
    });
    setAttendanceData(initialAttendance);
  };

  // 활동 기록 제출 함수
  const submitActivityRecord = async () => {
    try {
      // 필수 필드 검증
      if (!activityFormData.title.trim()) {
        alert('활동 제목을 입력해주세요.');
        return;
      }
      if (!activityFormData.week.trim()) {
        alert('주차를 입력해주세요.');
        return;
      }
      if (!activityFormData.content.trim()) {
        alert('활동 내용을 입력해주세요.');
        return;
      }

      // 주차 검증 (숫자만)
      const weekNumber = parseInt(activityFormData.week);
      if (!weekNumber || weekNumber < 1 || weekNumber > 20) {
        alert('주차는 1부터 20 사이의 숫자로 입력해주세요.');
        return;
      }

      // FormData 생성
      const formData = new FormData();
      // 출석체크 데이터 생성
      const studyAttendanceDtoList = menteeList.map(mentee => ({
        studentNumber: mentee.studentNumber,
        name: mentee.name,
        type: attendanceData[mentee.studentNumber] || 'ATTEND'
      }));

      // studyActivityDto JSON 생성
      const studyActivityDto = {
        title: activityFormData.title.trim(),
        content: activityFormData.content.trim(),
        week: `${weekNumber}주차`,
        studyAttendanceDtoList
      };

      // 빈 문자열 체크 및 기본값 설정
      if (!studyActivityDto.title) {
        alert('활동 제목을 입력해주세요.');
        return;
      }
      if (!studyActivityDto.content) {
        alert('활동 내용을 입력해주세요.');
        return;
      }
      if (!studyActivityDto.week) {
        alert('주차를 입력해주세요.');
        return;
      }

      // FormData에 추가 (브라우저가 boundary 포함 Content-Type 자동 설정)
      formData.append(
        'studyActivityDto',
        new Blob([JSON.stringify(studyActivityDto)], { type: 'application/json' })
      );
      if (activityFormData.image) {
        formData.append('image', activityFormData.image);
      }

      // API_BASE 사용 + Accept 헤더 추가 + 안전 파싱
      const url = `${API_BASE}/group/${groupId}/create-activity`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      let result;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch {
          alert(`서버 응답(JSON) 파싱에 실패했습니다.\n상태: ${response.status}`);
          return;
        }
      } else {
        const responseText = await response.text();
        try {
          result = JSON.parse(responseText);
        } catch {
          alert(`서버에서 예상치 못한 응답을 받았습니다.\n상태: ${response.status}\n응답: ${responseText}`);
          return;
        }
      } // ← else 블록 닫음

      if (response.ok && result.code === 'SUCCESS') {
        alert('활동 기록이 성공적으로 저장되었습니다!');
        closeActivityModal();
        // 폼 데이터 초기화
        setActivityFormData({
          title: "",
          content: "",
          week: "",
          image: null
        });
      } else {
        // 권한 에러 우선 처리
        if (response.status === 401) {
          alert('로그인이 필요합니다. 다시 로그인 후 시도해주세요.');
          return;
        }
        if (response.status === 403) {
          alert('권한이 없습니다.');
          return;
        }

        // 서버 에러 코드 처리
        if (result.code === 'DUPLICATE_WEEK') {
          alert('해당 주차의 활동 글이 이미 존재합니다.');
        } else if (result.code === 'ACTIVITY_TITLE_TOO_LONG') {
          alert('활동 글 제목은 200자 이하로 작성해주세요.');
        } else if (result.code === 'ACTIVITY_CONTENT_TOO_LONG') {
          alert('활동 글 내용은 5000자 이하로 작성해주세요.');
        } else if (result.code === 'WARNING_CONTENT') {
          alert('허용되지 않은 내용입니다.');
        } else if (result.errors && result.errors.length > 0) {
          const errorMessage = result.errors.map(error => error.message).join('\n');
          alert(errorMessage);
        } else {
          alert(result.message || '활동 기록 저장에 실패했습니다.');
        }
      }
    } catch {
      alert('활동 기록 저장에 실패했습니다.');
    }
  };

  // 활동 기록 폼 데이터 변경 함수
  const handleActivityFormChange = (field, value) => {
    setActivityFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 주차가 변경되면 해당 주차의 출석 데이터를 가져와서 초기화
    if (field === 'week' && value) {
      fetchAttendanceByWeek(value).then(attendanceData => {
        const initialAttendance = {};
        menteeList.forEach(mentee => {
          const existingAttendance = attendanceData.find(att => att.studentNumber === mentee.studentNumber);
          initialAttendance[mentee.studentNumber] = existingAttendance ? existingAttendance.attendanceType : 'ATTEND';
        });
        setAttendanceData(initialAttendance);
      });
    }
  };

  // 활동 기록 이미지 선택 함수
  const handleActivityImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setActivityFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  // 출석체크 변경 함수
  const handleAttendanceChange = (studentNumber, type) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentNumber]: type
    }));
  };

  // 활동 상세조회 API 함수
  const fetchActivityDetail = async (activityId) => {
    try {
      const url = `${API_BASE}/group/${groupId}/activity/${activityId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
      });

      let result;
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try {
          result = await response.json();
        } catch {
          return { success: false, error: `서버 응답(JSON) 파싱 실패 (status ${response.status})` };
        }
      } else {
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch {
          return { success: false, error: `예상치 못한 응답 형식 (status ${response.status})` };
        }
      }

      if (!response.ok) {
        if (response.status === 401) return { success: false, error: '로그인이 필요합니다.' };
        if (response.status === 403) return { success: false, error: '권한이 없습니다.' };
        return { success: false, error: result?.message || `요청 실패 (status ${response.status})` };
      }

      if (result.code === 'SUCCESS') {
        return { success: true, data: result.data };
      }
      return { success: false, error: result.message || '활동 상세조회에 실패했습니다.' };
    } catch {
      return { success: false, error: '활동 상세조회 중 오류가 발생했습니다.' };
    }
  };


  // 활동 상세보기 모달 열기
  const openActivityDetailModal = useCallback(async (activity) => {
    // 우선 목록에서 넘어온 데이터로 모달 열기 (이미지 경로 정규화)
    setActivityDetailModal({
      isOpen: true,
      activity: {
        ...activity,
        imageUrl: toImageApiUrl(activity.imageUrl),
      },
    });

    // URL에 activityId 파라미터 추가
    const url = new URL(window.location);
    url.searchParams.set('activityId', activity.id);
    window.history.pushState({}, '', url);

    // API에서 상세 데이터 가져오기
    const result = await fetchActivityDetail(activity.id);

    if (!result.success) {
      alert(`활동 상세조회 실패: ${result.error}`);
      return;
    }

    // 응답 매핑 + 이미지 경로 정규화 (응답이 없으면 기존 값 유지)
    const activityData = {
      ...result.data,
      id: result.data.activityId,
      uploadedAt: result.data.createdAt,
      attendanceList: result.data.studyAttendanceDtoList || [],
      imageUrl: toImageApiUrl(result.data.imageUrl ?? activity.imageUrl),
    };

    setActivityDetailModal((prev) => ({
      ...prev,
      activity: activityData,
    }));
  }, []);

  // 활동 상세보기 모달 닫기
  const closeActivityDetailModal = () => {
    setActivityDetailModal({
      isOpen: false,
      activity: null,
    });

    // URL에서 activityId 파라미터 제거
    const url = new URL(window.location);
    url.searchParams.delete('activityId');
    window.history.pushState({}, '', url);
  };



  // 활동 삭제 API 호출
  const deleteActivity = async (activityId) => {
    try {
      const url = `${API_BASE}/group/${groupId}/activity/${activityId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      let result;
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try {
          result = await response.json();
        } catch {
          return { success: false, error: `서버 응답(JSON) 파싱 실패 (status ${response.status})` };
        }
      } else {
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch {
          return { success: false, error: `예상치 못한 응답 형식 (status ${response.status})` };
        }
      }

      if (!response.ok) {
        if (response.status === 401) return { success: false, error: '로그인이 필요합니다.' };
        if (response.status === 403) return { success: false, error: '권한이 없습니다.' };
        return { success: false, error: result?.message || `요청 실패 (status ${response.status})` };
      }

      if (result.code === 'SUCCESS') {
        return { success: true, data: result.data };
      }
      return { success: false, error: result.message || '활동 삭제에 실패했습니다.' };
    } catch {
      return { success: false, error: '활동 삭제 중 오류가 발생했습니다.' };
    }
  };


  // 활동 수정 API 호출
  const updateActivity = async (activityId, formData) => {
    try {
      const studyActivityDto = {
        title: formData.title,
        content: formData.content,
        week: formData.week,
        studyAttendanceDtoList: Object.values(formData.attendance).map(att => ({
          studentNumber: parseInt(att.studentNumber),
          name: att.name,
          type: att.type
        }))
      };

      const formDataToSend = new FormData();
      formDataToSend.append(
        'studyActivityDto',
        new Blob([JSON.stringify(studyActivityDto)], { type: 'application/json' })
      );
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const url = `${API_BASE}/group/${groupId}/activity/${activityId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: formDataToSend
      });

      // 응답 안전 파싱
      let result;
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try {
          result = await response.json();
        } catch {
          return { success: false, error: `서버 응답(JSON) 파싱 실패 (status ${response.status})` };
        }
      } else {
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch {
          return { success: false, error: `예상치 못한 응답 형식 (status ${response.status})` };
        }
      }

      // 상태코드 기반 에러 처리
      if (!response.ok) {
        if (response.status === 401) return { success: false, error: '로그인이 필요합니다.' };
        if (response.status === 403) return { success: false, error: '권한이 없습니다.' };
        return { success: false, error: result?.message || `요청 실패 (status ${response.status})` };
      }

      // 비즈니스 코드 처리
      if (result.code === 'SUCCESS') {
        return { success: true, data: result.data };
      }
      return { success: false, error: result.message || '활동 수정에 실패했습니다.' };
    } catch {
      return { success: false, error: '활동 수정 중 오류가 발생했습니다.' };
    }
  };


  // 활동 수정 모달 열기
  const openActivityEditModal = (activity) => {
    setActivityEditModal({ isOpen: true, activity });
    
    // 주차에서 숫자만 추출 (예: "1주차" -> "1")
    const weekNumber = activity.week ? activity.week.replace('주차', '') : "";
    
    // content가 undefined인 경우 빈 문자열로 설정
    const contentValue = activity.content || "";
    
    setActivityEditFormData({
      title: activity.title || "",
      content: contentValue,
      week: weekNumber,
      image: null,
      attendance: {}
    });
  };

  // 활동 수정 모달 닫기
  const closeActivityEditModal = () => {
    setActivityEditModal({ isOpen: false, activity: null });
    setActivityEditFormData({
      title: "",
      content: "",
      week: "",
      image: null,
      attendance: {}
    });
  };


  // 과제 제출 API 함수
  const submitAssignment = async (planId, formData) => {
    try {
      const result = await api('POST', `/group/${groupId}/assignment/submit/${planId}`, formData, token);
      
      if (result.code === 'SUCCESS') {
        return { success: true, data: result.data };
      }
      
      // 중복 제출 에러 처리
      if (result.code === 'DUPLICATE_SUBMISSION') {
        // 제출 정보를 다시 가져와서 UI 업데이트
        const submissionResult = await fetchAssignmentSubmission(planId);
        if (submissionResult.success) {
          setSubmittedAssignments(prev => ({
            ...prev,
            [planId]: {
              ...submissionResult.data,
              submissionId: submissionResult.data.submissionId || submissionResult.data.id
            }
          }));
          // 중복 제출이지만 제출 정보를 찾았으므로 성공으로 처리
          return { success: true, data: submissionResult.data, isDuplicate: true };
        }
        return { success: false, error: '이미 제출된 과제입니다. 제출 정보를 불러올 수 없습니다.' };
      }
      
      // 다른 에러 케이스들 처리
      if (result.code === 'UNAUTHORIZED_MENTEE_ROLE') {
        return { success: false, error: '멘티만 과제를 제출할 수 있습니다.' };
      }
      if (result.code === 'UNAUTHORIZED_DOMAIN') {
        return { success: false, error: '허용되지 않은 도메인입니다.' };
      }
      if (result.code === 'WARNING_CONTENT') {
        return { success: false, error: '허용되지 않은 내용입니다. XSS나 SQL Injection을 방지하기 위해 특수문자를 제거해주세요.' };
      }
      if (result.code === 'PLAN_GROUP_MISMATCH') {
        return { success: false, error: '해당 스터디 그룹의 계획이 아닙니다.' };
      }
      if (result.code === 'STUDY_NOT_FOUND') {
        return { success: false, error: '스터디를 찾을 수 없습니다.' };
      }
      if (result.code === 'STUDY_USER_NOT_FOUND') {
        return { success: false, error: '해당 스터디 멤버를 찾을 수 없습니다.' };
      }
      if (result.code === 'ASSIGNMENT_NOT_FOUND') {
        return { success: false, error: '과제가 없습니다.' };
      }
      
      return { success: false, error: result.message || '과제 제출에 실패했습니다.' };
    } catch (error) {
      console.error('과제 제출 오류:', error);
      return { success: false, error: '과제 제출 중 오류가 발생했습니다.' };
    }
  };

  // 과제 조회 API 함수 (멘티가 제출한 과제 확인)
  const fetchAssignmentSubmission = useCallback(async (planId) => {
    try {
      // 사용자 프로필 정보가 없으면 먼저 가져오기
      if (!userProfile) {
        await fetchUserProfile();
      }
      
      // 멘티는 전체 제출 리스트에서 자신의 제출을 찾아야 함
      const result = await api('GET', `/group/${groupId}/assignment/submit/${planId}`, null, token);
      
      if (result.code === 'SUCCESS' && result.data && Array.isArray(result.data)) {
        // 현재 사용자의 제출만 찾기 (프로필 정보 사용)
        const currentUserSubmission = result.data.find(submission => {
          const userName = userProfile?.name || user?.name;
          const userStudentNumber = userProfile?.studentNumber || user?.studentNumber;
          
          return submission.creatorName === userName || 
                 submission.studentNumber === userStudentNumber ||
                 submission.creatorName === userStudentNumber?.toString() ||
                 submission.studentNumber === userStudentNumber?.toString();
        });
        
        if (currentUserSubmission) {
          // 개별 제출 상세 정보를 가져와서 비밀번호 포함
          try {
            const detailResult = await api('GET', `/group/${groupId}/assignment/submit/${planId}/submission/${currentUserSubmission.submissionId || currentUserSubmission.id}`, null, token);
            
            if (detailResult.code === 'SUCCESS') {
              return { 
                success: true, 
                data: {
                  ...currentUserSubmission,
                  ...detailResult.data, // 상세 정보로 덮어쓰기 (비밀번호 포함)
                  password: detailResult.data.password || currentUserSubmission.password || ''
                }
              };
            }
          } catch (detailError) {
            console.error('과제 상세 정보 조회 오류:', detailError);
          }
          
          // 상세 정보 조회 실패 시 기본 정보라도 반환
          return { 
            success: true, 
            data: {
              ...currentUserSubmission,
              password: currentUserSubmission.password || ''
            }
          };
        }
        return { success: false, error: '제출된 과제를 찾을 수 없습니다.' };
      }
      return { success: false, error: result.message || '과제 조회에 실패했습니다.' };
    } catch (error) {
      console.error('과제 조회 오류:', error);
      return { success: false, error: '과제 조회 중 오류가 발생했습니다.' };
    }
  }, [userProfile, user, groupId, token, fetchUserProfile]);

  // 모든 과제의 제출 정보를 가져오는 함수
  const fetchAllAssignmentSubmissions = useCallback(async () => {
    if (!isMentor && assignments.length > 0) {
      const submissions = {};
      
      for (const assignment of assignments) {
        if (assignment.hasAssignment) {
          try {
            const result = await fetchAssignmentSubmission(assignment.assignmentId);
            if (result.success && result.data) {
              submissions[assignment.assignmentId] = {
                ...result.data,
                submissionId: result.data.submissionId || result.data.id,
                password: result.data.password || '' // 비밀번호 정보 보장
              };
            }
          } catch (error) {
            console.error(`과제 ${assignment.assignmentId} 조회 오류:`, error);
          }
        }
      }
      setSubmittedAssignments(submissions);
    }
  }, [isMentor, assignments, fetchAssignmentSubmission]);

  // 사용자 프로필 정보 가져오기
  const fetchUserProfile = useCallback(async () => {
    try {
      const result = await api('GET', '/user/user-page', null, token);
      if (result?.data) {
        setUserProfile(result.data);
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('사용자 프로필 조회 오류:', error);
      return null;
    }
  }, [token]);

  // 과제 제출 목록을 가져오는 함수 (멘토용)
  const fetchAssignmentSubmissionList = useCallback(async (planId) => {
    try {
      const result = await api('GET', `/group/${groupId}/assignment/submit/${planId}`, null, token);
      
      if (result.code === 'SUCCESS') {
        // 상태 업데이트
        setAssignmentSubmissionList(prev => ({
          ...prev,
          [planId]: result.data
        }));
        return { success: true, data: result.data };
      }
      return { success: false, error: result.message || '과제 제출 목록 조회에 실패했습니다.' };
    } catch (error) {
      console.error('과제 제출 목록 조회 오류:', error);
      return { success: false, error: '과제 제출 목록 조회 중 오류가 발생했습니다.' };
    }
  }, [groupId, token]);

  // 개별 제출 상세 정보를 가져오는 함수 (멘토용)
  const fetchSubmissionDetail = async (planId, submissionId) => {
    try {
      const result = await api('GET', `/group/${groupId}/assignment/submit/${planId}/submission/${submissionId}`, null, token);
      
      if (result.code === 'SUCCESS') {
        return { success: true, data: result.data };
      }
      return { success: false, error: result.message || '과제 제출 상세 정보 조회에 실패했습니다.' };
    } catch (error) {
      console.error('과제 제출 상세 정보 조회 오류:', error);
      return { success: false, error: '과제 제출 상세 정보 조회 중 오류가 발생했습니다.' };
    }
  };

  // URL을 새 탭에서 열기
  const openUrlInNewTab = (url) => {
    if (!url) return;
    
    // URL이 http:// 또는 https://로 시작하지 않으면 https://를 추가
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`;
    
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  };

  // 멘티 목록 조회 (미제출자 수 계산용)
  const fetchMentees = useCallback(async () => {
    if (!token || !groupId) return;
    
    try {
      const result = await api('GET', `/group/${groupId}/mentee`, null, token);
      if (result.code === 'SUCCESS') {
        setMentees(result.data || []);
      }
    } catch (error) {
      console.error('멘티 목록 조회 오류:', error);
    }
  }, [token, groupId]);

  // 미제출자 수 계산
  const getUnsubmittedCount = (planId) => {
    const totalMentees = mentees.length;
    const submittedCount = assignmentSubmissionList[planId]?.length || 0;
    return totalMentees - submittedCount;
  };

  // 개별 제출 상세 정보 토글 함수
  const toggleSubmissionDetail = async (planId, submissionId) => {
    const key = `${planId}-${submissionId}`;
    
    if (expandedSubmissions[key]) {
      // 상세 정보 숨기기
      setExpandedSubmissions(prev => ({
        ...prev,
        [key]: false
      }));
      } else {
      // 상세 정보 보이기 - API에서 상세 정보 가져오기
      const result = await fetchSubmissionDetail(planId, submissionId);
      if (result.success) {
        setExpandedSubmissions(prev => ({
          ...prev,
          [key]: result.data
        }));
      } else {
        alert(`상세 정보 조회 실패: ${result.error}`);
      }
    }
  };

  // 제출 목록 토글 함수
  const toggleSubmissionList = async (planId) => {
    if (showSubmissionList[planId]) {
      // 목록 숨기기
      setShowSubmissionList(prev => ({
        ...prev,
        [planId]: false
      }));
    } else {
      // 목록 보이기 - 데이터가 없으면 가져오기 (이미 미리 로드되어 있을 가능성 높음)
      if (!assignmentSubmissionList[planId]) {
        const result = await fetchAssignmentSubmissionList(planId);
        if (!result.success) {
          alert(`제출 목록 조회 실패: ${result.error}`);
          return;
        }
      }
      
      setShowSubmissionList(prev => ({
        ...prev,
        [planId]: true
      }));
    }
  };

  // 과제 수정 API 함수
  const updateAssignmentSubmission = async (planId, submitId, formData) => {
    try {
      const result = await api('PUT', `/group/${groupId}/assignment/submit/${planId}/submission/${submitId}`, formData, token);
      
      if (result.code === 'SUCCESS') {
        return { success: true, data: result.data };
      }
      
      // 에러 케이스들 처리
      if (result.code === 'UNAUTHORIZED_ACCESS_SUBMISSION') {
        return { success: false, error: '과제 제출 조회 권한이 없습니다.' };
      }
      if (result.code === 'STUDY_NOT_FOUND') {
        return { success: false, error: '스터디를 찾을 수 없습니다.' };
      }
      if (result.code === 'STUDY_USER_NOT_FOUND') {
        return { success: false, error: '해당 스터디 멤버를 찾을 수 없습니다.' };
      }
      if (result.code === 'ASSIGNMENT_NOT_FOUND') {
        return { success: false, error: '과제를 찾을 수 없습니다.' };
      }
      if (result.code === 'SUBMISSION_NOT_FOUND') {
        return { success: false, error: '과제 제출 내역을 찾을 수 없습니다.' };
      }
      if (result.code === 'WARNING_CONTENT') {
        return { success: false, error: '허용되지 않은 내용입니다. XSS나 SQL Injection을 방지하기 위해 특수문자를 제거해주세요.' };
      }
      
      return { success: false, error: result.message || '과제 수정에 실패했습니다.' };
    } catch (error) {
      console.error('과제 수정 오류:', error);
      return { success: false, error: '과제 수정 중 오류가 발생했습니다.' };
    }
  };

  // 과제 삭제 API 함수
  const deleteAssignmentSubmission = async (planId, submitId) => {
    try {
      const result = await api('DELETE', `/group/${groupId}/assignment/submit/${planId}/submission/${submitId}`, null, token);
      
      if (result.code === 'SUCCESS') {
        return { success: true };
      }
      
      // 에러 케이스들 처리
      if (result.code === 'UNAUTHORIZED_ACCESS_SUBMISSION') {
        return { success: false, error: '과제 제출 조회 권한이 없습니다.' };
      }
      if (result.code === 'STUDY_NOT_FOUND') {
        return { success: false, error: '스터디를 찾을 수 없습니다.' };
      }
      if (result.code === 'STUDY_USER_NOT_FOUND') {
        return { success: false, error: '해당 스터디 멤버를 찾을 수 없습니다.' };
      }
      if (result.code === 'ASSIGNMENT_NOT_FOUND') {
        return { success: false, error: '과제를 찾을 수 없습니다.' };
      }
      if (result.code === 'SUBMISSION_NOT_FOUND') {
        return { success: false, error: '과제 제출 내역을 찾을 수 없습니다.' };
      }
      
      return { success: false, error: result.message || '과제 삭제에 실패했습니다.' };
    } catch (error) {
      console.error('과제 삭제 오류:', error);
      return { success: false, error: '과제 삭제 중 오류가 발생했습니다.' };
    }
  };


  // 과제 제출 모달 열기
  const openAssignmentSubmissionModal = (assignment, mode = 'create', submissionData = null) => {
    setAssignmentSubmissionModal({
      isOpen: true,
      planId: assignment.assignmentId,
      assignment: assignment,
      mode: mode,
      submissionId: submissionData?.submissionId || submissionData?.id
    });
    
    if (mode === 'edit') {
      // 수정 모드일 때 기존 데이터 로드
      const data = submissionData || submittedAssignments[assignment.assignmentId];
      setAssignmentSubmissionFormData({
        content: data?.content || "",
        password: data?.password || ""
      });
      // 수정 모드에서는 비밀번호를 보이게 설정
      setShowPassword(true);
    } else {
      // 생성 모드일 때 빈 데이터
    setAssignmentSubmissionFormData({
      content: "",
      password: ""
    });
    }
    setShowPassword(false);
  };

  // 과제 제출 모달 닫기
  const closeAssignmentSubmissionModal = () => {
    setAssignmentSubmissionModal({
      isOpen: false,
      planId: null,
      assignment: null
    });
    setAssignmentSubmissionFormData({
      content: "",
      password: ""
    });
    setShowPassword(false);
  };

  // 과제 제출/수정 처리
  const handleAssignmentSubmission = async () => {
    try {
      // 필수 필드 검증
      if (!assignmentSubmissionFormData.content || assignmentSubmissionFormData.content.trim() === '') {
        alert('과제 주소를 입력해주세요.');
        return;
      }
      if (!assignmentSubmissionFormData.password || assignmentSubmissionFormData.password.trim() === '') {
        alert('비밀번호를 입력해주세요.');
        return;
      }

      let result;
      if (assignmentSubmissionModal.mode === 'edit') {
        // 수정 모드 - submitId 필요
        const submitId = assignmentSubmissionModal.submissionId || submittedAssignments[assignmentSubmissionModal.planId]?.submissionId;
        if (!submitId) {
          alert('과제 제출 정보를 찾을 수 없습니다.');
          return;
        }
        result = await updateAssignmentSubmission(assignmentSubmissionModal.planId, submitId, assignmentSubmissionFormData);
      if (result.success) {
          alert('과제가 성공적으로 수정되었습니다!');
          // 제출된 과제 정보 업데이트
          setSubmittedAssignments(prev => ({
            ...prev,
            [assignmentSubmissionModal.planId]: {
              ...result.data,
              submissionId: result.data.submissionId || result.data.id
            }
          }));
          closeAssignmentSubmissionModal();
        } else {
          alert(`과제 수정 실패: ${result.error}`);
        }
      } else {
        // 생성 모드
        result = await submitAssignment(assignmentSubmissionModal.planId, assignmentSubmissionFormData);
        
        if (result.success) {
          // 제출된 과제 정보 저장 (submissionId 포함)
        setSubmittedAssignments(prev => ({
          ...prev,
            [assignmentSubmissionModal.planId]: {
              ...result.data,
              submissionId: result.data.submissionId || result.data.id
            }
          }));
          
          // 중복 제출인 경우 다른 메시지 표시
          if (result.isDuplicate) {
            alert('이미 제출된 과제입니다. 제출 정보를 불러왔습니다.');
          } else {
            alert('과제가 성공적으로 제출되었습니다!');
          }
        
        closeAssignmentSubmissionModal();
      } else {
        alert(`과제 제출 실패: ${result.error}`);
      }
      }
    } catch (error) {
      console.error('과제 처리 오류:', error);
      alert(`과제 ${assignmentSubmissionModal.mode === 'edit' ? '수정' : '제출'} 중 오류가 발생했습니다.`);
    }
  };

  // 과제 삭제 처리
  const handleDeleteAssignmentSubmission = async (planId) => {
    if (!confirm('정말로 과제 제출을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const submitId = submittedAssignments[planId]?.submissionId;
      if (!submitId) {
        alert('과제 제출 정보를 찾을 수 없습니다.');
        return;
      }
      const result = await deleteAssignmentSubmission(planId, submitId);
      
      if (result.success) {
        alert('과제 제출이 성공적으로 삭제되었습니다!');
        
        // 제출된 과제 정보에서 제거
        setSubmittedAssignments(prev => {
          const newState = { ...prev };
          delete newState[planId];
          return newState;
        });
      } else {
        alert(`과제 삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('과제 삭제 오류:', error);
      alert('과제 삭제 중 오류가 발생했습니다.');
    }
  };

  // 활동 수정 제출
  const handleUpdateActivity = async () => {
    try {
      // 필수 필드 검증
      if (!activityEditFormData.title.trim()) {
        alert('활동 제목을 입력해주세요.');
        return;
      }
      if (!activityEditFormData.week.trim()) {
        alert('주차를 입력해주세요.');
        return;
      }
      if (!activityEditFormData.content.trim()) {
        alert('활동 내용을 입력해주세요.');
        return;
      }

      // 주차 검증 (숫자만)
      const weekNumber = parseInt(activityEditFormData.week);
      if (!weekNumber || weekNumber < 1 || weekNumber > 20) {
        alert('주차는 1부터 20 사이의 숫자로 입력해주세요.');
        return;
      }

      // 출석체크 데이터 생성 (사용되지 않음 - 제거)

      // 수정할 데이터 준비
      const formData = {
        title: activityEditFormData.title.trim(),
        content: activityEditFormData.content.trim(),
        week: `${weekNumber}주차`,
        image: activityEditFormData.image,
        attendance: Object.fromEntries(
          menteeList.map(mentee => [
            mentee.studentNumber,
            {
              studentNumber: mentee.studentNumber,
              name: mentee.name,
              type: activityEditFormData.attendance[mentee.studentNumber]?.type || 'ATTEND'
            }
          ])
        )
      };

      // API 호출
      const activityId = activityEditModal.activity.studyActivityId || activityEditModal.activity.id;
      
      if (!activityId || activityId === 'undefined' || activityId.toString().startsWith('temp-') || isNaN(Number(activityId))) {
        alert('활동 ID가 유효하지 않습니다. 페이지를 새로고침 후 다시 시도해주세요.');
        return;
      }

      const result = await updateActivity(activityId, formData);
      
      if (result.success) {
        alert('활동이 성공적으로 수정되었습니다!');
        closeActivityEditModal();
        await fetchActivityPhotos(); // 목록 새로고침
      } else {
        alert(result.error);
      }
    } catch {
      alert('활동 수정에 실패했습니다.');
    }
  };

  // 활동 삭제 처리
  const handleDeleteActivity = async (activity) => {
    if (!window.confirm(`"${activity.title}" 활동을 삭제하시겠습니까?\n삭제된 활동은 복구할 수 없습니다.`)) {
      return;
    }

    const activityId = activity.studyActivityId || activity.id;

    if (!activityId || activityId === 'undefined' || activityId.toString().startsWith('temp-') || isNaN(Number(activityId))) {
      alert('활동 ID가 유효하지 않습니다. 페이지를 새로고침 후 다시 시도해주세요.');
      return;
    }

    try {
      const result = await deleteActivity(activityId);
      
      if (result.success) {
        alert('활동이 성공적으로 삭제되었습니다!');
        closeActivityDetailModal();
        await fetchActivityPhotos(); // 목록 새로고침
      } else {
        alert(result.error);
      }
    } catch {
      alert('활동 삭제에 실패했습니다.');
    }
  };

  // 활동 사진 모달 열기 함수
  const openActivityPhotosModal = async () => {
    setActivityPhotosModal({ isOpen: true });
    await fetchActivityPhotos();
  };

  // 활동 사진 모달 닫기 함수
  const closeActivityPhotosModal = () => {
    setActivityPhotosModal({ isOpen: false });
  };

  // 멘티 목록 조회 함수
  const fetchMenteeList = useCallback(async () => {
    try {
      const url = `${API_BASE}/group/${groupId}/mentee`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      // 응답 안전 파싱
      let result;
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        try { result = JSON.parse(text); }
        catch {
          setMenteeList([]);
          return;
        }
      }

      // HTTP 에러 처리
      if (!response.ok) {
        setMenteeList([]);
        return;
      }

      // 비즈니스 코드 처리
      if (result.code === 'SUCCESS' && Array.isArray(result.data)) {
        setMenteeList(result.data);
      } else {
        setMenteeList([]);
      }
    } catch {
      setMenteeList([]);
    }
  }, [groupId, token]);

  // 주차별 출석 조회 함수
  const fetchAttendanceByWeek = async (week) => {
    try {
      const url = `${API_BASE}/group/${groupId}/attendance/week/${encodeURIComponent(week)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      // 안전 파싱
      let result;
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        try { result = JSON.parse(text); } catch { return []; }
      }

      if (!response.ok) return [];
      return result.code === 'SUCCESS' && Array.isArray(result.data) ? result.data : (result.data || []);
    } catch {
      return [];
    }
  };

  // 전체 주차별 출석 데이터 가져오기
  const fetchAllWeeksAttendance = useCallback(async () => {
    if (isMentor) return; // 멘토는 출석 상태를 표시하지 않음

    try {
      const url = `${API_BASE}/group/${groupId}/attendance/all-weeks`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      // 안전 파싱
      let result;
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        try { result = JSON.parse(text); } catch { return; }
      }
      if (!response.ok || result.code !== 'SUCCESS') return;

      const allAttendanceData = result.data || {};

      // 내 학번 복원 (prop token 우선, 이후 로컬 저장소/세션/쿠키 순)
      const tryDecodeStudentNo = (jwt) => {
        if (!jwt) return null;
        try {
          const payload = JSON.parse(atob(jwt.split('.')[1]));
          const n = parseInt(
            payload.studentNumber ?? payload.sub ?? payload.userId ?? payload.id
          );
          return Number.isNaN(n) ? null : n;
        } catch {
          return null;
        }
      };

      let myStudentNumber =
        tryDecodeStudentNo(token) ||
        tryDecodeStudentNo(
          localStorage.getItem('token') ||
          localStorage.getItem('accessToken') ||
          localStorage.getItem('jwt')
        ) ||
        tryDecodeStudentNo(
          sessionStorage.getItem('token') ||
          sessionStorage.getItem('accessToken') ||
          sessionStorage.getItem('jwt')
        );

      if (!myStudentNumber) {
        const fallback =
          parseInt(localStorage.getItem('studentNumber')) ||
          parseInt(localStorage.getItem('student_number')) ||
          parseInt(localStorage.getItem('userStudentNumber'));
        myStudentNumber = Number.isNaN(fallback) ? null : fallback;
      }

      const attendanceMap = {};

      // 각 활동(week)별 본인 출석 상태 매핑
      for (const photo of activityPhotos) {
        const weekKey = photo.week;
        const weekAttendance = allAttendanceData?.[weekKey];
        if (!Array.isArray(weekAttendance) || !myStudentNumber) continue;

        const mine = weekAttendance.find(
          (att) => att.studentNumber === myStudentNumber
        );
        if (mine) attendanceMap[photo.id] = mine.attendanceType;
      }

      setMenteeAttendanceData(attendanceMap);

      // 출석률 계산
      const totalWeeks = activityPhotos.length;
      const attendedWeeks = Object.values(attendanceMap).filter(
        (s) => s === 'ATTEND'
      ).length;
      const rate = totalWeeks > 0 ? Math.round((attendedWeeks / totalWeeks) * 100) : 0;
      setAttendanceRate(rate);
    } catch {
      // 출석 데이터 가져오기 실패 시 무시
    }
  }, [isMentor, groupId, token, activityPhotos]);


  // 활동 사진 목록 조회 함수
  const fetchActivityPhotos = useCallback(async () => {
    try {
      setLoadingPhotos(true);

      const response = await fetch(`${API_BASE}/group/${groupId}/activity-list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      // 안전 파싱
      let result;
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        try { result = JSON.parse(text); } catch {
          alert('서버에서 예상치 못한 응답을 받았습니다.');
          return;
        }
      }

      if (response.ok && result.code === 'SUCCESS') {
        const activityList = result.data || [];
        const photoDataList = activityList.map((activityData, index) => {
          // 서버가 준 이미지 경로를 파일명으로 정규화해서 API_BASE로 프록시
          const normalizedImage = toImageApiUrl(activityData.imageUrl);

          return {
            id:
              activityData.activityId ||
              activityData.studyActivityId ||
              activityData.id ||
              `temp-${index}`,
            studyActivityId:
              activityData.activityId ||
              activityData.studyActivityId ||
              activityData.id,
            title: activityData.title,
            week: activityData.week,
            content: activityData.content,
            imageUrl: normalizedImage,
            uploadedAt: activityData.createdAt,
            attendanceList:
              activityData.studyAttendanceDtoList ||
              activityData.attendanceList ||
              [],
          };
        });
        setActivityPhotos(photoDataList);
      } else if (result?.code === 'STUDY_ACTIVITY_NOT_FOUND') {
        setActivityPhotos([]);
      } else {
        alert(result?.message || '활동 사진을 불러오는데 실패했습니다.');
        setActivityPhotos([]);
      }
    } catch {
      alert('활동 사진을 불러오는데 실패했습니다.');
      setActivityPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  }, [groupId, token]);


  // 삭제 확인 함수
  const handleDeleteAssignment = async () => {
    try {
      if (!deleteModal.assignment) return;
      
      const result = await deleteAssignment(deleteModal.assignment.assignmentId);
      
      if (result.success) {
        alert('커리큘럼이 성공적으로 삭제되었습니다!');
        setDeleteModal({ isOpen: false, assignment: null });
        fetchAssignments(); // 목록 새로고침
      } else {
        alert(result.error.message);
      }
    } catch {
      alert('커리큘럼 삭제에 실패했습니다.');
    }
  };

  // 과제 제출 함수 (생성/수정)
  const handleAssignmentSubmit = async (e) => {
    e?.preventDefault?.();
    try {
      // 제목 유효성 검사
      if (!assignmentFormData.title || assignmentFormData.title.trim() === '') {
        alert('커리큘럼 제목을 입력해주세요.');
        return;
      }
      
      // 내용 유효성 검사
      if (!assignmentFormData.description || assignmentFormData.description.trim() === '') {
        alert('커리큘럼 내용을 입력해주세요.');
        return;
      }
      
      // 시작 날짜 유효성 검사
      if (!assignmentFormData.startDate || assignmentFormData.startDate === '') {
        alert('시작 날짜를 선택해주세요.');
        return;
      }
      
      // 마감 날짜 유효성 검사
      if (!assignmentFormData.endDate || assignmentFormData.endDate === '') {
        alert('마감 날짜를 선택해주세요.');
        return;
      }
      
      // 날짜 순서 검사
      const startDate = new Date(assignmentFormData.startDate);
      const endDate = new Date(assignmentFormData.endDate);
      
      if (startDate >= endDate) {
        alert('마감 날짜는 시작 날짜보다 늦어야 합니다.');
        return;
      }
      
      let result;
      
      if (assignmentModal.mode === 'create') {
        result = await createAssignment(assignmentFormData);
      } else if (assignmentModal.mode === 'edit' && assignmentModal.assignment) {
        result = await updateAssignment(assignmentModal.assignment.assignmentId, assignmentFormData);
      } else {
        throw new Error('잘못된 모달 모드입니다.');
      }
      
      if (result.success) {
        const message = assignmentModal.mode === 'create' ? '커리큘럼이 성공적으로 생성되었습니다!' : '커리큘럼이 성공적으로 수정되었습니다!';
        alert(message);
        closeAssignmentModal();
        fetchAssignments(); // 목록 새로고침
      } else {
        alert(result.error.message);
      }
    } catch {
      alert(assignmentModal.mode === 'create' ? '커리큘럼 생성에 실패했습니다.' : '커리큘럼 수정에 실패했습니다.');
    }
  };
  // 모달 닫기 (정의 누락으로 no-undef 발생하던 부분)
  const closeAssignmentModal = React.useCallback(() => {
    setAssignmentModal({ isOpen: false, mode: 'create', assignment: null });
    setAssignmentFormData({
      title: "",
      description: "",
      hasAssignment: false,
      startDate: "",
      endDate: ""
    });
  }, []);


  // 주차별 과제 확장/축소 토글 함수
  const toggleWeekExpansion = (week) => {
    setExpandedWeeks(prev => {
      const willOpen = !prev[week];
      return { ...prev, [week]: willOpen };
    });
  };

  // URL 파라미터에서 activityId 확인하여 활동상세보기 모달 열기
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const activityId = urlParams.get('activityId');
    
    if (activityId && activityPhotos.length > 0) {
      const activity = activityPhotos.find(photo => photo.id === parseInt(activityId));
      if (activity) {
        openActivityDetailModal(activity);
      }
    }
  }, [activityPhotos]);

  // 브라우저 뒤로가기/앞으로가기 처리
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const activityId = urlParams.get('activityId');
      
      if (activityId && activityPhotos.length > 0) {
        const activity = activityPhotos.find(photo => photo.id === parseInt(activityId));
        if (activity) {
          openActivityDetailModal(activity);
        }
      } else {
        closeActivityDetailModal();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activityPhotos]);

  useEffect(() => {
    fetchAssignments();
    fetchMenteeList();
    fetchActivityPhotos(); // 활동사진도 미리 로딩
  }, [fetchAssignments]);

  // 사용자 프로필 로드
  useEffect(() => {
    if (token && !isMentor) {
      fetchUserProfile();
    }
  }, [token, isMentor]);

  // 멘티 목록 로드 (멘토만)
  useEffect(() => {
    if (token && isMentor) {
      fetchMentees();
    }
  }, [token, isMentor]);

  // 과제 제출 목록 미리 로드 (멘토만)
  useEffect(() => {
    const loadAllSubmissionLists = async () => {
      if (token && isMentor && assignments.length > 0) {
        const promises = assignments
          .filter(assignment => assignment.hasAssignment)
          .map(assignment => fetchAssignmentSubmissionList(assignment.assignmentId));
        
        await Promise.all(promises);
      }
    };
    
    loadAllSubmissionLists();
  }, [token, isMentor, assignments]);

  // 과제 제출 정보 로드 (멘티만)
  useEffect(() => {
    if (!isMentor && assignments.length > 0 && userProfile) {
      fetchAllAssignmentSubmissions();
    }
  }, [assignments, isMentor, userProfile]);

  // 활동사진이 로드된 후 멘티 출석 상태 가져오기
  useEffect(() => {
    if (activityPhotos.length > 0 && !isMentor) {
      fetchAllWeeksAttendance();
    }
  }, [activityPhotos, isMentor]);

  // 멘티 경고 횟수 조회
  useEffect(() => {
    if (!isMentor && token) {
      fetchMenteeWarnings();
    }
  }, [isMentor, token]);

  // localStorage 변경 감지 및 커스텀 이벤트 감지
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === `warnings_${groupId}` && !isMentor) {
        fetchMenteeWarnings();
      }
    };

    const handleWarningsUpdated = (e) => {
      if (e.detail.groupId === groupId && !isMentor) {
        fetchMenteeWarnings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('warningsUpdated', handleWarningsUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('warningsUpdated', handleWarningsUpdated);
    };
  }, [groupId, isMentor]);

  // 멘티 경고 횟수 조회 함수 (로컬 저장소에서 관리)
  const fetchMenteeWarnings = useCallback(() => {
    try {
      // JWT 토큰에서 학번 추출
      let myStudentNumber = null;
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        myStudentNumber = parseInt(tokenPayload.studentNumber || tokenPayload.sub || tokenPayload.userId || tokenPayload.id);
      } catch {
        setMenteeWarnings(0);
        return;
      }

      if (myStudentNumber) {
        // 로컬 저장소에서 경고 횟수 조회
        const storedWarnings = localStorage.getItem(`warnings_${groupId}`);
        if (storedWarnings) {
          const warnings = JSON.parse(storedWarnings);
          setMenteeWarnings(warnings[myStudentNumber] || 0);
        } else {
          setMenteeWarnings(0);
        }
      } else {
        setMenteeWarnings(0);
      }
    } catch {
      // 경고 조회 실패 시 0으로 설정
      setMenteeWarnings(0);
    }
  }, [token, groupId]);

  return (
    <div className="curriculum-section">
      {/* 주차별 과제 제출 테이블 */}
      <div className="group-assignments curriculum-list">
        <div className="group-assignments-header">
          <h2 className="group-assignments-title">
            커리큘럼
            {isMentor && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn assignment-create-btn"
                  onClick={() => openAssignmentModal('create')}
                >
                  <i className="fas fa-plus"></i> 커리큘럼 생성
                </button>
                <button 
                  className="btn activity-record-btn"
                  onClick={() => openActivityModal()}
                >
                  <i className="fas fa-camera"></i> 활동 업로드
                </button>
                <button 
                  className="btn activity-photos-btn"
                  onClick={openActivityPhotosModal}
                >
                  <i className="fas fa-images"></i> 활동 기록 보기
                </button>
              </div>
            )}
          </h2>
        </div>
        
        {/* 과제 포함 필터 버튼 */}
        <div className="curriculum-filter-buttons">
          <button 
            className={`btn btn-filter ${assignmentFilter === 'all' ? 'active' : ''}`}
            onClick={() => setAssignmentFilter('all')}
          >
            전체 ({assignments.length})
          </button>
          <button 
            className={`btn btn-filter ${assignmentFilter === 'with-assignment' ? 'active' : ''}`}
            onClick={() => setAssignmentFilter('with-assignment')}
          >
            과제 포함 ({assignments.filter(a => a.hasAssignment).length})
          </button>
          <button 
            className={`btn btn-filter ${assignmentFilter === 'without-assignment' ? 'active' : ''}`}
            onClick={() => setAssignmentFilter('without-assignment')}
          >
            과제 없음 ({assignments.filter(a => !a.hasAssignment).length})
          </button>
        </div>
        
        {!isMentor && (
            <div className="mentee-activity-photos-container">
              <div className="attendance-rate-display">
                <span className="attendance-rate-label">출석률:</span>
                <span className={`attendance-rate-value ${attendanceRate >= 80 ? 'high' : attendanceRate >= 60 ? 'medium' : 'low'}`}>
                  {attendanceRate}%
                </span>
              </div>
              <button 
                className="btn activity-photos-btn mentee-photos-btn"
                onClick={openActivityPhotosModal}
              >
                <i className="fas fa-images"></i> 활동 사진 보기
              </button>
            </div>
          )}
       
        {/* 커리큘럼 목록 */}
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => (
            <div key={assignment.assignmentId} className="week-assignment week-curriculum">
              <button 
                className={`week-button ${expandedWeeks[`assignment-${assignment.assignmentId}`] ? 'expanded' : ''}`}
                onClick={() => toggleWeekExpansion(`assignment-${assignment.assignmentId}`)}
              >
                <div className="week-button-content">
                  <div className="week-title-container">
                    <h3 className="week-title">{assignment.title}</h3>
                  </div>
                  <div className="week-summary">
                    <span className="week-status">
                      {assignment.hasAssignment ? '과제 포함' : '과제 미포함'}
                    </span>
                    <i className={`fas fa-chevron-down week-icon`}></i>
                  </div>
                </div>
              </button>

              <div className={`week-content ${expandedWeeks[`assignment-${assignment.assignmentId}`] ? 'expanded' : ''}`}>
                <div className="curriculum-detail">
                  <div className="curriculum-detail-header">
                    <div className="curriculum-meta">
                      <span className="meta-item">
                        <i className="fas fa-user"></i>
                        작성자: {assignment.creatorName || '익명'}
                      </span>
                      <span className="meta-item">
                        <i className="fas fa-calendar"></i>
                        작성일: {assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString('ko-KR') : '날짜 미정'}
                      </span>
                    </div>
                    {isMentor && (
                      <div className="curriculum-actions">
                        {isMentor && (
                          <>
                            <button 
                              className="btn btn-small curriculum-edit-btn"
                              onClick={() => openAssignmentModal('edit', assignment)}
                            >
                              <i className="fas fa-edit"></i> 수정
                            </button>
                            <button 
                              className="btn btn-small btn-danger"
                              onClick={() => setDeleteModal({ isOpen: true, assignment })}
                            >
                              <i className="fas fa-trash"></i> 삭제
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="curriculum-content">
                    <div dangerouslySetInnerHTML={{ __html: assignment.content }} />
                  </div>
                  
                  {/* 멘티용 과제 제출 섹션 */}
                  {!isMentor && assignment.hasAssignment && (
                    <div className="assignment-submission-section">
                      {submittedAssignments[assignment.assignmentId] ? (
                        <div className="submitted-assignment">
                          <div className="submission-info">
                            <h4>제출된 과제</h4>
                            <p><strong>주소:</strong> {submittedAssignments[assignment.assignmentId].content}</p>
                            <p><strong>제출일:</strong> {new Date(submittedAssignments[assignment.assignmentId].createdAt).toLocaleString('ko-KR')}</p>
                            {submittedAssignments[assignment.assignmentId].creatorName && (
                              <p><strong>제출자:</strong> {submittedAssignments[assignment.assignmentId].creatorName}</p>
                            )}
                          </div>
                          <div className="submission-actions">
                            <button 
                              className="btn btn-small btn-secondary"
                              onClick={() => openAssignmentSubmissionModal(assignment, 'edit')}
                            >
                              <i className="fas fa-edit"></i> 수정
                            </button>
                            <button 
                              className="btn btn-small btn-danger"
                              onClick={() => handleDeleteAssignmentSubmission(assignment.assignmentId)}
                            >
                              <i className="fas fa-trash"></i> 삭제
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="assignment-submission-prompt">
                          <p>이 커리큘럼에는 과제가 포함되어 있습니다.</p>
                          <button 
                            className="btn btn-primary"
                            onClick={() => openAssignmentSubmissionModal(assignment)}
                          >
                            <i className="fas fa-paper-plane"></i> 과제 제출하기
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 멘토용 과제 제출 목록 섹션 */}
                  {isMentor && assignment.hasAssignment && (
                    <div className="assignment-submission-list-section">
                      <div className="submission-list-header">
                        <div className="submission-list-title-section">
                          <h4>과제 제출 현황</h4>
                          <div className="submission-stats">
                            <span className="submission-count">
                              제출: {assignmentSubmissionList[assignment.assignmentId]?.length || 0}명
                            </span>
                            <span className="unsubmitted-count">
                              미제출: {getUnsubmittedCount(assignment.assignmentId)}명
                            </span>
                          </div>
                        </div>
                        <button 
                          className="btn btn-small btn-primary"
                          onClick={() => toggleSubmissionList(assignment.assignmentId)}
                        >
                          <i className={`fas fa-chevron-${showSubmissionList[assignment.assignmentId] ? 'up' : 'down'}`}></i>
                          {showSubmissionList[assignment.assignmentId] ? '숨기기' : '보기'}
                        </button>
                      </div>
                      
                      {showSubmissionList[assignment.assignmentId] && (
                        <div className="submission-list-content">
                          {assignmentSubmissionList[assignment.assignmentId] && assignmentSubmissionList[assignment.assignmentId].length > 0 ? (
                            <div className="submission-list">
                              {assignmentSubmissionList[assignment.assignmentId].map((submission, index) => (
                                <div key={submission.submissionId || index} className="submission-item">
                                  <div className="submission-info">
                                    <div className="submission-header">
                                      <h5>{submission.creatorName || '익명'}</h5>
                                      <span className="submission-date">
                                        {new Date(submission.createdAt).toLocaleString('ko-KR')}
                                      </span>
                                    </div>
                                    <p className="submission-content">
                                      <strong>주소:</strong> 
                                      <span 
                                        className="submission-url-link"
                                        onClick={() => openUrlInNewTab(submission.content)}
                                        title="클릭하여 링크 열기"
                                      >
                                        {submission.content}
                                      </span>
                                    </p>
                                    
                                    {/* 자세히보기 버튼 */}
                                    <button 
                                      className="btn btn-small btn-outline submission-detail-btn"
                                      onClick={() => toggleSubmissionDetail(assignment.assignmentId, submission.submissionId || submission.id)}
                                      title="자세히보기"
                                    >
                                      <i className={`fas fa-chevron-${expandedSubmissions[`${assignment.assignmentId}-${submission.submissionId || submission.id}`] ? 'up' : 'down'}`}></i>
                                    </button>
                                    
                                    {/* 상세 정보 (확장 시 표시) */}
                                    {expandedSubmissions[`${assignment.assignmentId}-${submission.submissionId || submission.id}`] && (
                                      <div className="submission-detail">
                                        <div className="detail-section">
                                          <h6>상세 정보</h6>
                                          <p><strong>제출자:</strong> {expandedSubmissions[`${assignment.assignmentId}-${submission.submissionId || submission.id}`].creatorName || '익명'}</p>
                                          <p><strong>제출일:</strong> {new Date(expandedSubmissions[`${assignment.assignmentId}-${submission.submissionId || submission.id}`].createdAt).toLocaleString('ko-KR')}</p>
                                          <p>
                                            <strong>주소:</strong> 
                                            <span 
                                              className="submission-url-link"
                                              onClick={() => openUrlInNewTab(expandedSubmissions[`${assignment.assignmentId}-${submission.submissionId || submission.id}`].content)}
                                              title="클릭하여 링크 열기"
                                            >
                                              {expandedSubmissions[`${assignment.assignmentId}-${submission.submissionId || submission.id}`].content}
                                            </span>
                                          </p>
                                          {expandedSubmissions[`${assignment.assignmentId}-${submission.submissionId || submission.id}`].password && (
                                            <p><strong>비밀번호:</strong> {expandedSubmissions[`${assignment.assignmentId}-${submission.submissionId || submission.id}`].password}</p>
                                          )}
                                          <p><strong>제출 ID:</strong> {expandedSubmissions[`${assignment.assignmentId}-${submission.submissionId || submission.id}`].submissionId}</p>
                                          {expandedSubmissions[`${assignment.assignmentId}-${submission.submissionId || submission.id}`].feedback && (
                                            <p><strong>피드백:</strong> {expandedSubmissions[`${assignment.assignmentId}-${submission.submissionId || submission.id}`].feedback}</p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="submission-info-only">
                                    <span className="submission-status">
                                      <i className="fas fa-check-circle"></i> 제출 완료
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="no-submissions">
                              <p>아직 제출된 과제가 없습니다.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="curriculum-dates">
                    {assignment.startDate && (
                      <span className="curriculum-date">
                        <i className="fas fa-play"></i>
                        시작: {new Date(assignment.startDate).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                    {assignment.endDate && (
                      <span className="curriculum-date">
                        <i className="fas fa-stop"></i>
                        마감: {new Date(assignment.endDate).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-assignments no-curriculum">
            {assignments.length === 0 ? (
              <>
                <p className="no-assignments-text no-curriculum-text">아직 등록된 커리큘럼이 없습니다.</p>
                <p className="no-assignments-hint no-curriculum-hint">커리큘럼 생성 버튼을 클릭하여 첫 번째 커리큘럼을 등록해보세요.</p>
              </>
            ) : (
              <>
                <p className="no-assignments-text no-curriculum-text">
                  {assignmentFilter === 'with-assignment' && '과제가 포함된 커리큘럼이 없습니다.'}
                  {assignmentFilter === 'without-assignment' && '과제가 없는 커리큘럼이 없습니다.'}
                </p>
                <p className="no-assignments-hint no-curriculum-hint">다른 필터를 선택해보세요.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* 과제 생성/수정 모달 */}
      {assignmentModal.isOpen && (
        <div className="assignment-modal-overlay">
          <div className="assignment-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="assignment-modal-header">
              <h3 className="assignment-modal-title">
                {assignmentModal.mode === 'create' ? '커리큘럼 생성' : '커리큘럼 수정'}
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
                  placeholder="커리큘럼 제목을 입력하세요"
                />
              </div>
              
              <div className="form-group">
                <label>설명</label>
                <div className="tinymce-editor-container">
                  <Editor
                    apiKey={import.meta.env.VITE_TINYMCE_API_KEY || ''}
                    init={tinymceConfig}
                    value={assignmentFormData.description}
                    onEditorChange={(content) => setAssignmentFormData({...assignmentFormData, description: content})}
                  />
                </div>
              </div>
              
              <div className="form-group checkbox-row">
                <span className="checkbox-label">과제 포함</span>
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={!!assignmentFormData.hasAssignment}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, hasAssignment: e.target.checked })}
                  />
                  <span className="box"></span>
                </label>
              </div>
              
              <div className="form-group date-inputs-row">
                <div className="date-input-group">
                  <label>시작일</label>
                  <DatePicker
                    selected={assignmentFormData.startDate ? new Date(assignmentFormData.startDate) : null}
                    onChange={(date) => {
                      if (date) {
                        // 로컬 시간대로 포맷팅 (UTC 변환 방지)
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
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="yyyy-MM-dd HH:mm"
                    placeholderText="시작일을 선택하세요"
                    className="date-picker-input"
                    locale="ko"
                    utcOffset={0}
                  />
                </div>
                
                <div className="date-input-group">
                  <label>마감일</label>
                  <DatePicker
                    selected={assignmentFormData.endDate ? new Date(assignmentFormData.endDate) : null}
                    onChange={(date) => {
                      if (date) {
                        // 로컬 시간대로 포맷팅 (UTC 변환 방지)
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
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="yyyy-MM-dd HH:mm"
                    placeholderText="마감일을 선택하세요"
                    className="date-picker-input"
                    locale="ko"
                    minDate={assignmentFormData.startDate ? new Date(assignmentFormData.startDate) : null}
                    utcOffset={0}
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

      {/* 활동 기록 모달 */}
      {activityModal.isOpen && (
        <div className="activity-modal-overlay">
          <div className="activity-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="activity-modal-header">
              <h3 className="activity-modal-title">활동 기록</h3>
              <button className="activity-modal-close" onClick={closeActivityModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="activity-modal-body">
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  value={activityFormData.title}
                  onChange={(e) => handleActivityFormChange('title', e.target.value)}
                  required
                  maxLength={100}
                  placeholder="활동 제목을 입력하세요"
                />
              </div>
              
              <div className="form-group">
                <label>주차</label>
                <input
                  type="number"
                  value={activityFormData.week}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (Number(value) > 0 && Number(value) <= 20)) {
                      handleActivityFormChange('week', value);
                    }
                  }}
                  required
                  min="1"
                  max="20"
                  placeholder="예: 1, 2, 3"
                />
              </div>
              
              <div className="form-group">
                <label>활동 내용</label>
                <input
                  type="text"
                  value={activityFormData.content || ''}
                  onChange={(e) => handleActivityFormChange('content', e.target.value)}
                  required
                  maxLength={500}
                  placeholder="활동 내용을 입력하세요"
                />
              </div>
              
              <div className="form-group">
                <label>사진 업로드</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleActivityImageChange}
                />
                {activityFormData.image && (
                  <div className="image-preview">
                    <p>선택된 파일: {activityFormData.image.name}</p>
                  </div>
                )}
              </div>

              {/* 출석체크 섹션 */}
              {isMentor && menteeList.length > 0 && (
                <div className="form-group">
                  <label>출석체크</label>
                  <div className="attendance-table-container">
                    <table className="attendance-table">
                      <tbody>
                        {menteeList.map(mentee => (
                          <tr key={mentee.studentNumber}>
                            <td className="mentee-name-cell">{mentee.name}</td>
                            <td className="attendance-cell">
                              <button
                                className={`attendance-btn attend ${attendanceData[mentee.studentNumber] === 'ATTEND' ? 'active' : ''}`}
                                onClick={() => handleAttendanceChange(mentee.studentNumber, 'ATTEND')}
                              >
                                출석
                              </button>
                            </td>
                            <td className="attendance-cell">
                              <button
                                className={`attendance-btn absence ${attendanceData[mentee.studentNumber] === 'ABSENCE' ? 'active' : ''}`}
                                onClick={() => handleAttendanceChange(mentee.studentNumber, 'ABSENCE')}
                              >
                                결석
                              </button>
                            </td>
                            <td className="attendance-cell">
                              <button
                                className={`attendance-btn makeup ${attendanceData[mentee.studentNumber] === 'MAKEUP' ? 'active' : ''}`}
                                onClick={() => handleAttendanceChange(mentee.studentNumber, 'MAKEUP')}
                              >
                                보강
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="activity-modal-footer">
              <button className="btn btn-secondary" onClick={closeActivityModal}>
                취소
              </button>
              <button className="btn btn-primary" onClick={submitActivityRecord}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteModal.isOpen && (
        <div className="assignment-modal-overlay">
          <div className="assignment-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="assignment-modal-header">
              <h3 className="assignment-modal-title">커리큘럼 삭제</h3>
              <button className="assignment-modal-close" onClick={() => setDeleteModal({ isOpen: false, assignment: null })}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="assignment-modal-body">
              <p>정말로 이 커리큘럼을 삭제하시겠습니까?</p>
              <p><strong>제목:</strong> {deleteModal.assignment?.title}</p>
              <p style={{ color: 'var(--red)', fontWeight: 'bold' }}>삭제된 커리큘럼은 복구할 수 없습니다.</p>
            </div>
            
            <div className="assignment-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteModal({ isOpen: false, assignment: null })}>
                취소
              </button>
              <button className="btn btn-danger" onClick={handleDeleteAssignment}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 과제 제출 모달 */}
      {assignmentSubmissionModal.isOpen && (
        <div className="assignment-modal-overlay">
          <div className="assignment-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="assignment-modal-header">
              <h3 className="assignment-modal-title">
                {assignmentSubmissionModal.mode === 'edit' ? '과제 수정' : '과제 제출'}
              </h3>
              <button className="assignment-modal-close" onClick={closeAssignmentSubmissionModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="assignment-modal-body">
              <div className="form-group">
                <label htmlFor="assignment-content">과제 주소 *</label>
                <input
                  type="url"
                  id="assignment-content"
                  className="form-control"
                  value={assignmentSubmissionFormData.content}
                  onChange={(e) => setAssignmentSubmissionFormData(prev => ({
                    ...prev,
                    content: e.target.value
                  }))}
                  placeholder="https://example.com"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="assignment-password">비밀번호 *</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="assignment-password"
                    className="form-control"
                    value={assignmentSubmissionFormData.password}
                    onChange={(e) => setAssignmentSubmissionFormData(prev => ({
                      ...prev,
                      password: e.target.value
                    }))}
                    placeholder="블로그/티스토리 비밀번호를 입력하세요"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="assignment-modal-footer">
              <button className="btn btn-secondary" onClick={closeAssignmentSubmissionModal}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleAssignmentSubmission}>
                {assignmentSubmissionModal.mode === 'edit' ? '수정' : '제출'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 활동 사진 모달 */}
      {activityPhotosModal.isOpen && (
        <div className="activity-photos-modal-overlay" onClick={closeActivityPhotosModal}>
          <div className="activity-photos-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="activity-photos-modal-header">
              <h3 className="activity-photos-modal-title">활동 사진</h3>
              <button className="activity-photos-modal-close" onClick={closeActivityPhotosModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="activity-photos-modal-body">
              {loadingPhotos ? (
                <div className="loading-spinner">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>활동 사진을 불러오는 중...</p>
                </div>
              ) : activityPhotos.length > 0 ? (
                <div className="activity-list-container">
                  {activityPhotos.map((photo) => (
                    <div key={photo.id} className="activity-list-item">
                      <div className="activity-list-content">
                        <h3 className="activity-list-title">{photo.title}</h3>
                        <div className="activity-list-meta">
                          <span className="activity-list-week">{photo.week}</span>
                          <span className="activity-list-date">{new Date(photo.uploadedAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                      <div className="activity-list-actions">
                        {!isMentor && menteeAttendanceData[photo.id] && (
                          <div className={`attendance-status ${menteeAttendanceData[photo.id].toLowerCase()}`}>
                            {menteeAttendanceData[photo.id] === 'ATTEND' && '출석'}
                            {menteeAttendanceData[photo.id] === 'ABSENCE' && '결석'}
                            {menteeAttendanceData[photo.id] === 'MAKEUP' && '보강'}
                          </div>
                        )}
                        <button 
                          className="activity-detail-btn"
                          onClick={() => openActivityDetailModal(photo)}
                        >
                          자세히보기
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-activity-photos">
                  <i className="fas fa-images"></i>
                  <p>아직 업로드된 활동 사진이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 활동 상세보기 모달 */}
      {activityDetailModal.isOpen && (
        <div className="activity-detail-modal-overlay" onClick={closeActivityDetailModal}>
          <div className="activity-detail-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="activity-detail-modal-header">
              <h3 className="activity-detail-modal-title">활동 상세보기</h3>
              <div className="activity-detail-modal-actions">
                {isMentor && (
                  <>
                    <button 
                      className="activity-edit-btn"
                      onClick={() => openActivityEditModal(activityDetailModal.activity)}
                    >
                      <i className="fas fa-edit"></i> 수정
                    </button>
                    <button 
                      className="activity-delete-btn"
                      onClick={() => handleDeleteActivity(activityDetailModal.activity)}
                    >
                      <i className="fas fa-trash"></i> 삭제
                    </button>
                  </>
                )}
                <button className="activity-detail-modal-close" onClick={closeActivityDetailModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <div className="activity-detail-modal-body">
              {activityDetailModal.activity && (
                <>
                  <div className="activity-detail-info">
                    <h4 className="activity-detail-title">{activityDetailModal.activity.title}</h4>
                    <div className="activity-detail-meta">
                      <span className="activity-detail-week">{activityDetailModal.activity.week}</span>
                      <span className="activity-detail-date">{new Date(activityDetailModal.activity.uploadedAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>

                  {activityDetailModal.activity.imageUrl && (
                    <div className="activity-detail-image-section">
                      <h5>활동 사진</h5>
                      <img 
                        src={activityDetailModal.activity.imageUrl} 
                        alt={activityDetailModal.activity.title} 
                        className="activity-detail-image"
                      />
                    </div>
                  )}

                  {activityDetailModal.activity.content && (
                    <div className="activity-detail-content-section">
                      <h5>활동 내용</h5>
                      <p className="activity-detail-content-text">{activityDetailModal.activity.content}</p>
                    </div>
                  )}

                  {activityDetailModal.activity.attendanceList && activityDetailModal.activity.attendanceList.length > 0 && (
                    <div className="activity-detail-attendance-section">
                      <h5>출석 현황</h5>
                      <div className="activity-detail-attendance-list">
                        {activityDetailModal.activity.attendanceList
                          .filter(attendance => 
                            isMentor || attendance.name === (menteeList.find(m => m.studentNumber === attendance.studentNumber)?.name)
                          )
                          .map((attendance, index) => (
                            <div key={`${attendance.studentNumber}-${index}`} className={`activity-detail-attendance-item ${attendance.type.toLowerCase()}`}>
                              <span className="activity-detail-attendance-name">{attendance.name}</span>
                              <span className="activity-detail-attendance-status">
                                {attendance.type === 'ATTEND' ? '출석' : 
                                 attendance.type === 'ABSENCE' ? '결석' : '보강'}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 활동 수정 모달 */}
      {activityEditModal.isOpen && (
        <div className="activity-modal-overlay">
          <div className="activity-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="activity-modal-header">
              <h3 className="activity-modal-title">활동 수정</h3>
              <button className="activity-modal-close" onClick={closeActivityEditModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="activity-modal-body">
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  value={activityEditFormData.title}
                  onChange={(e) => setActivityEditFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  maxLength={100}
                  placeholder="활동 제목을 입력하세요"
                />
              </div>
              
              <div className="form-group">
                <label>주차</label>
                <input
                  type="number"
                  value={activityEditFormData.week}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (Number(value) > 0 && Number(value) <= 20)) {
                      setActivityEditFormData(prev => ({ ...prev, week: value }));
                    }
                  }}
                  required
                  min="1"
                  max="20"
                  placeholder="예: 1, 2, 3 등"
                />
              </div>
              
              <div className="form-group">
                <label>활동 내용</label>
                <input
                  type="text"
                  value={activityEditFormData.content || ''}
                  onChange={(e) => setActivityEditFormData(prev => ({ ...prev, content: e.target.value }))}
                  required
                  maxLength={500}
                  placeholder="활동 내용을 입력하세요"
                />
              </div>
              
              <div className="form-group">
                <label>사진 업로드</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setActivityEditFormData(prev => ({ ...prev, image: e.target.files[0] }))}
                />
                {activityEditFormData.image && (
                  <div className="image-preview">
                    <p>선택된 파일: {activityEditFormData.image.name}</p>
                  </div>
                )}
                {activityEditModal.activity?.imageUrl && !activityEditFormData.image && (
                  <div className="current-image-preview">
                    <p>현재 이미지: {activityEditModal.activity.imageUrl.split('/').pop()}</p>
                    <img 
                      src={activityEditModal.activity.imageUrl} 
                      alt="현재 이미지" 
                      style={{ maxWidth: '200px', maxHeight: '150px', marginTop: '0.5rem' }}
                    />
                  </div>
                )}
              </div>

              {/* 출석체크 섹션 */}
              {isMentor && menteeList.length > 0 && (
                <div className="form-group">
                  <label>출석체크</label>
                  <div className="attendance-table-container">
                    <table className="attendance-table">
                      <tbody>
                        {menteeList.map(mentee => (
                          <tr key={mentee.studentNumber}>
                            <td className="mentee-name-cell">{mentee.name}</td>
                            <td className="attendance-cell">
                              <button
                                className={`attendance-btn attend ${activityEditFormData.attendance[mentee.studentNumber]?.type === 'ATTEND' ? 'active' : ''}`}
                                onClick={() => setActivityEditFormData(prev => ({
                                  ...prev,
                                  attendance: {
                                    ...prev.attendance,
                                    [mentee.studentNumber]: {
                                      studentNumber: mentee.studentNumber,
                                      name: mentee.name,
                                      type: 'ATTEND'
                                    }
                                  }
                                }))}
                              >
                                출석
                              </button>
                            </td>
                            <td className="attendance-cell">
                              <button
                                className={`attendance-btn absence ${activityEditFormData.attendance[mentee.studentNumber]?.type === 'ABSENCE' ? 'active' : ''}`}
                                onClick={() => setActivityEditFormData(prev => ({
                                  ...prev,
                                  attendance: {
                                    ...prev.attendance,
                                    [mentee.studentNumber]: {
                                      studentNumber: mentee.studentNumber,
                                      name: mentee.name,
                                      type: 'ABSENCE'
                                    }
                                  }
                                }))}
                              >
                                결석
                              </button>
                            </td>
                            <td className="attendance-cell">
                              <button
                                className={`attendance-btn makeup ${activityEditFormData.attendance[mentee.studentNumber]?.type === 'MAKEUP' ? 'active' : ''}`}
                                onClick={() => setActivityEditFormData(prev => ({
                                  ...prev,
                                  attendance: {
                                    ...prev.attendance,
                                    [mentee.studentNumber]: {
                                      studentNumber: mentee.studentNumber,
                                      name: mentee.name,
                                      type: 'MAKEUP'
                                    }
                                  }
                                }))}
                              >
                                보강
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="activity-modal-footer">
              <button className="btn btn-secondary" onClick={closeActivityEditModal}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleUpdateActivity}>
                수정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
