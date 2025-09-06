import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "./auth"

export default function Navbar() {
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(() => localStorage.getItem("dark-mode") === "enabled")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [, setIsSearchOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()

  // 다크모드
  useEffect(() => {
    document.body.classList.toggle("dark", isDarkModeEnabled)
    localStorage.setItem("dark-mode", isDarkModeEnabled ? "enabled" : "disabled")
  }, [isDarkModeEnabled])

  // 네브바 생기는지 안 생기는지
  useEffect(() => {
    document.body.classList.toggle("active", isSidebarOpen)
  }, [isSidebarOpen])


  useEffect(() => {
    setIsProfileOpen(false)
    setIsSearchOpen(false)
    if (window.innerWidth < 1200) setIsSidebarOpen(false)
  }, [location])


  useEffect(() => {
    const handleScroll = () => {
      setIsProfileOpen(false)
      setIsSearchOpen(false)
      if (window.innerWidth < 1200) setIsSidebarOpen(false)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    setIsProfileOpen(false)
    setIsSidebarOpen(false)
  }

  return (
    <>
      <header className="header">
        <section className="flex">
          <Link to="/" className="logo">MJSEC</Link>

          <div className="icons">
            <div id="menu-btn" className="fas fa-bars" onClick={() => setIsSidebarOpen(v => !v)} />
            <div id="user-btn" className="fas fa-user" onClick={() => { setIsProfileOpen(v => !v); setIsSearchOpen(false) }} />
            <div id="toggle-btn" className={isDarkModeEnabled ? "fas fa-moon" : "fas fa-sun"} onClick={() => setIsDarkModeEnabled(v => !v)} />
          </div>

          <div className={`profile ${isProfileOpen ? "active" : ""}`}>
            <img src="/lms/images/default-study.jpg" className="image" alt="" onError={(e) => {
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23ccc'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23666' font-size='12'%3E사용자%3C/text%3E%3C/svg%3E";
            }} />
            {user ? (
              <>
                <h3 className="name">{user.name || user.username || '사용자'}</h3>
                <p className="role">{user.studentNumber || user.studentNo || '학번'}</p>
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
          <img src="/lms/images/default-study.jpg" className="image" alt="" onError={(e) => {
            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23ccc'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23666' font-size='12'%3E사용자%3C/text%3E%3C/svg%3E";
          }} />
          {user ? (
            <>
              <h3 className="name">{user.name || user.username || '사용자'}</h3>
              <p className="role">{user.studentNumber || user.studentNo || '학번'}</p>
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
        </nav>
      </div>
    </>
  )
}
