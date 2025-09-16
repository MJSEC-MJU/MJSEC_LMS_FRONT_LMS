import React, { useState, useEffect, useMemo } from 'react';
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../client";

// ---- 기본 이미지: 번들 자산으로 import (경로 문제 X)
import defaultStudyUrl from "../assets/default-study.svg?url";

// ====== API_BASE 계산 ======
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

// 파일명만 추출 (절대/상대/파일명 단독 모두 대응)
const extractFileName = (raw) => {
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

// /image/{파일명} 로 정규화
const toImageApiUrl = (raw) => {
  const name = extractFileName(raw);
  return name ? `${API_BASE}/image/${name}` : null;
};

// 그룹 이미지 정규화(없으면 기본 이미지)
const normalizeGroupImage = (raw) => {
  const normalized = toImageApiUrl(raw);
  return normalized || defaultStudyUrl;
};

export default function GroupsList({ myStudies = [] }) {
  const { token } = useAuth();
  const [mentorInfo, setMentorInfo] = useState({});
  const [loadingMentors, setLoadingMentors] = useState(false);

  // myStudies가 자주 새로고침되면 메모해두기
  const studies = useMemo(() => Array.isArray(myStudies) ? myStudies : [], [myStudies]);

  // 멘토 정보 가져오기
  useEffect(() => {
    const fetchMentorInfo = async () => {
      if (!token || studies.length === 0) return;

      setLoadingMentors(true);
      const mentorData = {};

      try {
        await Promise.all(
          studies.map(async (study) => {
            try {
              const res = await api('GET', `/group/${study.groupId}/member`, null, token);
              const members = res?.data || [];
              const mentor = members.find((m) => m.role === 'MENTOR');
              if (mentor) mentorData[study.groupId] = mentor.name;
            } catch {
              /* per-group 에러 무시 */
            }
          })
        );
        setMentorInfo(mentorData);
      } catch {
        /* ignore */
      } finally {
        setLoadingMentors(false);
      }
    };

    fetchMentorInfo();
  }, [token, studies]);

  return (
    <section className="contact">
      <h1 className="heading">Groups</h1>

      <div className="groups-container">
        {studies.length > 0 ? (
          <div className="groups-grid">
            {studies.map((study) => {
              const imgSrc = normalizeGroupImage(study.GroupImage);

              return (
                <div key={study.groupId} className="group-card">
                  <div className="group-header">
                    <div className="group-header-left" />
                    <h3 className="group-title">{study.name}</h3>
                    <div className="group-header-right">
                      <span className="group-mentor">
                        {loadingMentors ? (
                          <i className="fas fa-spinner fa-spin" aria-label="loading" />
                        ) : mentorInfo[study.groupId] ? (
                          `멘토: ${mentorInfo[study.groupId]}`
                        ) : (
                          '멘토: 정보 없음'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="group-content">
                    <div className="group-image">
                      <img
                        src={imgSrc}
                        alt={study.name || '스터디 이미지'}
                        // 실패 시 1회만 기본 이미지로 교체 (무한 루프 방지)
                        onError={(e) => {
                          if (e.currentTarget.src !== defaultStudyUrl) {
                            e.currentTarget.onerror = null;     // 루프 방지
                            e.currentTarget.src = defaultStudyUrl;
                          }
                        }}
                      />
                    </div>

                    <p className="group-description">{study.description}</p>

                    <div className="group-categories">
                      <span className="group-category-tag">
                        {study.category || '일반'}
                      </span>
                    </div>
                  </div>

                  <div className="group-footer">
                    {/* Router에 basename을 설정했다면 Link는 절대경로만 주면 됩니다. (예: <BrowserRouter basename="/lms" />) */}
                    <Link
                      to={`/groups?groupId=${study.groupId}`}
                      className="group-more-btn"
                    >
                      상세보기
                    </Link>
                  </div>
                </div>
              );
            })}
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
