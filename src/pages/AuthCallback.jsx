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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
        {error ? (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Sign-in failed</h2>
            <p className="text-red-300 text-sm mb-5 bg-red-500/10 p-3 rounded-lg">{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition text-white font-semibold"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Signing you in...</h2>
            <p className="text-white/60 text-sm">Please wait while we open your dashboard.</p>
          </>
        )}
      </div>
    </div>
  )
}
