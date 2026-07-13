import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import AddRoomModal from '../../components/owner/AddRoomModal'
import RoomTable from '../../components/owner/RoomTable'
import EditRoomModal from '../../components/owner/EditRoomModal'
import BookingRequests from '../../components/owner/BookingRequests'
import LogoutButton from '../../components/common/LogoutButton'
import NotificationBell from '../../components/common/NotificationBell'
import ChatInbox from '../../components/common/ChatInbox'
import Footer from '../../components/common/Footer'

export default function OwnerDashboard() {
  const { profile } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [roomsRefreshTrigger, setRoomsRefreshTrigger] = useState(0)
  const [bookingsRefreshTrigger, setBookingsRefreshTrigger] = useState(0)

  const refreshRooms = () => setRoomsRefreshTrigger((prev) => prev + 1)
  const refreshBookings = () => setBookingsRefreshTrigger((prev) => prev + 1)

     return (
    <div className="min-h-screen bg-[#fdeee0] antialiased text-slate-800">
      {/* Full-bleed gradient banner header */}
      <div className="bg-gradient-to-r from-[#b5451a] to-[#e8792e] px-4 sm:px-6 py-5 sm:py-6">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Owner Panel <span className="text-white/80 font-medium text-sm sm:text-base">@{profile?.full_name || 'Host'}</span>
            </h1>
            <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mt-1">Manage listed inventories & localized asset leases</p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white text-[#c1521c] text-xs sm:text-sm font-black uppercase tracking-wider hover:bg-white/90 transition-all active:scale-95 shadow-md flex items-center gap-1.5"
            >
              <span>+</span> Add Room
            </button>
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

        {/* Section Matrix Group 01: Active Operations */}
       {/* Section Matrix Group 01: Active Operations */}
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

       {/* Section Matrix Group 02: Listed Assets */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#e8862e] rounded-full" />
            <h2 className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-wider">My Managed Assets</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
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

      <div className="mt-12 pt-4 border-t border-slate-200/60 max-w-7xl w-full mx-auto">
        <Footer />
      </div>
    </div>
  )
}