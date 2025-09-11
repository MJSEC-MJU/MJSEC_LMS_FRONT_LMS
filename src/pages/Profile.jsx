import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { useAuth } from "../components/auth"
import { api } from "../lib/api"

export default function Profile() {
  const { token, user } = useAuth()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function fetchProfile() {
      try {
        if (!token) {
          if (isMounted) setProfile(null)
          return
        }
        const resp = await api('GET', '/user/user-page', null, token)
        if (isMounted) setProfile(resp?.data || null)
      } catch (e) {
        console.error('Failed to load user page (profile):', e)
        if (isMounted) setProfile(null)
      }
    }
    fetchProfile()
    return () => { isMounted = false }
  }, [token])

  const displayName = profile?.name || user?.name || user?.username || '이름없음'
  const displayStudentNumber = profile?.studentNumber || user?.studentNumber || user?.studentNo || '학번없음'
  const displayEmail = profile?.email || user?.email || '이메일없음'
  const displayPhone = profile?.phoneNumber || user?.phoneNumber || '전화번호없음'
  const imageSrc = profile?.profileImage || "/images/logo.png"
  const studiesCount = Array.isArray(profile?.studyGroups) ? profile.studyGroups.length : 0

  return (
    <section className="user-profile">
      <h1 className="heading">your profile</h1>
      <div className="info">
        <div className="user">
          <img src={imageSrc} alt="" onError={(e) => { e.currentTarget.src = "/images/logo.png" }} />
          <h3>{displayName}</h3>
          <p>{`${displayStudentNumber} | ${displayEmail} | ${displayPhone}`}</p>
          <Link to="/update" className="inline-btn">update profile</Link>
        </div>

        <div className="box-container">
          <div className="box">
            <div className="flex">
              <i className="fa-solid fa-book-open"></i>
              <div>
                <span>100%</span>
                <p>과제 제출률</p>
              </div>
            </div>
            <a href="#" className="inline-btn">제출하기</a>
          </div>

          <div className="box">
            <div className="flex">
              <i className="fa-solid fa-laptop-code"></i>
              <div>
                <span>{studiesCount}개</span>
                <p>이수 과목</p>
              </div>
            </div>
            <a href="#" className="inline-btn">view more</a>
          </div>

          <div className="box">
            <div className="flex">
              <i className="fa-solid fa-people-group"></i>
              <div>
                <span>2개</span>
                <p>활동 프로젝트</p>
              </div>
            </div>
            <a href="#" className="inline-btn">view more</a>
          </div>
        </div>
      </div>
    </section>
  )
}
