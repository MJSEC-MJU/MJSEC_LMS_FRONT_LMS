import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../client";

/* =======================================================================
   /lms 서브패스 배포 안전 베이스 계산 (정적 자산용)
   ======================================================================= */
const ENV_BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '/');
const RUNTIME_BASE = (() => {
  if (ENV_BASE !== '/') return ENV_BASE; // vite base가 정상 설정된 경우
  try {
    const p = window.location.pathname || '/';
    if (p.startsWith('/lms/')) return '/lms/';
  } catch {/* no-op */}
  return '/';
})();

/* =======================================================================
   정적 기본 이미지 (public/images/default-study.svg)
   ======================================================================= */
const DEFAULT_STUDY_SVG = `${RUNTIME_BASE}images/default-study.svg`;

/* =======================================================================
   유틸 (간소화)
   ======================================================================= */

// 그룹 이미지 URL 생성 (API 엔드포인트 방식)
const getGroupImageApiUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // 이미 완전한 URL인 경우 (http, https, data:)
  if (/^(https?:)?\/\//.test(imagePath) || imagePath.startsWith("data:")) {
    return imagePath;
  }
  
  // /uploads/ 경로인 경우 API 엔드포인트로 변환
  if (imagePath.startsWith("/uploads/")) {
    const base = (import.meta.env.BASE_URL || "/");
    return `${window.location.origin}${base}api/v1/image${imagePath.replace("/uploads", "")}`;
  }
  
  // 상대 경로인 경우 base URL과 결합
  const base = (import.meta.env.BASE_URL || "/");
  return `${base}${imagePath.replace(/^\//, "")}`;
};

/* =======================================================================
   컴포넌트
   ======================================================================= */
