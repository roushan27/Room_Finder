import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ClearSessionButton from '../components/ClearSessionButton'

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
    <div className="min-h-screen flex items-center justify-center bg-[#fdeee0] px-4 antialiased">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-[#fbe4c8] border border-orange-200 rounded-2xl shadow-lg p-6 sm:p-8"
      >
        <h2 className="text-xl font-black text-[#b5451a] mb-1 text-center">Log In</h2>
        <p className="text-center text-slate-500 font-medium text-xs mb-6">Choose how you want to continue</p>

        {error && (
          <p className="text-brand-coral text-xs font-bold mb-4 bg-brand-coral/10 p-3 rounded-xl border border-brand-coral/20">
            {error}
          </p>
        )}

        {/* Role Toggle */}
        <div className="mb-5 rounded-xl border border-orange-200 bg-white/50 p-1.5">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 px-1">Continue as</div>
         <div className="flex gap-2">
  <button
    type="button"
    onClick={() => setSelectedRole('student')}
    // Yahan hum ternary operator use kar rahe hain:
    // Agar selectedRole 'student' hai, toh bg-brand-sage, nahi toh transparent.
    className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
      selectedRole === 'student' 
       ? 'bg-brand-sage text-white shadow-[2px_3px_5px_rgba(20,60,30,0.35),-1px_-1px_2px_rgba(255,255,255,0.25)]' 
      : 'bg-white text-slate-500 shadow-[2px_3px_5px_rgba(180,120,60,0.25),-1px_-1px_2px_rgba(255,255,255,0.7)] hover:shadow-[1px_2px_3px_rgba(180,120,60,0.25),-0.5px_-0.5px_1px_rgba(255,255,255,0.7)]'
    }`}
  >
    <span>🎓 Student</span>
  </button>
  
  <button
    type="button"
    onClick={() => setSelectedRole('owner')}
    // Agar selectedRole 'owner' hai, toh bg-brand-sage, nahi toh transparent.
    className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
      selectedRole === 'owner' 
       ? 'bg-brand-sage text-white shadow-[2px_3px_5px_rgba(20,60,30,0.35),-1px_-1px_2px_rgba(255,255,255,0.25)]' 
      : 'bg-white text-slate-500 shadow-[2px_3px_5px_rgba(180,120,60,0.25),-1px_-1px_2px_rgba(255,255,255,0.7)] hover:shadow-[1px_2px_3px_rgba(180,120,60,0.25),-0.5px_-0.5px_1px_rgba(255,255,255,0.7)]'  
    }`}
  >
    <span>🏠 Owner</span>
  </button>
</div>
        </div>

        {/* Google Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full mb-4 py-2.5 rounded-xl bg-white text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[3px_4px_8px_rgba(180,120,60,0.25),-2px_-2px_5px_rgba(255,255,255,0.7)] hover:shadow-[2px_3px_5px_rgba(180,120,60,0.25),-1px_-1px_3px_rgba(255,255,255,0.7)] active:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.3)] active:scale-98"
        >
          {googleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        <div className="relative flex items-center my-5 select-none">
          <div className="flex-grow border-t border-orange-200" />
          <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-bold tracking-widest">OR</span>
          <div className="flex-grow border-t border-orange-200" />
        </div>

        {/* Credentials */}
        <input
          type="text"
          placeholder="Email or Phone Number"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="w-full mb-3 px-4 py-2.5 rounded-xl bg-white text-slate-800 text-xs focus:outline-none transition-all shadow-[inset_2px_2px_5px_rgba(180,120,60,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] focus:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-5 px-4 py-2.5 rounded-xl bg-white text-slate-800 text-xs focus:outline-none transition-all shadow-[inset_2px_2px_5px_rgba(180,120,60,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] focus:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#b5451a] transition-all text-white font-bold text-sm disabled:opacity-50 shadow-[3px_4px_8px_rgba(60,20,5,0.4),-2px_-2px_5px_rgba(255,255,255,0.15)] hover:shadow-[2px_3px_5px_rgba(60,20,5,0.4),-1px_-1px_3px_rgba(255,255,255,0.15)] active:shadow-[inset_2px_2px_5px_rgba(60,20,5,0.45)] active:scale-98"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <p className="text-slate-500 text-xs mt-5 text-center font-semibold">
          <Link to="/" className="text-[#b5451a] hover:underline">← Back to Home</Link>
        </p>
        <p className="text-center mt-3">
   <ClearSessionButton />
 </p>
      </form>
    </div>
  )
}