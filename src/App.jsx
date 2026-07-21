import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RoomList from './components/student/RoomList'
import { AuthProvider } from './context/AuthContext'
import { LocationProvider } from './context/LocationContext'
import BrowseRooms from './pages/BrowseRooms'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import AuthCallback from './pages/AuthCallback'
import StudentDashboard from './pages/student/StudentDashboard'
import OwnerDashboard from './pages/owner/OwnerDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import ChatPage from './pages/ChatPage'
import ProtectedRoute from './components/common/ProtectedRoute'
import MyBookings from './pages/student/MyBookings'
import { ToastProvider } from './context/ToastContext'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import NotificationListener from './components/common/NotificationListener'
import Messages from './pages/Messages'

function App() {
  
  return (
    <AuthProvider>
      <LocationProvider>
        <ToastProvider>
          <BrowserRouter>
          <NotificationListener />
          <Routes>
            <Route path="/" element={<BrowseRooms />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/ranchi" element={<RoomList city="Ranchi" />} />
             <Route path="/forgot-password" element={<ForgotPassword />} />
             <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/bookings"
              element={
                <ProtectedRoute allowedRole="student">
                  <MyBookings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute allowedRole="owner">
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat/:roomId/:otherUserId"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
   path="/messages"
   element={
     <ProtectedRoute>
       <Messages />
     </ProtectedRoute>
   }
 />
            {/* Catch-all — must stay last so it doesn't intercept real routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </ToastProvider>
      </LocationProvider>
    </AuthProvider>
  )
}

export default App