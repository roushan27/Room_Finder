import { useAuth } from '../../context/AuthContext'
import RoomList from '../../components/student/RoomList'
import LogoutButton from '../../components/common/LogoutButton'
import NotificationBell from '../../components/common/NotificationBell'
import ChatInbox from '../../components/common/ChatInbox'
import Footer from '../../components/common/Footer'

export default function StudentDashboard() {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen bg-[#fdeee0] antialiased text-slate-800">
      {/* Full-bleed gradient banner header, matching Owner Panel */}
      <div className="bg-gradient-to-r from-[#b5451a] to-[#e8792e] px-4 sm:px-6 py-5 sm:py-6">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Welcome, <span className="text-white/80 font-medium text-sm sm:text-base">{profile?.full_name}</span> 👋
            </h1>
            <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mt-1">Find your perfect room</p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 bg-white/15 border border-white/25 p-1.5 rounded-xl">
              <ChatInbox />
              <div className="w-px h-4 bg-white/25" />
              <NotificationBell />
              <div className="w-px h-4 bg-white/25" />
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto space-y-6 p-4 sm:p-6">
        <RoomList />
      </div>

      <div className="mt-12 pt-4 border-t border-orange-200/60 max-w-7xl w-full mx-auto">
        <Footer />
      </div>
    </div>
  )
}
