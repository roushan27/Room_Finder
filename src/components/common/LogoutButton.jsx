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
        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white hover:bg-red-500/20 hover:border-red-400/50 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-orange-200/70 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="w-14 h-14 rounded-full bg-brand-coral/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-brand-coral" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>

            <h3 className="text-slate-800 font-black text-base mb-1.5">Log out?</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
              You'll need to log in again to access your account.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  signOut()
                  setShowConfirm(false)
                }}
                className="flex-1 py-2.5 rounded-xl bg-brand-coral text-white text-xs font-black uppercase tracking-wider hover:opacity-90 transition active:scale-95 shadow-2xs"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}