import { useNavigate } from 'react-router-dom'
import RoomList from '../components/student/RoomList'
import Footer from '../components/common/Footer'

export default function BrowseRooms() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Room Finder 🏠</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition"
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/signup?role=student')}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition"
          >
            Sign Up
          </button>
        </div>
      </div>

      <RoomList guestMode={true} />
      <Footer />
    </div>
  )
}
