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
  const [cveList, setCveList] = useState([]);
  const [cveLoading, setCveLoading] = useState(true);
 

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

  // 현재 수강중인 강좌(스터디) 가져오기
  const fetchStudies = useCallback(async () => {
    try {
      if (!token) {
        setStudies([]);
        setStudiesLoading(false);
        return;
      }
      const resp = await api('GET', '/group/all', null, token);
      
      const groups = resp?.data || [];
      // status가 'ACTIVE'인 강좌만 필터링
      const activeGroups = groups.filter(g => g.status === 'ACTIVE');
      const mapped = activeGroups.map(g => ({
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
  
  const fetchSecurityRSS = useCallback(async () => {
    setCveLoading(true);
    try {
      const rssUrl = "https://www.boannews.com/media/news_rss.xml";
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
  
      if (data.status !== 'ok') {
        setCveList([]);
        return;
      }

  
      const applyFilter = (list) => {
        if (category === 'all') return list;
        const keywords = keywordMap[category] || [];
        return list.filter((item) => {
          const text = `${item.title || ''} ${item.description || ''}`;
          return keywords.some((k) => text.includes(k));
        });
      };
  
      const filtered = applyFilter(data.items || []).slice(0, 5);
  
      const mappedNews = filtered.map((item, index) => ({
        // 중복 키 방지: link를 쓰되 없으면 index를 조합
        id: item.guid || item.link || `news-${index}`,
        title: item.title ? item.title.substring(0, 40) + '...' : '제목 없음',
        summary: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 60) + '...' : '내용 요약이 없습니다.',
        link: item.link || '#',
        date: item.pubDate ? item.pubDate.split(' ')[0] : ''
      }));
  
      setCveList(mappedNews);
    } catch (error) {
      console.error("뉴스 피드 로딩 실패", error);
      setCveList([]);
    } finally {
      setCveLoading(false);
    }
  }, [category]);

  // 홈 진입/카테고리 변경 시 데이터 로드
  useEffect(() => {
    fetchNotifications();
    fetchStudies();
    fetchSecurityRSS();
  }, [fetchNotifications, fetchStudies, fetchSecurityRSS]);
  

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
        {/* 최신 보안 뉴스 (CVE) 섹션 */}
        <div className="cve-container-wide">
          <div className="box">
            <h3 className="title">실시간 보안 소식 (BoanNews)</h3>
            
            <div className="cve-card-grid">
              {cveLoading ? (
                <div className="loading-notice">최신 소식을 가져오는 중...</div>
              ) : cveList.length > 0 ? (
                cveList.map((news) => (
                  <a href={news.link} target="_blank" rel="noopener noreferrer" key={news.id} className="cve-card">
                    <div className="cve-card-header">
                      <span className="cve-id-text" style={{ fontSize: '1.2rem' }}>{news.date}</span>
                    </div>
                    <h4 style={{ fontSize: '1.4rem', margin: '1rem 0', color: 'var(--black)' }}>{news.title}</h4>
                    <p className="cve-summary-text">{news.summary}</p>
                    <span className="cve-more">기사 보기 <i className="fas fa-external-link-alt"></i></span>
                  </a>
                ))
              ) : (
                <div className="no-notice">해당 카테고리의 최신 뉴스가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </section>


    </>
  )
}
