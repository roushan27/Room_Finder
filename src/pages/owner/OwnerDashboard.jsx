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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
      <h1
  className="text-xl sm:text-2xl font-bold text-white px-5 py-3 rounded-2xl inline-block"
  style={{
    background: 'linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 4px 12px rgba(147,51,234,0.15)',
  }}
>
  Owner Panel — {profile?.full_name} 🏠
</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-sm sm:text-base font-medium transition shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
          >
            + Add Room
          </button>
          <ChatInbox />
          <NotificationBell />
          <LogoutButton />
        </div>
      </div>

      <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Booking Requests</h2>
      <div className="mb-6 sm:mb-8">
        <BookingRequests
          refreshTrigger={bookingsRefreshTrigger}
          onUpdated={() => {
            refreshBookings()
            refreshRooms() // room availability might have changed after accept/reject
          }}
        />
      </div>

      <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">My Rooms</h2>
      <RoomTable refreshTrigger={roomsRefreshTrigger} onEdit={setEditingRoom} />

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

      <Footer />
    </div>
  )
}
