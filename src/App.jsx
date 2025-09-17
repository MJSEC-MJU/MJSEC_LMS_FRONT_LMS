import { Routes, Route, Navigate } from "react-router-dom"
import Navbar from "./components/Navbar.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"
import PublicRoute from "./components/PublicRoute.jsx"
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
        
        {/* 공개 페이지들 (로그인 없이 접근 가능) */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <PasswordEmailVerify />
          </PublicRoute>
        } />
        <Route path="/password/update" element={
          <PublicRoute>
            <PasswordEmailVerify />
          </PublicRoute>
        } />
        
        {/* 보호된 페이지들 (로그인 필요) */}
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/update" element={
          <ProtectedRoute>
            <Update />
          </ProtectedRoute>
        } />
        <Route path="/contact" element={
          <ProtectedRoute>
            <Group />
          </ProtectedRoute>
        } />
        <Route path="/groups" element={
          <ProtectedRoute>
            <Group />
          </ProtectedRoute>
        } />
        <Route path="/groups/:groupId" element={
          <ProtectedRoute>
            <Group />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/notifications/:notificationId" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="/unauthorized" element={
          <ProtectedRoute>
            <Unauthorized />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  )
}