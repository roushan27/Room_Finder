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

  // View Phase 1: Role Selection
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdeee0] px-4 antialiased">
        <div className="w-full max-w-sm bg-[#fbe4c8] border border-orange-200 rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-xl font-black text-[#b5451a] mb-1">Create Account</h2>
          <p className="text-slate-500 font-medium text-xs mb-6">Aap kaun hain?</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => setRole('student')} className="w-full py-3 rounded-xl bg-brand-sage text-white font-black text-sm hover:opacity-90 transition">🎓 I'm a Student</button>
            <button onClick={() => setRole('owner')} className="w-full py-3 rounded-xl bg-white border border-orange-200 text-slate-700 font-black text-sm hover:bg-orange-50 transition">🏠 I'm a Room Owner</button>
          </div>
          <p className="text-slate-500 text-xs mt-6"><Link to="/" className="text-[#b5451a] font-bold hover:underline">← Back to Home</Link></p>
        </div>
      </div>
    )
  }

  // View Phase 2: Success
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdeee0] px-4 antialiased">
        <div className="w-full max-w-sm bg-[#fbe4c8] border border-orange-200 rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-xl font-black text-[#b5451a] mb-2">Account Created! ✅</h2>
          <p className="text-slate-600 font-medium text-xs mb-6 leading-relaxed">Apna email check karo verification link ke liye.</p>
          <button onClick={() => navigate('/login')} className="w-full py-3 rounded-xl bg-brand-sage text-white font-black text-sm hover:opacity-90 transition">Go to Login</button>
        </div>
      </div>
    )
  }

  // View Phase 3: Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdeee0] px-4 antialiased">
      <form onSubmit={handleSignup} className="w-full max-w-sm bg-[#fbe4c8] border border-orange-200 rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-xl font-black text-[#b5451a]">Sign Up</h2>
          <button type="button" onClick={() => setRole(null)} className="text-slate-500 text-xs font-black hover:underline hover:text-[#b5451a]">Change role</button>
        </div>
        <p className="text-brand-sage text-[10px] font-black mb-6 uppercase tracking-widest">Signing up as {role}</p>

        {error && <p className="text-brand-coral text-xs font-bold mb-4 bg-white p-3 rounded-xl border border-brand-coral/20">{error}</p>}

        <button type="button" onClick={handleGoogleSignup} className="w-full mb-4 py-3 rounded-xl bg-white border border-orange-200 text-slate-700 font-bold text-xs hover:bg-orange-50 transition">
          {googleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        <div className="relative flex items-center my-5"><div className="flex-grow border-t border-orange-200" /><span className="mx-3 text-[9px] text-slate-400 font-black">OR</span><div className="flex-grow border-t border-orange-200" /></div>

        <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full mb-3 px-4 py-3 rounded-xl border border-orange-200 text-xs focus:outline-none focus:border-[#e8862e]" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full mb-3 px-4 py-3 rounded-xl border border-orange-200 text-xs focus:outline-none focus:border-[#e8862e]" />
        <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full mb-3 px-4 py-3 rounded-xl border border-orange-200 text-xs focus:outline-none focus:border-[#e8862e]" />
        <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full mb-5 px-4 py-3 rounded-xl border border-orange-200 text-xs focus:outline-none focus:border-[#e8862e]" />

        <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-[#b5451a] text-white font-black text-sm hover:opacity-90 transition">
          {loading ? 'Creating...' : 'Sign Up'}
        </button>
        <p className="text-center mt-5"><Link to="/" className="text-[#b5451a] font-bold text-xs hover:underline">← Back to Home</Link></p>
      </form>
    </div>
  )
}