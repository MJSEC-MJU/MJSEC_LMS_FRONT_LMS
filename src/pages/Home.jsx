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
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

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

      {/* 개인정보 처리방침 섹션 */}
      <section className="privacy-policy-main">
        <div className="privacy-policy-container">
          <h2 className="privacy-policy-main-title">개인정보 처리방침</h2>
          <div className="privacy-policy-section">
            <button 
              className="privacy-policy-toggle"
              onClick={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
            >
              <i className={`fa-solid fa-chevron-${showPrivacyPolicy ? 'up' : 'down'}`}></i>
              <span>개인정보 처리방침 보기</span>
            </button>
            
            {showPrivacyPolicy && (
              <div className="privacy-policy-content">
                <h4>정보통신망법상의 요구사항</h4>
                
                <h5>1. 수집·이용 동의(제22조)</h5>
                <p>정보통신서비스 제공자는 이용자의 개인정보(여기에는 IP 주소도 포함될 수 있습니다)를 수집·이용하기 전에, 개인정보 처리방침 등을 통해 수집 목적, 항목, 보유 기간 등을 명시하고 이용자의 동의를 받아야 합니다.</p>
                
                <h5>2. 최소 수집 원칙(제23조)</h5>
                <p>목적 달성에 필요한 최소한의 개인정보만을 수집해야 하며, 별도의 법적 근거나 이용자의 동의 없이 IP 주소를 과도하게 장기 보관하는 것은 금지됩니다.</p>
                
                <h5>3. 안전성 확보 조치(제30조 등)</h5>
                <p>수집한 IP 주소를 포함한 개인정보는 암호화·접근 통제·로그 관리 등 기술·관리적 보호 조치를 통해 안전하게 보관해야 합니다.</p>
                
                <h4>ISMS-P(정보보호 및 개인정보보호 관리체계) 관점</h4>
                <p>ISMS-P 인증기준 중 <strong>'2.9.4 로그 및 접속기록 관리'</strong> 항목에서는 "사용자 접속기록(접속 일시, IP 주소 등)을 포함하여 일정 기간 안전하게 보관·관리"할 것을 요구합니다.</p>
                <p>로그의 별도 백업, 접근 권한 최소화, 위·변조 방지 및 보존 기간(통상 1~2년) 설정 등의 구체적 지침이 포함되어 있습니다.</p>
                
                <h4>결론 및 권장 사항</h4>
                <ul>
                  <li><strong>위법은 아님:</strong> IP 주소 자체를 DB에 저장하는 것은 금지 대상이 아니지만, 개인정보로 분류될 수 있으므로 위 수집·동의, 최소화, 안전성 확보 의무를 반드시 준수해야 합니다.</li>
                  <li><strong>실무 방안:</strong>
                    <ol>
                      <li>개인정보 처리방침에 IP 주소 수집 및 이용 목적·보유 기간 명시</li>
                      <li>회원 가입 또는 서비스 이용 시 명확한 동의 획득</li>
                      <li>DB 저장 시 암호화, 접근 통제, 로그 감사 정책 적용</li>
                      <li>ISMS-P 기준에 따라 로그 관리 절차 및 보존 기간 설정</li>
                    </ol>
                  </li>
                </ul>
                
                <p>이를 통해 법령과 인증 기준을 모두 만족하며, 안정적으로 IP 기반의 서비스 운영이 가능합니다.</p>
              </div>
            )}
          </div>
        </div>
      </section>

    </>
  )
}
