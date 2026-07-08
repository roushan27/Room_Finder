import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext()
const ADMIN_EMAIL = 'kumarroushan4122@gmail.com'
const VALID_ROLES = new Set(['student', 'owner'])

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        supabase.auth.signOut()
        setUser(null)
        setLoading(false)
        return
      }
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const createProfileFromUser = async (authUser, fallbackRole = 'student') => {
    const metadata = authUser.user_metadata || {}
    const pendingRole = window.localStorage.getItem('pending_google_role')
    const role =
      authUser.email === ADMIN_EMAIL
        ? 'admin'
        : VALID_ROLES.has(pendingRole)
          ? pendingRole
          : VALID_ROLES.has(metadata.role)
            ? metadata.role
            : fallbackRole
    const fullName = metadata.full_name || metadata.name || authUser.email?.split('@')[0] || 'User'

    const payload = {
      id: authUser.id,
      full_name: fullName,
      role,
    }

    if (metadata.phone_number) {
      payload.phone = metadata.phone_number
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) {
      console.error('Profile creation failed:', error.message)
      return null
    }
    return data
  }

  const fetchProfile = async (authUser) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)

    if (error) {
      setProfile(null)
    } else if (!data || data.length === 0) {
      const createdProfile = await createProfileFromUser(authUser)
      setProfile(createdProfile)
    } else {
      setProfile(data[0])
    }
    setLoading(false)
  }

  const signUp = async (email, password, fullName, role, phoneNumber) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: role, phone_number: phoneNumber || null },
      },
    })
    return { data, error }
  }

  // Accepts either an email or a phone number in `identifier`.
  // If it looks like a phone number, we first resolve it to the matching email
  // via a safe RPC function, then sign in normally with email+password (no OTP involved).
  const signIn = async (identifier, password) => {
    const isEmail = identifier.includes('@')
    let email = identifier

    if (!isEmail) {
      const { data: resolvedEmail, error: lookupError } = await supabase.rpc('get_email_by_phone', {
        phone: identifier.trim(),
      })

      if (lookupError || !resolvedEmail) {
        return { data: null, error: { message: 'No account found with this phone number' } }
      }
      email = resolvedEmail
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signInWithGoogle = async (role) => {
    const redirectTo = import.meta.env.VITE_AUTH_REDIRECT_URL || `${window.location.origin}/auth/callback`

    if (role) {
      window.localStorage.setItem('pending_google_role', role)
    } else {
      window.localStorage.removeItem('pending_google_role')
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        flowType: 'pkce',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
