import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar.jsx"
import Home from "./pages/Home.jsx"
import Courses from "./pages/Courses.jsx"
import Profile from "./pages/Profile.jsx"
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"
import Update from "./pages/Update.jsx"
import Contact from "./pages/Contact.jsx"
import Notifications from "./pages/Notifications.jsx"
import Admin from "./pages/Admin.jsx" // Admin 컴포넌트 임포트
import Unauthorized from "./pages/Unauthorized.jsx"; // Unauthorized 컴포넌트 임포트
// Removed Vite template styles to avoid layout constraints

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/update" element={<Update />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin" element={<Admin />} /> {/* Admin 경로 추가 */}
        <Route path="/unauthorized" element={<Unauthorized />} /> {/* Unauthorized 경로 추가 */}
      </Routes>
    </>
  )
}
