import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role')

  const [role, setRole] = useState(initialRole || null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signUp(email, password, fullName, role, phoneNumber)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    setError('')
    const { error } = await signInWithGoogle(role)
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-white/60 text-sm mb-6">Aap kaun hain?</p>
          <div className="flex flex-col gap-3">
           <button
  onClick={() => setRole('student')}
  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 transition text-white  text-base shadow-lg shadow-blue-500/40 border-2 border-blue-400/50"
>
  🎓 I'm a Student
</button>
<button
  onClick={() => setRole('owner')}
  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 transition text-white  text-base shadow-lg shadow-purple-500/40 border-2 border-purple-400/50"
>
  🏠 I'm a Room Owner
</button>
          </div>
          <p className="text-white/60 text-sm mt-6 text-center">
            <Link to="/" className="text-blue-300 hover:underline">← Back</Link>
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Account Created! ✅</h2>
          <p className="text-white/60 text-sm mb-6">
            Apna email check karo verification link ke liye, phir login karo (email ya phone number se).
          </p>
          <button onClick={() => navigate('/login')} className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition text-white font-semibold">
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <form onSubmit={handleSignup} className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-xl text-white">Create Account</h2>
         <button
  type="button"
  onClick={() => setRole(null)}
  className="text-yellow-400 text-xs font-medium hover:text-yellow-300 transition underline"
>
  Change role
</button>
        </div>
        <p className="text-blue-300 text-sm mb-6 capitalize">Signing up as {role}</p>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded-lg">{error}</p>}

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          className="w-full mb-4 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/30 hover:bg-white/20 hover:border-white/50 transition text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-black/20"
style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset' }}
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
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full mb-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
        />
        <input
          type="tel"
          placeholder="Phone Number (optional, for login too)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full mb-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full mb-4 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
        />

        <button
  type="submit"
  disabled={loading}
  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 transition text-white font-bold disabled:opacity-50 border border-blue-400/50"
  style={{ boxShadow: '0 8px 32px rgba(59,130,246,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset' }}
>
  {loading ? 'Creating account...' : 'Sign Up'}
</button>

        <p className="text-white/60 text-sm mt-4 text-center">
          <Link to="/" className="text-blue-300 hover:underline">← Back</Link>
        </p>
      </form>
    </div>
  )
}