export default function GroupsList({ myStudies = [] }) {
  const { token } = useAuth();
  const [mentorInfo, setMentorInfo] = useState({});
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [generationFilter, setGenerationFilter] = useState(''); // 기수 검색어
  const [imageUrls, setImageUrls] = useState({}); // 이미지 URL 캐시

  // 이미지 로드 함수 (네브바와 동일한 API 방식)
  const loadImageWithAuth = async (imagePath, groupId) => {
    if (!imagePath || !token) return DEFAULT_STUDY_SVG;
    
    // 이미 캐시된 이미지가 있으면 반환
    if (imageUrls[groupId]) return imageUrls[groupId];
    
    try {
      // API 엔드포인트 URL 생성
      const imageUrl = getGroupImageApiUrl(imagePath);
      if (!imageUrl) return DEFAULT_STUDY_SVG;
      
      // Authorization 헤더가 포함된 API 호출
      const response = await fetch(imageUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // 캐시에 저장
        setImageUrls(prev => ({
          ...prev,
          [groupId]: blobUrl
        }));
        
        return blobUrl;
      } else {
        console.warn(`이미지 로드 실패: ${response.status}`, imageUrl);
        return DEFAULT_STUDY_SVG;
      }
    } catch (error) {
      console.warn('이미지 로드 중 오류:', error);
      return DEFAULT_STUDY_SVG;
    }
  };

  // 멘토 정보 가져오기
  useEffect(() => {
    (async () => {
      if (!token || myStudies.length === 0) return;

      setLoadingMentors(true);
      const mentorData = {};

      try {
        await Promise.all(
          myStudies.map(async (study) => {
            try {
              const res = await api('GET', `/group/${study.groupId}/member`, null, token);
              const members = res?.data || [];
              const mentor = members.find((m) => m.role === 'MENTOR');
              if (mentor) {
                mentorData[study.groupId] = mentor.name;
              }
            } catch (err) {
              console.debug('[GroupsList] mentor fetch error', { groupId: study.groupId, err });
            }
          })
        );
        setMentorInfo(mentorData);
      } catch (err) {
        console.debug('[GroupsList] mentor list load failed', err);
      } finally {
        setLoadingMentors(false);
      }
    })();
  }, [token, myStudies]);

  // 이미지 로드
  useEffect(() => {
    (async () => {
      if (!token || myStudies.length === 0) return;

      const imagePromises = myStudies.map(async (study) => {
        if (study.GroupImage) {
          await loadImageWithAuth(study.GroupImage, study.groupId);
        }
      });

      await Promise.all(imagePromises);
    })();
  }, [token, myStudies]);

  // 컴포넌트 언마운트 시 blob URL 정리
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrls]);

  // 상태별 필터링 함수
  const getFilteredStudies = () => {
    let filtered = myStudies;
    
    // 상태 필터링
    if (statusFilter === 'active') {
      filtered = filtered.filter(study => study.status === 'ACTIVE' || study.status === 1);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(study => study.status === 'INACTIVE' || study.status === 0 || !study.status);
    }
    
    // 기수 필터링
    if (generationFilter.trim()) {
      filtered = filtered.filter(study => 
        study.generation && study.generation.toLowerCase().includes(generationFilter.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredStudies = getFilteredStudies();

  const categoryLabel = (cat) =>
    Array.isArray(cat) ? (cat.length ? cat.join(', ') : '일반') : (cat || '일반');


  return (
    <section className="contact">
      <h1 className="heading">Groups</h1>

      {/* 필터 버튼들 */}
      <div className="groups-filter-container">
        <div className="filter-buttons">
          <div className="filter-buttons-left">
            <button 
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              <i className="fas fa-list"></i>
              전체 ({myStudies.length})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              <i className="fas fa-check-circle"></i>
              진행중 ({myStudies.filter(s => s.status === 'ACTIVE' || s.status === 1).length})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('inactive')}
            >
              <i className="fas fa-times-circle"></i>
              종료 ({myStudies.filter(s => s.status === 'INACTIVE' || s.status === 0 || !s.status).length})
            </button>
          </div>
          
          {/* 기수 검색 입력란 - 오른쪽 배치 */}
          <div className="filter-buttons-right">
            <div className="generation-search-container">
              <input
                type="text"
                placeholder="1기, 2기..."
                value={generationFilter}
                onChange={(e) => setGenerationFilter(e.target.value)}
                className="generation-search-input"
              />
              <i className="fas fa-search generation-search-icon"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="groups-container">
        {filteredStudies.length > 0 ? (
          <div className="groups-grid">
            {filteredStudies.map((study) => (
              <div key={study.groupId} className="group-card">
                <div className="group-header">
                  <div className="group-header-left">
                    <span className={`group-status ${study.status?.toLowerCase() || 'inactive'}`}>
                      {study.status === 'ACTIVE' ? '진행중' : '종료'}
                    </span>
                  </div>
                  <h3 className="list-group-title">{study.name}</h3>
                  <div className="group-header-right">
                    <span className="group-mentor">
                      {loadingMentors
                        ? <i className="fas fa-spinner fa-spin" />
                        : (mentorInfo[study.groupId] ? `멘토: ${mentorInfo[study.groupId]}` : '멘토: 정보 없음')}
                    </span>
                  </div>
                </div>

                <div className="group-content">
                  <div className="group-image">
                    <img
                      src={imageUrls[study.groupId] || DEFAULT_STUDY_SVG}
                      alt={study.name}
                      onError={(e) => {
                        if (e.currentTarget.src !== DEFAULT_STUDY_SVG) {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_STUDY_SVG;
                        }
                      }}
                    />
                  </div>
                  <p className="group-description">{study.description}</p>

                  <div className="group-categories">
                    <span className="group-category-tag">{categoryLabel(study.category)}</span>
                    <span className="group-generation-tag">{study.generation || '기수 미정'}</span>
                  </div>
                </div>

                <div className="group-footer">
                  {/* 내부 라우팅에는 basename을 붙이지 않는다 */}
                  <Link
                    to={`/groups?groupId=${study.groupId}`}
                    className="group-more-btn"
                  >
                    상세보기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-groups-message">
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <i className="fas fa-users" style={{ fontSize: '4rem', color: '#ccc', marginBottom: '1rem' }} />
              <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>
                {statusFilter === 'all' ? '참여 중인 그룹이 없습니다' : 
                 statusFilter === 'active' ? '진행중인 그룹이 없습니다' : 
                 '종료된 그룹이 없습니다'}
              </h3>
              <p style={{ color: '#888' }}>
                {statusFilter === 'all' ? 
                  '아직 참여 중인 스터디 그룹이 없습니다.\n그룹에 가입하거나 새 그룹을 생성해보세요.' :
                  statusFilter === 'active' ?
                  '현재 진행중인 스터디 그룹이 없습니다.\n다른 필터를 확인해보세요.' :
                  '현재 종료된 스터디 그룹이 없습니다.\n다른 필터를 확인해보세요.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}