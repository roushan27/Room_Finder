import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LogoutButton() {
  const { signOut } = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        title="Logout"
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white hover:bg-red-500/20 hover:border-red-400/50 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/95 border border-white/20 rounded-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-white text-lg font-semibold mb-2">Log out?</h3>
            <p className="text-white/60 text-sm mb-6">
              Kya aap sach mein logout karna chahte ho?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={signOut}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
