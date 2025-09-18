import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "./auth"
import { api } from "./client"

export default function Navbar() {
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(() => localStorage.getItem("dark-mode") === "enabled")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [, setIsSearchOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const location = useLocation()
  const { user, token, logout } = useAuth()

  // BASE_URL 기반 로고/프로필 이미지 경로 (로고만/이미지만 수정)
  const base = (import.meta.env.BASE_URL || "/") // dev: '/', prod: '/lms/'
  const logoFallback = `${base}images/logo.png`
  const brandLogoSrc = `${base}images/mockup-logo2.png`
  const profileImgSrc = profile?.profileImage
    ? (/^(https?:)?\/\//.test(profile.profileImage) || profile.profileImage.startsWith("data:")
        ? profile.profileImage
        : profile.profileImage.startsWith("/uploads/")
        ? `/api/v1/image${profile.profileImage.replace("/uploads", "")}`
        : `${base}${profile.profileImage.replace(/^\//, "")}`)
    : logoFallback

  // Sync body class and localStorage for dark mode
  useEffect(() => {
    document.body.classList.toggle("dark", isDarkModeEnabled)
    localStorage.setItem("dark-mode", isDarkModeEnabled ? "enabled" : "disabled")
  }, [isDarkModeEnabled])

  // Toggle body active with sidebar
  useEffect(() => {
    document.body.classList.toggle("active", isSidebarOpen)
  }, [isSidebarOpen])

  // Close overlays when route changes
  useEffect(() => {
    setIsProfileOpen(false)
    setIsSearchOpen(false)
    if (window.innerWidth < 1200) setIsSidebarOpen(false)
  }, [location])

  // Close overlays on scroll (mimics original behavior)
  useEffect(() => {
    const handleScroll = () => {
      setIsProfileOpen(false)
      setIsSearchOpen(false)
      if (window.innerWidth < 1200) setIsSidebarOpen(false)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    let isMounted = true
    async function fetchUserPage() {
      try {
        if (!token) {
          if (isMounted) setProfile(null)
          return
        }
        const resp = await api('GET', '/user/user-page', undefined, token)
        if (isMounted) setProfile(resp?.data || null)
      } catch {
        if (isMounted) setProfile(null)
      }
    }
    fetchUserPage()
    return () => { isMounted = false }
  }, [token])

  const handleLogout = () => {
    logout()
    setIsProfileOpen(false)
    setIsSidebarOpen(false)
  }

  return (
    <>
      <header className="header">
        <section className="flex">
          <Link to="/" className="logo">
            {/* 로고 경로 수정 */}
            <img
              src={brandLogoSrc}
              alt="MJSEC Logo"
              style={{ height: '5rem', verticalAlign: 'middle' }}
              onError={(e) => { e.currentTarget.src = logoFallback }}
            />
            MJSEC
          </Link>

          <div className="icons">
            <div id="menu-btn" className="fas fa-bars" onClick={() => setIsSidebarOpen(v => !v)} />
            <div id="user-btn" className="fas fa-user" onClick={() => { setIsProfileOpen(v => !v); setIsSearchOpen(false) }} />
            <div id="toggle-btn" className={isDarkModeEnabled ? "fas fa-moon" : "fas fa-sun"} onClick={() => setIsDarkModeEnabled(v => !v)} />
          </div>

          <div className={`profile ${isProfileOpen ? "active" : ""}`}>
            {/* 프로필 이미지도 BASE_URL 기준 + 로고 fallback */}
            <img
              src={profileImgSrc}
              className="image"
              alt=""
              onError={(e) => { e.currentTarget.src = logoFallback }}
            />
            {user ? (
              <>
                <h3 className="name">{profile?.name || user.name || user.username || '사용자'}</h3>
                <p className="role">{profile?.studentNumber || user.studentNumber || user.studentNo || '학번'}</p>
                <Link to="/profile" className="btn">view profile</Link>
                <div className="flex-btn">
                  <button onClick={handleLogout} className="option-btn">logout</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="name">게스트</h3>
                <p className="role">로그인이 필요합니다</p>
                <div className="flex-btn">
                  <Link to="/login" className="option-btn">login</Link>
                  <Link to="/register" className="option-btn">register</Link>
                </div>
              </>
            )}
          </div>
        </section>
      </header>

      <div className={`side-bar ${isSidebarOpen ? "active" : ""}`}>
        <div id="close-btn" onClick={() => setIsSidebarOpen(false)}>
          <i className="fas fa-times"></i>
        </div>

        <div className="profile">
          {/* 사이드바의 프로필 이미지도 동일 처리 */}
          <img
            src={profileImgSrc}
            className="image"
            alt=""
            onError={(e) => { e.currentTarget.src = logoFallback }}
          />
          {user ? (
            <>
              <h3 className="name">{profile?.name || user.name || user.username || '사용자'}</h3>
              <p className="role">{profile?.studentNumber || user.studentNumber || user.studentNo || '학번'}</p>
              <Link to="/profile" className="btn" onClick={() => setIsSidebarOpen(false)}>view profile</Link>
            </>
          ) : (
            <>
              <h3 className="name">게스트</h3>
              <p className="role">로그인이 필요합니다</p>
            </>
          )}
        </div>

        <nav className="navbar">
          <Link to="/" onClick={() => setIsSidebarOpen(false)}><i className="fas fa-home"></i><span>home</span></Link>
          <Link to="/notifications" onClick={() => setIsSidebarOpen(false)}><i className="fa-solid fa-bell"></i><span>notification</span></Link>
          <Link to="/groups" onClick={() => setIsSidebarOpen(false)}><i className="fas fa-graduation-cap"></i><span>groups</span></Link>
          {user && user.role === 'ROLE_ADMIN' && (
            <Link to="/admin" onClick={() => setIsSidebarOpen(false)}><i className="fas fa-cog"></i><span>admin</span></Link>
          )}
        </nav>
      </div>
    </>
  )
}
