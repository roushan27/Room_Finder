import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('student')
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(identifier, password, selectedRole)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    const { error } = await signInWithGoogle(selectedRole)
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8"
      >
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2 text-center">Log In</h2>
        <p className="text-center text-white/60 text-sm mb-4">Choose how you want to continue</p>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded-lg">{error}</p>}

        <div className="mb-4 rounded-2xl border border-white/10 bg-slate-950/30 p-2">
          <div className="text-[11px] uppercase tracking-[0.24em] text-white/40 mb-2 px-1">Continue as</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${selectedRole === 'student' ? 'border-blue-400 bg-blue-500/90 text-white shadow-lg shadow-blue-500/20' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-base">🎓</span>
                <span>Student</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('owner')}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${selectedRole === 'owner' ? 'border-purple-400 bg-purple-500/90 text-white shadow-lg shadow-purple-500/20' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-base">🏠</span>
                <span>Owner</span>
              </span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full mb-4 py-3 rounded-xl bg-white hover:bg-gray-100 transition text-slate-800 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-white/40 text-xs">OR</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        <input
          type="text"
          placeholder="Email or Phone Number"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="w-full mb-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-4 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition text-white font-semibold disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <p className="text-white/60 text-sm mt-4 text-center">
          <Link to="/" className="text-blue-300 hover:underline">← Back</Link>
        </p>
      </form>
    </div>
  )
}
