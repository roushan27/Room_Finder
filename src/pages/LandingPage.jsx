import { useNavigate } from 'react-router-dom'
import Footer from '../components/common/Footer'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-8">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">Room Finder</h1>

        <button
          onClick={() => navigate('/login')}
          className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition text-white font-semibold shadow-lg shadow-blue-500/30"
        >
          Log In
        </button>

        <p className="text-white/60 text-sm mt-4">
          New here?{' '}
          <span className="text-blue-300 cursor-pointer hover:underline">
            Create new account
          </span>
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => navigate('/signup?role=student')}
            className="flex-1 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
          >
            Students
          </button>
          <button
            onClick={() => navigate('/signup?role=owner')}
            className="flex-1 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
          >
            Owner
          </button>
        </div>
      </div>

      <Footer />
    </div>
  )
}
