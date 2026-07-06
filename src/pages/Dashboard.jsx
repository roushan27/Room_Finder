import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  if (profile?.role === 'owner') {
    return <Navigate to="/owner/dashboard" replace />
  }

  return <Navigate to="/student/dashboard" replace />
}
