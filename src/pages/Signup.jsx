import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role')

  const [role, setRole] = useState(initialRole || null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signUp(email, password, fullName, role)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  // Step 1: Ask role first if not already chosen via URL
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-white/60 text-sm mb-6">Aap kaun hain?</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setRole('student')}
              className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition text-white font-semibold"
            >
              🎓 I'm a Student
            </button>
            <button
              onClick={() => setRole('owner')}
              className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition font-semibold"
            >
              🏠 I'm a Room Owner
            </button>
          </div>

          <p className="text-white/60 text-sm mt-6 text-center">
            <Link to="/" className="text-blue-300 hover:underline">
              ← Back
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // Step 2: Success screen after signup
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Account Created! ✅</h2>
          <p className="text-white/60 text-sm mb-6">
            Apna email check karo verification link ke liye, phir login karo.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition text-white font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Step 3: Actual signup form, now that role is known
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8"
      >
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-xl font-bold text-white">Create Account</h2>
          <button
            type="button"
            onClick={() => setRole(null)}
            className="text-white/40 text-xs hover:text-white transition"
          >
            Change role
          </button>
        </div>
        <p className="text-blue-300 text-sm mb-6 capitalize">
          Signing up as {role}
        </p>

        {error && (
          <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded-lg">{error}</p>
        )}

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
          className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition text-white font-semibold disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <p className="text-white/60 text-sm mt-4 text-center">
          <Link to="/" className="text-blue-300 hover:underline">
            ← Back
          </Link>
        </p>
      </form>
    </div>
  )
}
