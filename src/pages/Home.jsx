import { Link } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../components/auth"
import { api } from "../components/client"

export default function Home() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studies, setStudies] = useState([]);
  const [studiesLoading, setStudiesLoading] = useState(true);

  // 공지사항 가져오기
  const fetchNotifications = useCallback(async () => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }
      
      const result = await api('GET', '/user/announcements', null, token);
      
      if (result.code === 'SUCCESS') {
        // announcementId 기준으로 내림차순 정렬 후 최신 4개만 가져오기
        const sortedNotifications = result.data.sort((a, b) => {
          const idA = a.announcementId || 0;
          const idB = b.announcementId || 0;
          return idB - idA; // 내림차순 정렬 (큰 ID가 먼저)
        });
        const latestNotifications = sortedNotifications.slice(0, 4);
        setNotifications(latestNotifications);
      }
    } catch {
      // 에러 발생 시 빈 배열로 설정
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 현재 수강중인 강좌(스터디) 가져오기
  const fetchStudies = useCallback(async () => {
    try {
      if (!token) {
        setStudies([]);
        setStudiesLoading(false);
        return;
      }
      const resp = await api('GET', '/user/user-page', null, token);
      
      const groups = resp?.data?.studyGroups || [];
      const mapped = groups.map(g => ({
        id: g.studyGroupId,
        name: (g.name && g.name.trim() !== '') ? g.name : (g.category || '이름없음')
      }));
      
      setStudies(mapped);
    } catch {
      setStudies([]);
    } finally {
      setStudiesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);
  return (
    <>
      <section className="home-grid">
        <h1 className="heading">quick options</h1>
        <div className="box-container">
          <div className="box">
            <h3 className="title">현재 수강중인 강좌</h3>
            <div className="notice-box">
              {studiesLoading ? (
                <div className="loading-notice">로딩 중...</div>
              ) : studies.length > 0 ? (
                studies.map((s) => (
                  <div key={s.id} className="current-course-item">
                    <span className="current-course-name">{s.name}</span>
                    <Link to={`/groups?groupId=${s.id}`} className="inline-btn btn--profile">view more</Link>
                  </div>
                ))
              ) : (
                <div className="no-notice">현재 수강중인 강좌가 없습니다.</div>
              )}
            </div>
          </div>

          <div className="box">
            <h3 className="title">공지사항</h3>
            <div className="notice-box">
              {loading ? (
                <div className="loading-notice">로딩 중...</div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <Link
                    key={notification.announcementId}
                    to={`/notifications?announcementId=${notification.announcementId}`}
                  >
                    <span>•{notification.title}</span>
                  </Link>
                ))
              ) : (
                <div className="no-notice">
                  {loading ? '로딩 중...' : '현재 공지사항이 없습니다.'}
                </div>
              )}
            </div>
          </div>

          <div className="box">
            <h3 className="title">마이페이지</h3>
            <div className="flex">
              <Link to="/profile" className="quick-profile"><i className="fa-solid fa-user"></i><span>프로필</span></Link>
            </div>
          </div>
        </div>
      </section>


    </>
  )
}
