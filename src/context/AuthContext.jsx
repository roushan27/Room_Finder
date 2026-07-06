import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext()

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
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)

    if (error) setProfile(null)
    else if (!data || data.length === 0) setProfile(null)
    else setProfile(data[0])
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

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
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
