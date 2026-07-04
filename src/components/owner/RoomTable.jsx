import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function RoomTable({ refreshTrigger, onEdit }) {
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRooms()
  }, [refreshTrigger])

  const fetchRooms = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setRooms(data)
    setLoading(false)
  }

  const handleDelete = async (roomId, roomTitle) => {
    const confirmed = window.confirm(`"${roomTitle}" ko delete karna chahte ho? Ye action undo nahi ho sakta.`)
    if (!confirmed) return

    const { error } = await supabase.from('rooms').delete().eq('id', roomId)
    if (error) {
      alert('Delete failed: ' + error.message)
    } else {
      setRooms((prev) => prev.filter((r) => r.id !== roomId))
    }
  }

  const toggleActive = async (roomId, currentStatus) => {
    const { error } = await supabase
      .from('rooms')
      .update({ is_active: !currentStatus })
      .eq('id', roomId)

    if (!error) {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, is_active: !currentStatus } : r))
      )
    }
  }

  if (loading) {
    return <p className="text-white/60">Loading your rooms...</p>
  }

  if (error) {
    return <p className="text-red-400">{error}</p>
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-white/60 text-center">
        Abhi tak koi room add nahi kiya. "+ Add Room" button se shuru karo.
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 text-white/60 text-sm">
              <th className="p-4">Photo</th>
              <th className="p-4">Title</th>
              <th className="p-4">City</th>
              <th className="p-4">Price</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-b border-white/5 text-white">
                <td className="p-4">
                  {room.photos?.[0] ? (
                    <img
                      src={room.photos[0]}
                      alt={room.title}
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-white/10 rounded-lg flex items-center justify-center text-white/30 text-xs">
                      No photo
                    </div>
                  )}
                </td>
                <td className="p-4 font-medium">{room.title}</td>
                <td className="p-4 text-white/70">{room.city}</td>
                <td className="p-4 text-blue-300">₹{room.price}/mo</td>
                <td className="p-4">
                  {room.total_ratings > 0 ? (
                    <span>⭐ {room.avg_rating?.toFixed(1)} ({room.total_ratings})</span>
                  ) : (
                    <span className="text-white/30">No ratings</span>
                  )}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleActive(room.id, room.is_active)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      room.is_active
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {room.is_active ? 'Active' : 'Hidden'}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(room)}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-sm hover:bg-blue-500/30"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(room.id, room.title)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}