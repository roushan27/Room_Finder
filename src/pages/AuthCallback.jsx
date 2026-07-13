import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const ADMIN_EMAIL = 'kumarroushan4122@gmail.com'
const VALID_ROLES = new Set(['student', 'owner'])

export default function AuthCallback() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    const ensureProfileAndRedirect = async () => {
      const params = new URLSearchParams(window.location.search)
      const errorCode = params.get('error')
      const errorDescription = params.get('error_description')

      if (errorCode) {
        setError(errorDescription || 'Google sign-in failed. Please try again.')
        return
      }

      if (loading) return

      const activeUser = user || (await getSessionUser())

      if (!isActive) return

      if (!activeUser) {
        navigate('/login', { replace: true })
        return
      }

      if (profile) {
        clearPendingRole()
        navigate('/dashboard', { replace: true })
        return
      }

      const created = await createMissingProfile(activeUser)
      if (!isActive) return

      if (created.error) {
        setError(created.error)
        return
      }

      clearPendingRole()
      window.location.replace('/dashboard')
    }

    ensureProfileAndRedirect()

    return () => {
      isActive = false
    }
  }, [user, profile, loading, navigate])

  const getSessionUser = async () => {
    const { data, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      setError(sessionError.message)
      return null
    }

    return data.session?.user || null
  }

  const createMissingProfile = async (authUser) => {
    const metadata = authUser.user_metadata || {}
    const pendingRole = window.localStorage.getItem('pending_google_role')
    const role =
      authUser.email === ADMIN_EMAIL
        ? 'admin'
        : VALID_ROLES.has(pendingRole)
          ? pendingRole
          : VALID_ROLES.has(metadata.role)
            ? metadata.role
            : 'student'

    const payload = {
      id: authUser.id,
      full_name: metadata.full_name || metadata.name || authUser.email?.split('@')[0] || 'User',
      role,
    }

    if (metadata.phone_number) {
      payload.phone = metadata.phone_number
    }

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })

    if (upsertError) {
      return { error: upsertError.message }
    }

    return { error: null }
  }

  const clearPendingRole = () => {
    window.localStorage.removeItem('pending_google_role')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 px-4 antialiased text-slate-800">
      <div className="w-full max-w-sm bg-white border border-slate-200/80 rounded-2xl shadow-xl p-6 sm:p-8 text-center space-y-4">
        {error ? (
          <>
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">Verification Aborted</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Session handshake failed</p>
            </div>
            
            <p className="text-brand-coral font-bold text-xs bg-brand-coral/5 border border-brand-coral/10 p-3.5 rounded-xl text-left">
              ⚠ {error}
            </p>
            
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-2xs"
            >
              Back to Login
            </button>
          </>
        ) : (
          <div className="py-4 space-y-3">
            {/* Minimal line-spinner container */}
            <div className="flex justify-center items-center">
              <div className="w-6 h-6 border-[2.5px] border-brand-sage border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Syncing Identity Matrix</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Establishing authenticated session state...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}