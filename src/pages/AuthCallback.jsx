import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const ADMIN_EMAIL = 'kumarroushan4122@gmail.com'

export default function AuthCallback() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [settingRole, setSettingRole] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return

    if (!user) {
      navigate('/login')
      return
    }

    // Profile already exists (returning user) — go straight to their dashboard
    if (profile) {
      navigate('/dashboard')
      return
    }

    // Admin email skips the role-picker entirely and is auto-provisioned as admin
    if (user.email === ADMIN_EMAIL) {
      autoCreateAdminProfile()
    }
    // Otherwise, no profile yet — we wait here and show the role-picker below
  }, [user, profile, loading, navigate])

  const autoCreateAdminProfile = async () => {
    setSettingRole(true)
    setError('')

    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Admin'

    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName,
      role: 'admin',
    })

    if (insertError) {
      setError(insertError.message)
      setSettingRole(false)
      return
    }

    window.location.href = '/dashboard'
  }

  const handleChooseRole = async (role) => {
    setSettingRole(true)
    setError('')

    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'User'

    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName,
      role: role,
    })

    if (insertError) {
      setError(insertError.message)
      setSettingRole(false)
      return
    }

    // Force a reload so AuthContext refetches the profile and redirects correctly
    window.location.href = '/dashboard'
  }

  // Loading, or already has a profile, or is the admin email being auto-provisioned —
  // in all these cases just show a loading state, never the role-picker
  if (loading || (user && profile) || (user && user.email === ADMIN_EMAIL)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  // New Google user (non-admin) with no profile yet — ask them to pick a role once
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Welcome!</h2>
        <p className="text-white/60 text-sm mb-6">Aap kaun hain?</p>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded-lg">{error}</p>}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleChooseRole('student')}
            disabled={settingRole}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition text-white font-semibold disabled:opacity-50"
          >
            🎓 I'm a Student
          </button>
          <button
            onClick={() => handleChooseRole('owner')}
            disabled={settingRole}
            className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition font-semibold disabled:opacity-50"
          >
            🏠 I'm a Room Owner
          </button>
        </div>
      </div>
    </div>
  )
}
