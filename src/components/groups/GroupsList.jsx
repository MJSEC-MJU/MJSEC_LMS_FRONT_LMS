import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../client";

export default function GroupsList({ myStudies }) {
  const { token } = useAuth();
  const [mentorInfo, setMentorInfo] = useState({});
  const [loadingMentors, setLoadingMentors] = useState(false);

  // Fetch mentor information for each study
  useEffect(() => {
    const fetchMentorInfo = async () => {
      if (!token || myStudies.length === 0) return;
      
      setLoadingMentors(true);
      const mentorData = {};
      
      try {
        await Promise.all(
          myStudies.map(async (study) => {
            try {
              const res = await api('GET', `/group/${study.groupId}/member`, null, token);
              const members = res?.data || [];
              const mentor = members.find(member => member.role === 'MENTOR');
              if (mentor) {
                mentorData[study.groupId] = mentor.name;
              }
            } catch {
              // 멘토 정보 조회 오류 처리
            }
          })
        );
        setMentorInfo(mentorData);
      } catch {
        // 멘토 정보 조회 오류 처리
      } finally {
        setLoadingMentors(false);
      }
    };

    fetchMentorInfo();
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
                      {loadingMentors ? (
                        <i className="fas fa-spinner fa-spin"></i>
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
                      src={study.GroupImage || "/images/default-study.svg"} 
                      alt={study.name}
                      onError={(e) => {
                        e.target.src = "/images/default-study.svg";
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
              <i className="fas fa-users" style={{ fontSize: '4rem', color: '#ccc', marginBottom: '1rem' }}></i>
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
