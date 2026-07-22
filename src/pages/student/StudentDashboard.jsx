import { useAuth } from '../../context/AuthContext'
import RoomList from '../../components/student/RoomList'
import LogoutButton from '../../components/common/LogoutButton'
import NotificationBell from '../../components/common/NotificationBell'
import ChatInbox from '../../components/common/ChatInbox'
import Footer from '../../components/common/Footer'
import { useNavigate } from 'react-router-dom'
 import BottomNav from '../../components/common/BottomNav'


export default function StudentDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-brand-cream antialiased text-slate-800 pb-16 sm:pb-0">
      {/* Full-bleed gradient banner header, matching Owner Panel */}
      <div className="bg-gradient-to-b from-[#e8792e] to-[#f4a565] px-4 sm:px-6 py-5 sm:py-6">
       <div className="max-w-7xl w-full mx-auto flex flex-row justify-between items-center gap-2">
  <div className="min-w-0">
      <h1 className="text-base sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2 truncate">
     <img src="/logo.png" alt="Room Finder" className="h-7 w-7 sm:h-9 sm:w-9 object-contain flex-shrink-0" />
      <span className="flex flex-col leading-tight truncate">
     <span className="text-[10px] sm:text-xs font-medium text-white/70 uppercase tracking-wider">Welcome</span>
     <span className="truncate">{profile?.full_name}</span>
   </span>
   </h1>
    <p className="text-white/70 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 hidden sm:block">Find your perfect room</p>
   </div>  
 
   <div className="flex items-center gap-1.5 sm:gap-2 bg-white/15 border border-white/25 p-1 sm:p-1.5 rounded-xl">
     <span className="hidden sm:block">
   <ChatInbox />
 </span>
 <div className="w-px h-4 bg-white/25 hidden sm:block" />
     <NotificationBell />
     <div className="w-px h-4 bg-white/25 hidden sm:block" />
 <span className="hidden sm:block">
   <LogoutButton />
 </span>
  
 </div>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto space-y-6 p-4 sm:p-6">
        <RoomList />
      </div>

      <div className="mt-12 max-w-7xl w-full mx-auto">
        <Footer />
      </div>
       <BottomNav />
    </div>
  )
}
