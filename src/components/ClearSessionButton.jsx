import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '../context/ToastContext'
export default function ClearSessionButton() {
  const [clearing, setClearing] = useState(false)
  const { toast } = useToast()

  const handleClearSession = async () => {
    setClearing(true)
    try {
      // Supabase session sign-out (local + purana auth token clear)
      await supabase.auth.signOut()

      // Kisi bhi leftover Supabase/OAuth key ko localStorage se hata do
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
      
         toast.success('Session cleared. Reloading...')
     setTimeout(() => window.location.reload(), 800)
      
    } catch (err) {
      console.error('Session clear failed:', err)
      toast.error('Could not clear session. Try again.')
      setClearing(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClearSession}
      disabled={clearing}
      className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hover:text-[#b5451a] transition underline disabled:opacity-50"
    >
      {clearing ? 'Clearing...' : 'Having trouble logging in? Clear session'}
    </button>
  )
}