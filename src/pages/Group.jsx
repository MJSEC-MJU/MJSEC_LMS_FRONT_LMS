import React, { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../components/auth";
import { api } from "../components/client";
import GroupsList from "../components/groups/GroupsList";
import GroupDetail from "../components/groups/GroupDetail";

export default function Group() {
  const [searchParams] = useSearchParams();
  const groupIdQuery = searchParams.get('groupId');
  const groupId = parseInt(groupIdQuery, 10);
  const { user, token } = useAuth();
  
  // 내 스터디 목록 (API로 조회)
  const [myStudies, setMyStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  // 사용자 그룹 목록 조회
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchUserGroups = async () => {
      try {
        const res = await api('GET', '/group/all', null, token);
        console.log('🔍 /group/all API 응답:', res);
        console.log('📊 그룹 데이터 개수:', res?.data?.length || 0);
        console.log('📋 그룹 목록:', res?.data);
        
        const groups = res?.data || [];
        const mapped = groups.map(g => ({
          groupId: g.studyGroupId,
          name: g.name || '이름없음',
          description: '', // 새 API에서는 description이 없으므로 빈 문자열
          GroupImage: g.studyImage, // studyImage로 변경
          category: g.category || '일반',
          createdAt: '', // 새 API에서는 createdAt이 없으므로 빈 문자열
          members: [], // 새 API에서는 members가 없으므로 빈 배열
          status: g.status // 새로 추가된 status 필드
        }));
        
        console.log('🎯 매핑된 그룹 데이터:', mapped);
        setMyStudies(mapped);
      } catch (error) {
        console.error('❌ /group/all API 오류:', error);
        // 사용자 그룹 목록 조회 오류 처리
        // 403 오류인 경우 로그인 페이지로 리다이렉트하거나 에러 메시지 표시
        if (error.message.includes('403')) {
          // 403 오류: 인증이 필요합니다
          // 임시로 빈 배열로 설정하여 빈 목록 표시
          setMyStudies([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserGroups();
  }, [token, user]);

  if (loading) {
    return (
      <section className="contact">
        <h1 className="heading">Loading...</h1>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
          <p>그룹 정보를 불러오는 중...</p>
        </div>
      </section>
    );
  }

  // groupId가 있으면 상세 페이지, 없으면 목록 페이지
  if (groupId && !isNaN(groupId)) {
    return <GroupDetail groupId={groupId} myStudies={myStudies} />;
  }

  // 전체 Groups 페이지
  return <GroupsList myStudies={myStudies} />;
}
