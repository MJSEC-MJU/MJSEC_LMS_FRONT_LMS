import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../client";

/* =======================================================================
   /lms 서브패스 배포 안전 베이스 계산
   - Vite 빌드 base가 '/'로 들어와도 런타임에서 /lms/를 자동 보정
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
   - 문자열 경로만 사용 (import 금지)
   ======================================================================= */
const DEFAULT_STUDY_SVG = `${RUNTIME_BASE}images/default-study.svg`;

/* =======================================================================
   API 베이스 계산
   - 절대 URL이면 그대로 사용
   - 상대/미설정이면 /lms 기준으로 보정
   ======================================================================= */
const RAW_BASE   = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
const RAW_PREFIX = (import.meta.env.VITE_API_PREFIX ?? "/api/v1")
  .replace(/\/+$/, "")
  .replace(/^\/?/, "/");

const API_BASE = (() => {
  // 절대 URL 설정 시: 그대로 prefix만 정리
  if (/^https?:\/\//i.test(RAW_BASE)) {
    if (!RAW_PREFIX || RAW_PREFIX === "/") return RAW_BASE;
    if (RAW_BASE.endsWith(RAW_PREFIX)) return RAW_BASE;
    if (RAW_BASE.endsWith("/api") && RAW_PREFIX === "/api/v1") return RAW_BASE.replace(/\/api$/, "/api/v1");
    if (RAW_BASE.includes("/api/v1")) return RAW_BASE;
    return `${RAW_BASE}${RAW_PREFIX}`;
  }
  // 상대/미설정: /lms 기반으로
  const base = RAW_BASE ? `${RUNTIME_BASE}${RAW_BASE.replace(/^\//, "")}` : RUNTIME_BASE;
  const trimmed = base.replace(/\/$/, "");
  if (!RAW_PREFIX || RAW_PREFIX === "/") return trimmed;
  if (trimmed.endsWith(RAW_PREFIX)) return trimmed;
  if (trimmed.endsWith("/api") && RAW_PREFIX === "/api/v1") return trimmed.replace(/\/api$/, "/api/v1");
  if (trimmed.includes("/api/v1")) return trimmed;
  return `${trimmed}${RAW_PREFIX}`;
})();

/* =======================================================================
   유틸들
   ======================================================================= */
const isAbs = (u) => /^https?:\/\//i.test(u || "");
const fileName = (raw) => {
  if (!raw) return "";
  try {
    const u = new URL(raw, window.location.origin);
    const parts = u.pathname.split("/");
    return parts.pop() || "";
  } catch {
    const parts = String(raw).split("/");
    return parts.pop() || "";
  }
};

// /api/v1/image/{파일명} 로 라우팅(백엔드 규약일 때만 사용)
const toImageApiUrl = (raw) => {
  if (!raw) return null;
  if (isAbs(raw)) return raw;
  const name = fileName(raw);
  return name ? `${API_BASE}/image/${name}` : null;
};

// 그룹 이미지 정규화(없으면 기본 이미지)
const normalizeGroupImage = (raw) => toImageApiUrl(raw) || DEFAULT_STUDY_SVG;

/* =======================================================================
   컴포넌트
   ======================================================================= */
export default function GroupsList({ myStudies = [] }) {
  const { token } = useAuth();
  const [mentorInfo, setMentorInfo] = useState({});
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

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
              // 개별 그룹 조회 실패는 무시
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

  // 상태별 필터링 함수
  const getFilteredStudies = () => {
    if (statusFilter === 'all') {
      return myStudies;
    } else if (statusFilter === 'active') {
      return myStudies.filter(study => study.status === 'ACTIVE' || study.status === 1);
    } else if (statusFilter === 'inactive') {
      return myStudies.filter(study => study.status === 'INACTIVE' || study.status === 0 || !study.status);
    }
    return myStudies;
  };

  const filteredStudies = getFilteredStudies();

  return (
    <section className="contact">
      <h1 className="heading">Groups</h1>

      {/* 필터 버튼들 */}
      <div className="groups-filter-container">
        <div className="filter-buttons">
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
            활성화 ({myStudies.filter(s => s.status === 'ACTIVE' || s.status === 1).length})
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            <i className="fas fa-times-circle"></i>
            비활성화 ({myStudies.filter(s => s.status === 'INACTIVE' || s.status === 0 || !s.status).length})
          </button>
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
                      {study.status === 'ACTIVE' ? '활성' : '비활성'}
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
                      src={normalizeGroupImage(study.GroupImage)}
                      alt={study.name}
                      onError={(e) => {
                        // 무한 onerror 루프 방지
                        if (e.currentTarget.src !== DEFAULT_STUDY_SVG) {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_STUDY_SVG;
                        }
                      }}
                    />
                  </div>
                  <p className="group-description">{study.description}</p>

                  <div className="group-categories">
                    <span className="group-category-tag">{study.category || '일반'}</span>
                  </div>
                </div>

                <div className="group-footer">
                  {/* 서브패스(`/lms`) 배포 호환 */}
                  <Link
                    to={`${RUNTIME_BASE}groups?groupId=${study.groupId}`}
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
                 statusFilter === 'active' ? '활성화된 그룹이 없습니다' : 
                 '비활성화된 그룹이 없습니다'}
              </h3>
              <p style={{ color: '#888' }}>
                {statusFilter === 'all' ? 
                  '아직 참여 중인 스터디 그룹이 없습니다.\n그룹에 가입하거나 새 그룹을 생성해보세요.' :
                  statusFilter === 'active' ?
                  '현재 활성화된 스터디 그룹이 없습니다.\n다른 필터를 확인해보세요.' :
                  '현재 비활성화된 스터디 그룹이 없습니다.\n다른 필터를 확인해보세요.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
