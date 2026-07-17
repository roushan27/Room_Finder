import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '../context/ToastContext'

const RESEND_COOLDOWN = 30 // seconds

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const sendResetEmail = async () => {
    const redirectTo = `${window.location.origin}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    // Real production apps never reveal whether an email exists in the system —
    // this prevents attackers from using this form to check registered emails.
    // Only show an error for genuine problems (invalid format, rate limit), not "user not found".
    if (error && !error.message.toLowerCase().includes('user not found')) {
      toast.error(error.message)
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const success = await sendResetEmail()
    setLoading(false)
    if (success) {
      setSent(true)
      setCooldown(RESEND_COOLDOWN)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setLoading(true)
    const success = await sendResetEmail()
    setLoading(false)
    if (success) {
      toast.success('Reset link sent again')
      setCooldown(RESEND_COOLDOWN)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4 antialiased">
        <div className="w-full max-w-sm bg-[#fbe4c8] border border-orange-200 rounded-2xl shadow-lg p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-brand-sage/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-brand-sage" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-[#b5451a] mb-2">Check your email</h2>
          <p className="text-slate-600 font-medium text-xs mb-1 leading-relaxed">
            If an account exists for
          </p>
          <p className="text-slate-800 font-bold text-sm mb-4">{email}</p>
          <p className="text-slate-500 text-[11px] font-medium mb-6 leading-relaxed">
            you'll receive a password reset link shortly. Check your spam folder if you don't see it.
          </p>

          <button
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            className="w-full py-2.5 rounded-xl bg-white text-slate-600 text-xs font-bold uppercase tracking-wider transition-all shadow-[3px_4px_8px_rgba(180,120,60,0.2),-2px_-2px_5px_rgba(255,255,255,0.7)] hover:shadow-[2px_3px_5px_rgba(180,120,60,0.2),-1px_-1px_3px_rgba(255,255,255,0.7)] active:scale-98 disabled:opacity-50 mb-3"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : loading ? 'Sending...' : 'Resend Email'}
          </button>

          <Link
            to="/login"
            className="block w-full py-3 rounded-xl bg-brand-sage text-white font-black text-sm hover:opacity-90 transition text-center"
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4 antialiased">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-[#fbe4c8] border border-orange-200 rounded-2xl shadow-lg p-6 sm:p-8"
      >
        <h2 className="text-xl font-black text-[#b5451a] mb-1 text-center">Reset your password</h2>
        <p className="text-center text-slate-500 font-medium text-xs mb-6">
          Enter the email linked to your account and we'll send a secure link to reset your password
        </p>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          className="w-full mb-5 px-4 py-2.5 rounded-xl bg-white text-slate-800 text-xs focus:outline-none transition-all shadow-[inset_2px_2px_5px_rgba(180,120,60,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] focus:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#b5451a] transition-all text-white font-bold text-sm disabled:opacity-50 shadow-[3px_4px_8px_rgba(60,20,5,0.4),-2px_-2px_5px_rgba(255,255,255,0.15)] hover:shadow-[2px_3px_5px_rgba(60,20,5,0.4),-1px_-1px_3px_rgba(255,255,255,0.15)] active:shadow-[inset_2px_2px_5px_rgba(60,20,5,0.45)] active:scale-98"
        >
          {loading ? 'Sending link...' : 'Send Reset Link'}
        </button>

        <p className="text-slate-500 text-xs mt-5 text-center font-semibold">
          <Link to="/login" className="text-[#b5451a] hover:underline">← Back to Login</Link>
        </p>
      </form>
    </div>
  )
}