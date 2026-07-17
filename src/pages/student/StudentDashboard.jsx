import { useAuth } from '../../context/AuthContext'
import RoomList from '../../components/student/RoomList'
import LogoutButton from '../../components/common/LogoutButton'
import NotificationBell from '../../components/common/NotificationBell'
import ChatInbox from '../../components/common/ChatInbox'
import Footer from '../../components/common/Footer'
import { useNavigate } from 'react-router-dom'

export default function StudentDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-brand-cream antialiased text-slate-800">
      {/* Full-bleed gradient banner header, matching Owner Panel */}
      <div className="bg-gradient-to-b from-[#e8792e] to-[#f4a565] px-4 sm:px-6 py-5 sm:py-6">
       <div className="max-w-7xl w-full mx-auto flex flex-row justify-between items-center gap-2">
  <div className="min-w-0">
      <h1 className="text-base sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2 truncate">
     <img src="/logo.png" alt="Room Finder" className="h-7 w-7 sm:h-9 sm:w-9 object-contain flex-shrink-0" />
     <span className="truncate">Welcome, <span className="text-white/80 font-medium">{profile?.full_name}</span></span> 
   </h1>
    <p className="text-white/70 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 hidden sm:block">Find your perfect room</p>
   </div>  
  <div className="flex flex-nowrap gap-1.5 sm:gap-2 items-center flex-shrink-0">
   <button
     onClick={() => navigate('/student/bookings')}
     className="w-8 h-8 sm:w-auto sm:px-4 sm:py-2 rounded-xl bg-white text-[#b5451a] text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all shadow-[3px_4px_8px_rgba(180,120,60,0.25),-2px_-2px_5px_rgba(255,255,255,0.7)] hover:shadow-[2px_3px_5px_rgba(180,120,60,0.25),-1px_-1px_3px_rgba(255,255,255,0.7)] active:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.3)] active:scale-98 whitespace-nowrap flex items-center justify-center flex-shrink-0"
     aria-label="My Bookings"
   >
     <span className="sm:hidden">📋</span>
     <span className="hidden sm:inline">My Bookings</span>
   </button>
   <div className="flex items-center gap-1.5 sm:gap-2 bg-white/15 border border-white/25 p-1 sm:p-1.5 rounded-xl">
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

      <div className="mt-12 max-w-7xl w-full mx-auto">
        <Footer />
      </div>
    </div>
  )
}
