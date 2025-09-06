import { Link } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../components/auth"
import { api } from "../components/client"

export default function Home() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 공지사항 가져오기
  const fetchNotifications = useCallback(async () => {
    try {
      if (!token) {
        console.log('토큰이 없어서 공지사항을 가져올 수 없습니다.');
        setLoading(false);
        return;
      }
      
      const result = await api('GET', '/users/announcements', null, token);
      console.log('Fetched notifications for home:', result);
      
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
    } catch (error) {
      console.error('공지사항 가져오기 오류:', error);
      // 에러 발생 시 빈 배열로 설정
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  return (
    <>
      <section className="home-grid">
        <h1 className="heading">quick options</h1>
        <div className="box-container">
          <div className="box">
            <h3 className="title">현재 수강중인 강좌</h3>
            <p className="likes"><span>리버싱싱</span></p>
            <a href="#" className="inline-btn">view more</a>
            <p className="likes"><span>웹심</span></p>
            <a href="#" className="inline-btn">view more</a>
          </div>

          <div className="box">
            <h3 className="title">공지사항</h3>
            <div className="notice-box">
              {loading ? (
                <div className="loading-notice">로딩 중...</div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <Link key={notification.announcementId} to="/notifications">
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
