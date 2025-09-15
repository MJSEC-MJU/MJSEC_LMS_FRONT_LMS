import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { useAuth } from "../components/auth"
import { api } from "../lib/api"

export default function Profile() {
  const { token, user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [_attendanceRates, setAttendanceRates] = useState([])
  const [randomAttendanceRate, setRandomAttendanceRate] = useState(0)
  const [selectedStudyGroup, setSelectedStudyGroup] = useState(null)

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

  // 각 스터디의 출석률 가져오기
  useEffect(() => {
    let isMounted = true
    async function fetchAttendanceRates() {
      if (!token || !profile?.studyGroups || !Array.isArray(profile.studyGroups)) return

      try {
        const rates = []
        
        for (const studyGroup of profile.studyGroups) {
          try {
            // 먼저 해당 스터디에서 사용자의 역할 확인
            const memberResponse = await fetch(`/api/v1/group/${studyGroup.studyGroupId}/member`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })

            if (memberResponse.ok) {
              const memberResult = await memberResponse.json()
              if (memberResult.code === 'SUCCESS') {
                // JWT 토큰에서 학번 추출
                let myStudentNumber = null
                try {
                  const tokenPayload = JSON.parse(atob(token.split('.')[1]))
                  myStudentNumber = parseInt(tokenPayload.studentNumber || tokenPayload.sub || tokenPayload.userId || tokenPayload.id)
                } catch {
                  // JWT에서 학번 추출 실패
                }

                if (myStudentNumber) {
                  // 해당 스터디에서 내 역할 찾기
                  const myMemberInfo = memberResult.data.find(member => member.studentNumber === myStudentNumber)
                  
                  // 멘토인 경우 출석률 계산 건너뛰기
                  if (myMemberInfo && myMemberInfo.role === 'MENTOR') {
                    console.log(`스터디 ${studyGroup.name}: 멘토이므로 출석률 계산 건너뛰기`)
                    continue
                  }

                  // 멘티인 경우에만 출석률 계산
                  if (myMemberInfo && myMemberInfo.role === 'MENTEE') {
                    // 각 스터디의 출석 데이터 가져오기
                    const attendanceResponse = await fetch(`/api/v1/group/${studyGroup.studyGroupId}/attendance/all-weeks`, {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    })

                    if (attendanceResponse.ok) {
                      const attendanceResult = await attendanceResponse.json()
                      if (attendanceResult.code === 'SUCCESS') {
                        const allAttendanceData = attendanceResult.data || {}
                        
                        // 출석률 계산
                        const totalWeeks = Object.keys(allAttendanceData).length
                        let attendedWeeks = 0

                        for (const week in allAttendanceData) {
                          const weekAttendance = allAttendanceData[week]
                          const myAttendance = weekAttendance.find(att => att.studentNumber === myStudentNumber)
                          if (myAttendance && myAttendance.attendanceType === 'ATTEND') {
                            attendedWeeks++
                          }
                        }

                        const rate = totalWeeks > 0 ? Math.round((attendedWeeks / totalWeeks) * 100) : 0
                        rates.push({
                          groupId: studyGroup.studyGroupId,
                          groupName: studyGroup.name || `스터디 ${studyGroup.studyGroupId}`,
                          rate: rate
                        })
                      }
                    }
                  }
                }
              }
            }
          } catch {
            // 개별 스터디 출석률 가져오기 실패 시 무시
          }
        }

        if (isMounted) {
          setAttendanceRates(rates)
          // 랜덤으로 하나 선택
          if (rates.length > 0) {
            const randomIndex = Math.floor(Math.random() * rates.length)
            const selectedGroup = rates[randomIndex]
            setRandomAttendanceRate(selectedGroup.rate)
            setSelectedStudyGroup(selectedGroup)
          } else {
            // 멘티인 스터디가 없는 경우 (모든 스터디에서 멘토인 경우)
            console.log('멘티인 스터디가 없어서 출석률을 계산할 수 없습니다.')
            setRandomAttendanceRate(0)
            setSelectedStudyGroup(null)
          }
        }
      } catch {
        // 출석률 가져오기 실패 시 무시
      }
    }

    fetchAttendanceRates()
    return () => { isMounted = false }
  }, [token, profile])
  
  const withBase = (p) => {
    const base = (import.meta.env.BASE_URL || '/'); // dev: '/', prod: '/lms/'
    if (!p) return new URL('images/logo.png', base).href;
    if (/^(https?:)?\/\//.test(p) || p.startsWith('data:')) return p; // 절대 URL/data URI는 그대로
    return new URL(p.replace(/^\//, ''), base).href;
  };
  
  const displayName = profile?.name || user?.name || user?.username || '이름없음'
  const displayStudentNumber = profile?.studentNumber || user?.studentNumber || user?.studentNo || '학번없음'
  const displayEmail = profile?.email || user?.email || '이메일없음'
  const displayPhone = profile?.phoneNumber || user?.phoneNumber || '전화번호없음'

  // ✅ 로고 처리만 수정 (나머지 그대로)
  const base = (import.meta.env.BASE_URL || '/')
  const logoFallback = `${base}images/logo.png`
  const imageSrc = profile?.profileImage
    ? (/^(https?:)?\/\//.test(profile.profileImage) || profile.profileImage.startsWith('data:')
        ? profile.profileImage
        : `${base}${profile.profileImage.replace(/^\//, '')}`)
    : logoFallback

  const studiesCount = Array.isArray(profile?.studyGroups) ? profile.studyGroups.length : 0

  return (
    <section className="user-profile">
      <h1 className="heading">your profile</h1>
      <div className="info">
        <div className="user">
          <img src={imageSrc} alt="" onError={(e) => { e.currentTarget.src = logoFallback }} />
          <h3>{displayName}</h3>
          <p>{`${displayStudentNumber} | ${displayEmail} | ${displayPhone}`}</p>
          <Link to="/update" className="inline-btn">update profile</Link>
        </div>

        <div className="box-container">
          <div className="box">
            <div className="flex">
              <i className="fa-solid fa-user-check"></i>
              <div>
                <span>{randomAttendanceRate}%</span>
                <p>수업 출석률</p>
                {selectedStudyGroup && (
                  <small style={{ color: 'var(--light-color)', fontSize: '1.2rem' }}>
                    {selectedStudyGroup.groupName}
                  </small>
                )}
                {!selectedStudyGroup && randomAttendanceRate === 0 && (
                  <small style={{ color: 'var(--light-color)', fontSize: '1.2rem' }}>
                    멘토인 스터디만 있어서 출석률 없음
                  </small>
                )}
              </div>
            </div>
            <a 
              href={selectedStudyGroup ? `/groups?groupId=${selectedStudyGroup.groupId}` : "/groups"} 
              className="inline-btn"
            >
              View Study
            </a>
          </div>

          <div className="box">
            <div className="flex">
              <i className="fa-solid fa-laptop-code"></i>
              <div>
                <span>{studiesCount}개</span>
                <p>수강 중</p>
              </div>
            </div>
            <a href="#" className="inline-btn">view more</a>
          </div>

          <div className="box">
            <div className="flex">
              <i className="fa-solid fa-paint-brush"></i>
              <div>
                <span>위키</span>
                <p>프로필 꾸미기</p>
              </div>
            </div>
            <a href="https://wiki.mjsec.kr" target="_blank" rel="noopener noreferrer" className="inline-btn">Go to Wiki</a>
          </div>
        </div>
      </div>
    </section>
  )
}
