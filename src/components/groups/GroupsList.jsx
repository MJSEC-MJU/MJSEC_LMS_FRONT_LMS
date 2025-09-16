import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../client";

// public/images/default-study.svg → 문자열 경로(IMPORT 금지)
const DEFAULT_STUDY_SVG = `${import.meta.env.BASE_URL}images/default-study.svg`;

// API 베이스(있으면 사용)
const RAW_BASE   = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
const RAW_PREFIX = (import.meta.env.VITE_API_PREFIX ?? "/api/v1").replace(/\/+$/, "").replace(/^\/?/, "/");
const API_BASE = (() => {
  if (!RAW_PREFIX || RAW_PREFIX === "/") return RAW_BASE;
  if (RAW_BASE.endsWith(RAW_PREFIX)) return RAW_BASE;
  if (RAW_BASE.endsWith("/api") && RAW_PREFIX === "/api/v1") return RAW_BASE.replace(/\/api$/, "/api/v1");
  if (RAW_BASE.includes("/api/v1")) return RAW_BASE;
  return `${RAW_BASE}${RAW_PREFIX}`;
})();

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

export default function GroupsList({ myStudies = [] }) {
  const { token } = useAuth();
  const [mentorInfo, setMentorInfo] = useState({});
  const [loadingMentors, setLoadingMentors] = useState(false);

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
              const mentor = members.find(m => m.role === 'MENTOR');
              if (mentor) mentorData[study.groupId] = mentor.name;
            } catch {}
          })
        );
        setMentorInfo(mentorData);
      } finally {
        setLoadingMentors(false);
      }
    })();
  }, [token, myStudies]);

  return (
    <section className="contact">
      <h1 className="heading">Groups</h1>

      <div className="groups-container">
        {myStudies.length > 0 ? (
          <div className="groups-grid">
            {myStudies.map((study) => (
              <div key={study.groupId} className="group-card">
                <div className="group-header">
                  <div className="group-header-left"></div>
                  <h3 className="group-title">{study.name}</h3>
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
                    to={`${import.meta.env.BASE_URL}groups?groupId=${study.groupId}`}
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
              <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>참여 중인 그룹이 없습니다</h3>
              <p style={{ color: '#888' }}>
                아직 참여 중인 스터디 그룹이 없습니다.<br />
                그룹에 가입하거나 새 그룹을 생성해보세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
