import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"

export default function Navbar() {
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(() => localStorage.getItem("dark-mode") === "enabled")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [, setIsSearchOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

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
            <img src="/images/pic-1.jpg" className="image" alt="" />
            <h3 className="name">이름</h3>
            <p className="role">학번</p>
            <Link to="/profile" className="btn">view profile</Link>
            <div className="flex-btn">
              <Link to="/login" className="option-btn">login</Link>
              <Link to="/register" className="option-btn">register</Link>
            </div>
          </div>
        </section>
      </header>

      <div className={`side-bar ${isSidebarOpen ? "active" : ""}`}>
        <div id="close-btn" onClick={() => setIsSidebarOpen(false)}>
          <i className="fas fa-times"></i>
        </div>

        <div className="profile">
          <img src="/images/pic-1.jpg" className="image" alt="" />
          <h3 className="name">이름</h3>
          <p className="role">학번</p>
          <Link to="/profile" className="btn" onClick={() => setIsSidebarOpen(false)}>view profile</Link>
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
