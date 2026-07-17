import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

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
  const [showPassword, setShowPassword] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    const phoneRegex = /^[6-9]\d{9}$/
 if (phoneNumber && !phoneRegex.test(phoneNumber.trim())) {
   toast.error('Please enter a valid 10-digit phone number')
   return
 }
    setLoading(true)
    const { error } = await signUp(email, password, fullName, role, phoneNumber)
    if (error) {
       toast.error(error.message)
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
      toast.error(error.message)
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
            <button onClick={() => setRole('student')} className="w-full py-3 rounded-xl bg-brand-sage text-white font-black text-sm transition-all shadow-[3px_4px_8px_rgba(20,60,30,0.35),-2px_-2px_5px_rgba(255,255,255,0.25)] hover:shadow-[2px_3px_5px_rgba(20,60,30,0.35),-1px_-1px_3px_rgba(255,255,255,0.25)] active:shadow-[inset_2px_2px_5px_rgba(20,60,30,0.4)] active:scale-98">🎓 I'm a Student</button>
            <button onClick={() => setRole('owner')} className="w-full py-3 rounded-xl bg-white text-slate-700 font-black text-sm transition-all shadow-[3px_4px_8px_rgba(180,120,60,0.25),-2px_-2px_5px_rgba(255,255,255,0.7)] hover:shadow-[2px_3px_5px_rgba(180,120,60,0.25),-1px_-1px_3px_rgba(255,255,255,0.7)] active:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.3)] active:scale-98">🏠 I'm a Room Owner</button>
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

       

        <button type="button" onClick={handleGoogleSignup} className="w-full mb-4 py-3 rounded-xl bg-white text-slate-700 font-bold text-xs transition-all shadow-[3px_4px_8px_rgba(180,120,60,0.25),-2px_-2px_5px_rgba(255,255,255,0.7)] hover:shadow-[2px_3px_5px_rgba(180,120,60,0.25),-1px_-1px_3px_rgba(255,255,255,0.7)] active:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.3)] active:scale-98">
          {googleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        <div className="relative flex items-center my-5"><div className="flex-grow border-t border-orange-200" /><span className="mx-3 text-[9px] text-slate-400 font-black">OR</span><div className="flex-grow border-t border-orange-200" /></div>

        <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full mb-3 px-4 py-3 rounded-xl bg-white text-xs focus:outline-none transition-all shadow-[inset_2px_2px_5px_rgba(180,120,60,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] focus:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full mb-3 px-4 py-3 rounded-xl bg-white text-xs focus:outline-none transition-all shadow-[inset_2px_2px_5px_rgba(180,120,60,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] focus:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]" />
        <input 
  type="tel" 
  placeholder="Phone Number" 
  value={phoneNumber} 
  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} 
  className="w-full mb-3 px-4 py-3 rounded-xl bg-white text-xs focus:outline-none transition-all shadow-[inset_2px_2px_5px_rgba(180,120,60,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] focus:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]" 
/>
         <div className="relative mb-5">
   <input
     type={showPassword ? 'text' : 'password'}
     placeholder="Password (min 6 chars)"
     value={password}
     onChange={(e) => setPassword(e.target.value)}
     required
     minLength={6}
     className="w-full px-4 py-3 pr-11 rounded-xl bg-white text-xs focus:outline-none transition-all shadow-[inset_2px_2px_5px_rgba(180,120,60,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] focus:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]"
   />
   <button
     type="button"
     onClick={() => setShowPassword((prev) => !prev)}
     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
     aria-label={showPassword ? 'Hide password' : 'Show password'}
   >
     {showPassword ? (
       <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
       </svg>
     ) : (
       <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
         <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
       </svg>
     )}
   </button>
 </div>
        <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-[#b5451a] text-white font-black text-sm transition-all shadow-[3px_4px_8px_rgba(60,20,5,0.4),-2px_-2px_5px_rgba(255,255,255,0.15)] hover:shadow-[2px_3px_5px_rgba(60,20,5,0.4),-1px_-1px_3px_rgba(255,255,255,0.15)] active:shadow-[inset_2px_2px_5px_rgba(60,20,5,0.45)] active:scale-98">
          {loading ? 'Creating...' : 'Sign Up'}
        </button>
        <p className="text-center mt-5"><Link to="/" className="text-[#b5451a] font-bold text-xs hover:underline">← Back to Home</Link></p>
      </form>
    </div>
  )
}