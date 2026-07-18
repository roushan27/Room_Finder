import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NotFound() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const handleGoHome = () => {
    if (!user) {
      navigate('/')
      return
    }
    if (profile?.role === 'student') navigate('/student/dashboard')
    else if (profile?.role === 'owner') navigate('/owner/dashboard')
    else if (profile?.role === 'admin') navigate('/admin/dashboard')
    else navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4 antialiased">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6">
          <img src="/logo.png" alt="Room Finder" className="h-14 w-14 mx-auto object-contain mb-4" />
          <p className="text-7xl font-black text-brand-gold tracking-tight leading-none">404</p>
        </div>

        <h1 className="text-slate-800 font-black text-lg mb-2">Page not found</h1>
        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoHome}
            className="w-full py-3 rounded-xl bg-brand-sage text-white font-black text-sm transition-all shadow-[3px_4px_8px_rgba(20,60,30,0.35),-2px_-2px_5px_rgba(255,255,255,0.25)] hover:shadow-[2px_3px_5px_rgba(20,60,30,0.35),-1px_-1px_3px_rgba(255,255,255,0.25)] active:shadow-[inset_2px_2px_5px_rgba(20,60,30,0.4)] active:scale-98"
          >
            Take Me Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 rounded-xl bg-white text-slate-700 font-black text-sm transition-all shadow-[3px_4px_8px_rgba(180,120,60,0.25),-2px_-2px_5px_rgba(255,255,255,0.7)] hover:shadow-[2px_3px_5px_rgba(180,120,60,0.25),-1px_-1px_3px_rgba(255,255,255,0.7)] active:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.3)] active:scale-98"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}