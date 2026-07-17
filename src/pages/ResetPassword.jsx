import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '../context/ToastContext'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    // Supabase redirect link automatically sets a recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setValidSession(!!session)
      setChecking(false)
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success('Password updated successfully!')
      setTimeout(() => navigate('/login'), 1000)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4">
        <p className="text-slate-400 font-bold text-xs">Verifying reset link...</p>
      </div>
    )
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4 antialiased">
        <div className="w-full max-w-sm bg-[#fbe4c8] border border-orange-200 rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-xl font-black text-[#b5451a] mb-2">Link Expired ⚠️</h2>
          <p className="text-slate-600 font-medium text-xs mb-6 leading-relaxed">
            Ye reset link expire ho chuka hai ya invalid hai. Naya request bhejo.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full py-3 rounded-xl bg-brand-sage text-white font-black text-sm hover:opacity-90 transition"
          >
            Request New Link
          </button>
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
        <h2 className="text-xl font-black text-[#b5451a] mb-1 text-center">Set New Password</h2>
        <p className="text-center text-slate-500 font-medium text-xs mb-6">
          Choose a strong new password
        </p>

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full mb-3 px-4 py-2.5 rounded-xl bg-white text-slate-800 text-xs focus:outline-none transition-all shadow-[inset_2px_2px_5px_rgba(180,120,60,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] focus:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]"
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="w-full mb-5 px-4 py-2.5 rounded-xl bg-white text-slate-800 text-xs focus:outline-none transition-all shadow-[inset_2px_2px_5px_rgba(180,120,60,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] focus:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#b5451a] transition-all text-white font-bold text-sm disabled:opacity-50 shadow-[3px_4px_8px_rgba(60,20,5,0.4),-2px_-2px_5px_rgba(255,255,255,0.15)] hover:shadow-[2px_3px_5px_rgba(60,20,5,0.4),-1px_-1px_3px_rgba(255,255,255,0.15)] active:shadow-[inset_2px_2px_5px_rgba(60,20,5,0.45)] active:scale-98"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}