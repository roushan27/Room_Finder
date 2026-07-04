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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Welcome, {profile?.full_name} 👋
        </h1>
        <div className="flex gap-2 sm:gap-3 items-center self-end sm:self-auto">
          <ChatInbox />
          <NotificationBell />
          <LogoutButton />
        </div>
      </div>

      <RoomList />
      <Footer />
    </div>
  )
}
