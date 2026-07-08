import { useAuth } from '../../context/AuthContext'
import LogoutButton from '../../components/common/LogoutButton'
import NotificationBell from '../../components/common/NotificationBell'
import ChatInbox from '../../components/common/ChatInbox'
import Footer from '../../components/common/Footer'

export default function AdminDashboard() {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1
          className="text-xl sm:text-2xl font-bold text-white px-5 py-3 rounded-2xl inline-block"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 4px 12px rgba(59,130,246,0.15)',
          }}
        >
          Admin Panel — {profile?.full_name || 'Administrator'}
        </h1>
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <ChatInbox />
          <NotificationBell />
          <LogoutButton />
        </div>
      </div>

      <div className="space-y-4 text-slate-200">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40">
          <h2 className="text-lg font-semibold text-white mb-2">Overview</h2>
          <p className="text-slate-300">Manage users, rooms, and analytics from the admin dashboard.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20">
            <h3 className="text-base font-semibold text-white mb-2">User Activity</h3>
            <p className="text-slate-300">View system activity and moderate content.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20">
            <h3 className="text-base font-semibold text-white mb-2">Room Reports</h3>
            <p className="text-slate-300">Inspect room listings and enforce quality standards.</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
