import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL ya Anon Key .env file mein missing hai!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,     // keeps the session saved in localStorage across app restarts
    autoRefreshToken: true,   // automatically refreshes the token so login never silently expires
    detectSessionInUrl: true,
  },
})
