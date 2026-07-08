import { useAuth } from '../../context/AuthContext'
import RoomList from '../../components/student/RoomList'
import LogoutButton from '../../components/common/LogoutButton'
import NotificationBell from '../../components/common/NotificationBell'
import ChatInbox from '../../components/common/ChatInbox'
import Footer from '../../components/common/Footer'

export default function StudentDashboard() {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-6">
     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
  <h1
    className="text-lg sm:text-2xl font-bold text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl inline-block tracking-tight"
    style={{
      background: 'linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 4px 12px rgba(59,130,246,0.15)',
    }}
  >
    Welcome, <span className="font-extrabold bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">{profile?.full_name}</span> 👋
  </h1>
  <div className="flex gap-2 sm:gap-3 items-center self-end sm:self-auto">
    <ChatInbox />
    <NotificationBell />
    <LogoutButton />
  </div>
</div>

<p className="text-white/50 text-sm sm:text-base mb-6 sm:mb-8 px-1">
  Find your perfect room 🔑
</p>

      <RoomList />
      <Footer />
    </div>
  )
}
