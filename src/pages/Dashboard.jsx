import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream antialiased">
        {/* Minimal loading state spinner container */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-[3px] border-brand-sage border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">
            Establishing identity matrix...
          </p>
        </div>
      </div>
    )
  }

  // Role-based routing logic branch
  if (profile?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (profile?.role === 'owner') {
    return <Navigate to="/owner/dashboard" replace />
  }

  // Default redirect for students
  return <Navigate to="/student/dashboard" replace />
}