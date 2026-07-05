import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import BrowseRooms from './pages/BrowseRooms'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import StudentDashboard from './pages/student/StudentDashboard'
import OwnerDashboard from './pages/owner/OwnerDashboard'
import ChatPage from './pages/ChatPage'
import ProtectedRoute from './components/common/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BrowseRooms />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

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
            path="/chat/:roomId/:otherUserId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
