import { Routes, Route, Navigate } from "react-router-dom"
import Navbar from "./components/Navbar.jsx"
import Home from "./pages/Home.jsx"
import Profile from "./pages/Profile.jsx"
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"
import Update from "./pages/Update.jsx"
import Group from "./pages/Group.jsx"
import Notifications from "./pages/Notifications.jsx"
import Admin from "./pages/Admin.jsx" // Admin 컴포넌트 임포트
import Unauthorized from "./pages/Unauthorized.jsx";
import PasswordEmailVerify from "./pages/PasswordEmailVerify.jsx";
import { useAuth } from "./components/auth.jsx"

export default function App() {
  const { user, isInitialized } = useAuth();
  
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={
          isInitialized ? (
            user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
          ) : <div>Loading...</div>
          } />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/update" element={<Update />} />
        <Route path="/contact" element={<Group />} />
        <Route path="/groups" element={<Group />} />
        <Route path="/groups/:groupId" element={<Group />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/notifications/:notificationId" element={<Notifications />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/forgot-password" element={<PasswordEmailVerify />} />
      </Routes>
    </>
  )
}