import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  if (!profile) return null

  const homePath = profile.role === 'owner' ? '/owner/dashboard' : '/student/dashboard'
  const isStudent = profile.role === 'student'

  const tabs = [
    {
      key: 'home',
      label: 'Home',
      path: homePath,
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4a1 1 0 001-1v-5a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 001 1h4a1 1 0 001-1V10" />
        </svg>
      ),
    },
    ...(isStudent
      ? [
          {
            key: 'bookings',
            label: 'Bookings',
            path: '/student/bookings',
            icon: (active) => (
              <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
          },
        ]
      : []),
    {
      key: 'favorites',
      label: 'Saved',
      path: `${homePath}?favorites=1`,
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
   key: 'messages',
      label: 'Chat',
      path: '/messages',
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      key: 'profile',
      label: 'Profile',
      action: () => setShowLogoutConfirm(true),
      icon: (active) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ]

  const isActive = (tab) => {
    if (!tab.path) return false
    const [tabPath, tabQuery] = tab.path.split('?')
    const currentQuery = location.search.includes('favorites=1')
    if (tabQuery) return location.pathname === tabPath && currentQuery
    return location.pathname === tabPath && !currentQuery
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white border-t border-orange-200/70 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const active = isActive(tab)
            return (
              <button
                key={tab.key}
                onClick={() => (tab.action ? tab.action() : navigate(tab.path))}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-90 ${
                  active ? 'text-brand-sage' : 'text-slate-400'
                }`}
              >
                {tab.icon(active)}
                <span className={`text-[10px] font-bold ${active ? 'text-brand-sage' : 'text-slate-400'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Logout Confirmation Modal — theme-matched */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-orange-200/70 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150"
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
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={signOut}
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