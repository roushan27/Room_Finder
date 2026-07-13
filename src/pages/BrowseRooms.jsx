import { useNavigate } from 'react-router-dom'
import RoomList from '../components/student/RoomList'
import Footer from '../components/common/Footer'

export default function BrowseRooms() {
  const navigate = useNavigate()

  return (
    // Centralized Update: Background canvas set to brand-cream instead of deep dark mode gradients
    <div className="min-h-screen bg-[#fdeee0] antialiased">
      {/* Full-bleed gradient banner header, matching Owner/Student Panel */}
      <div className="bg-gradient-to-r from-[#b5451a] to-[#e8792e] px-4 sm:px-6 py-5 sm:py-6">
       <div className="max-w-7xl w-full mx-auto flex flex-row justify-between items-center gap-2 sm:gap-4">
  <h1 className="text-base sm:text-2xl font-black text-white tracking-tight whitespace-nowrap">
    Room Finder <span className="inline-block">🏠</span>
  </h1>

  <div className="flex gap-1.5 sm:gap-2.5 flex-shrink-0">
    <button
      onClick={() => navigate('/login')}
      className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-brand-sage hover:opacity-90 text-white text-[11px] sm:text-xs font-bold transition shadow-md shadow-emerald-700/10 active:scale-98 whitespace-nowrap"
    >
      Log In
    </button>
    <button
      onClick={() => navigate('/signup?role=student')}
      className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] sm:text-xs font-bold transition shadow-xs active:scale-98 whitespace-nowrap"
    >
      Sign Up
    </button>
  </div>
</div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <RoomList guestMode={true} />
      </div>

      <div className="mt-12 pt-4 border-t border-orange-200/60 max-w-7xl w-full mx-auto">
        <Footer />
      </div>
    </div>
  )
}