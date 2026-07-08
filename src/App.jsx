import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<BrowseRooms />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

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
          </Routes>
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  )
}

export default App
