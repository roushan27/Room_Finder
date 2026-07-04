import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import AddRoomForm from '../../components/owner/AddRoomForm'
import RoomTable from '../../components/owner/RoomTable'
import EditRoomModal from '../../components/owner/EditRoomModal'
import BookingRequests from '../../components/owner/BookingRequests'
import LogoutButton from '../../components/common/LogoutButton'
import NotificationBell from '../../components/common/NotificationBell'
import ChatInbox from '../../components/common/ChatInbox'
import Footer from '../../components/common/Footer'

export default function OwnerDashboard() {
  const { profile } = useAuth()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRefresh = () => setRefreshTrigger((prev) => prev + 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">
          Owner Panel — {profile?.full_name} 🏠
        </h1>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition"
          >
            {showAddForm ? 'Close' : '+ Add Room'}
          </button>
          <ChatInbox />
          <NotificationBell />
          <LogoutButton />
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Booking Requests</h2>
      <div className="mb-8">
        <BookingRequests refreshTrigger={refreshTrigger} onUpdated={handleRefresh} />
      </div>

      {showAddForm && (
        <div className="mb-8 max-w-2xl">
          <AddRoomForm
            onSuccess={() => {
              setShowAddForm(false)
              handleRefresh()
            }}
          />
        </div>
      )}

      <h2 className="text-lg font-semibold text-white mb-4">My Rooms</h2>
      <RoomTable refreshTrigger={refreshTrigger} onEdit={setEditingRoom} />

      {editingRoom && (
        <EditRoomModal
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
          onUpdated={handleRefresh}
        />
      )}

      <Footer />
    </div>
  )
}
