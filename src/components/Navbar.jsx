import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "./auth"
import { api } from "../lib/api"

export default function Navbar() {
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(() => localStorage.getItem("dark-mode") === "enabled")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [, setIsSearchOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const location = useLocation()
  const { user, token, logout } = useAuth()

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
      } catch (e) {
        // 사용자 페이지 로드 실패 처리
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
            <img src="/images/mockup-logo2.png" alt="MJSEC Logo" style={{ height: '5rem', verticalAlign: 'middle' }} />
            MJSEC
          </Link>

          <div className="icons">
            <div id="menu-btn" className="fas fa-bars" onClick={() => setIsSidebarOpen(v => !v)} />
            <div id="user-btn" className="fas fa-user" onClick={() => { setIsProfileOpen(v => !v); setIsSearchOpen(false) }} />
            <div id="toggle-btn" className={isDarkModeEnabled ? "fas fa-moon" : "fas fa-sun"} onClick={() => setIsDarkModeEnabled(v => !v)} />
          </div>

          <div className={`profile ${isProfileOpen ? "active" : ""}`}>
            <img src={profile?.profileImage || "/images/logo.png"} className="image" alt="" onError={(e) => { e.currentTarget.src = "/images/logo.png" }} />
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
          <img src={profile?.profileImage || "/images/logo.png"} className="image" alt="" onError={(e) => { e.currentTarget.src = "/images/logo.png" }} />
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
