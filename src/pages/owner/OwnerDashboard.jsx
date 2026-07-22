import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import AddRoomModal from '../../components/owner/AddRoomModal'
import RoomTable from '../../components/owner/RoomTable'
import EditRoomModal from '../../components/owner/EditRoomModal'
import BookingRequests from '../../components/owner/BookingRequests'
import LogoutButton from '../../components/common/LogoutButton'
import NotificationBell from '../../components/common/NotificationBell'
import ChatInbox from '../../components/common/ChatInbox'
import Footer from '../../components/common/Footer'
import BottomNav from '../../components/common/BottomNav'

export default function OwnerDashboard() {
  const { profile, user } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [roomsRefreshTrigger, setRoomsRefreshTrigger] = useState(0)
  const [bookingsRefreshTrigger, setBookingsRefreshTrigger] = useState(0)
  const [stats, setStats] = useState({ totalRooms: 0, activeRooms: 0, pendingBookings: 0, avgRating: 0 })

  const refreshRooms = () => setRoomsRefreshTrigger((prev) => prev + 1)
  const refreshBookings = () => setBookingsRefreshTrigger((prev) => prev + 1)

  useEffect(() => {
    const handler = () => setShowAddModal(true)
    window.addEventListener('open-add-room', handler)
    return () => window.removeEventListener('open-add-room', handler)
  }, [])

  useEffect(() => {
    if (user?.id) fetchStats()
  }, [user?.id, roomsRefreshTrigger, bookingsRefreshTrigger])

  const fetchStats = async () => {
    const { data: rooms } = await supabase
      .from('rooms')
      .select('is_active, avg_rating, total_ratings')
      .eq('owner_id', user.id)

    const { count: pendingCount } = await supabase
      .from('bookings')
      .select('id, rooms!inner(owner_id)', { count: 'exact', head: true })
      .eq('rooms.owner_id', user.id)
      .eq('status', 'pending')

    const roomsData = rooms || []
    const ratedRooms = roomsData.filter((r) => r.total_ratings > 0)
    const avgRating = ratedRooms.length > 0
      ? ratedRooms.reduce((sum, r) => sum + Number(r.avg_rating || 0), 0) / ratedRooms.length
      : 0

    setStats({
      totalRooms: roomsData.length,
      activeRooms: roomsData.filter((r) => r.is_active).length,
      pendingBookings: pendingCount || 0,
      avgRating,
    })
  }

  return (
    <div className="min-h-screen bg-brand-cream p-4 sm:p-6 text-slate-800 antialiased pb-20 sm:pb-6">
      {/* Full-bleed gradient banner header */}
      <div className="bg-gradient-to-b from-[#e8792e] to-[#f4a565] px-4 sm:px-6 py-5 sm:py-6 rounded-b-3xl sm:rounded-none shadow-lg sm:shadow-none">
        <div className="max-w-7xl w-full mx-auto flex flex-row justify-between items-center gap-2">
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2 truncate">
              <img src="/logo.png" alt="Room Finder" className="h-7 w-7 sm:h-9 sm:w-9 object-contain flex-shrink-0" />
              <span className="flex flex-col leading-tight truncate">
                <span className="text-[10px] sm:text-xs font-medium text-white/70 uppercase tracking-wider">Welcome back</span>
                <span className="truncate">{profile?.full_name}</span>
              </span>
            </h1>
            <p className="text-white/70 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 hidden sm:block">Manage listed inventories & localized asset leases</p>
          </div>

          <div className="flex flex-nowrap gap-1.5 sm:gap-2 items-center flex-shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="hidden sm:flex px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-white text-[#c1521c] text-[10px] sm:text-sm font-black uppercase tracking-wider hover:bg-white/90 transition-all active:scale-95 shadow-md items-center gap-1 whitespace-nowrap"
            >
              <span>+</span> <span className="hidden xs:inline">Add Room</span>
            </button>
            <div className="flex items-center gap-2 bg-white/15 border border-white/25 p-1.5 rounded-xl">
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
      </div>

      <div className="max-w-7xl w-full mx-auto space-y-6 p-4 sm:p-6">

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-orange-200/60 shadow-sm">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Rooms</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalRooms}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-orange-200/60 shadow-sm">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Active Listings</p>
            <p className="text-2xl font-black text-brand-sage mt-1">{stats.activeRooms}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-orange-200/60 shadow-sm">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pending Requests</p>
            <p className="text-2xl font-black text-brand-coral mt-1">{stats.pendingBookings}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-orange-200/60 shadow-sm">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Avg Rating</p>
            <p className="text-2xl font-black text-amber-500 mt-1 flex items-center gap-1">
              {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
              {stats.avgRating > 0 && <span className="text-base">★</span>}
            </p>
          </div>
        </div>

        {/* Section: Booking Requests */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#e8862e] rounded-full" />
            <h2 className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-wider">Booking Requests</h2>
          </div>
          <BookingRequests
            refreshTrigger={bookingsRefreshTrigger}
            onUpdated={() => {
              refreshBookings()
              refreshRooms()
            }}
          />
        </div>

        {/* Section: Listed Assets */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#e8862e] rounded-full" />
            <h2 className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-wider">My Managed Assets</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-orange-200/60">
            <RoomTable refreshTrigger={roomsRefreshTrigger} onEdit={setEditingRoom} />
          </div>
        </div>

      </div>

      {/* Control View Action Overlays */}
      {showAddModal && (
        <AddRoomModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            refreshRooms()
          }}
        />
      )}

      {editingRoom && (
        <EditRoomModal
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
          onUpdated={refreshRooms}
        />
      )}

      <div className="mt-12 max-w-7xl w-full mx-auto">
        <Footer />
      </div>
      <BottomNav />
    </div>
  )
}