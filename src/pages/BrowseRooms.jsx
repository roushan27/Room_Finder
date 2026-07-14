import { useNavigate } from 'react-router-dom'
import RoomList from '../components/student/RoomList'
import Footer from '../components/common/Footer'

export default function BrowseRooms() {
  const navigate = useNavigate()

  return (
    // Centralized Update: Background canvas set to brand-cream instead of deep dark mode gradients
    <div className="min-h-screen bg-[#fdf2e4] antialiased">
      {/* Full-bleed gradient banner header — top se bottom tak halka light hota gradient */}
      <div className="bg-gradient-to-b from-[#e8792e] to-[#f4a565] px-4 sm:px-6 py-5 sm:py-6">
        <div className="max-w-7xl w-full mx-auto flex flex-row justify-between items-center gap-2 sm:gap-4">
          <h1 className="text-base sm:text-2xl font-semibold text-white tracking-tight whitespace-nowrap">
           <span className="inline-flex items-center gap-2">
   <img src="/logo.png" alt="Room Finder" className="h-6 w-6 sm:h-8 sm:w-8 object-contain" />
   RoomFinder
 </span>
          </h1>

          <div className="flex gap-1.5 sm:gap-2.5 flex-shrink-0">
            <button
              onClick={() => navigate('/login')}
              className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-brand-sage text-white text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap shadow-[4px_4px_10px_rgba(0,0,0,0.15),-2px_-2px_8px_rgba(255,255,255,0.15)] hover:shadow-[2px_2px_6px_rgba(0,0,0,0.15),-1px_-1px_4px_rgba(255,255,255,0.15)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.1)] active:scale-98"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/signup?role=student')}
              className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-[#fdf2e4] text-slate-700 text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap shadow-[2px_3px_5px_rgba(90,40,10,0.35),-1px_-1px_2px_rgba(255,255,255,0.4)] hover:shadow-[1px_2px_3px_rgba(90,40,10,0.35),-0.5px_-0.5px_1px_rgba(255,255,255,0.4)] active:shadow-[inset_2px_2px_4px_rgba(90,40,10,0.35)] active:scale-98"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <RoomList guestMode={true} />
      </div>

      <div className="mt-12 max-w-7xl w-full mx-auto">
        <Footer />
      </div>
    </div>
  )
}