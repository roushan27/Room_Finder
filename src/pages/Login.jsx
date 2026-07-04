import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8"
      >
        <h2 className="text-lg sm:text-xl font-bold text-white mb-6 text-center">Log In</h2>

        {error && (
          <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded-lg">{error}</p>
        )}

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
          <Link to="/" className="text-blue-300 hover:underline">
            ← Back
          </Link>
        </p>
      </form>
    </div>
  )
}
