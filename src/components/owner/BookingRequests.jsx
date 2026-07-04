import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function BookingRequests({ refreshTrigger, onUpdated }) {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [refreshTrigger])

  const fetchBookings = async () => {
    setLoading(true)

    // Get owner's room ids first
    const { data: rooms } = await supabase.from('rooms').select('id').eq('owner_id', user.id)
    const roomIds = rooms?.map((r) => r.id) || []

    if (roomIds.length === 0) {
      setBookings([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('*, rooms(title), profiles(full_name, phone)')
      .in('room_id', roomIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (!error) setBookings(data)
    setLoading(false)
  }

  const handleAction = async (bookingId, newStatus) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)

    if (!error) {
      setBookings((prev) => prev.filter((b) => b.id !== bookingId))
      if (onUpdated) onUpdated()
    }
  }

  if (loading) return <p className="text-white/60">Loading booking requests...</p>

  if (bookings.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-white/60 text-center">
        Koi pending booking request nahi hai abhi.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <p className="text-white font-medium">{booking.rooms?.title}</p>
            <p className="text-white/60 text-sm">
              {booking.profiles?.full_name} {booking.profiles?.phone ? `· ${booking.profiles.phone}` : ''}
            </p>
            <p className="text-white/40 text-xs mt-1">
              Requested on {new Date(booking.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(booking.id, 'confirmed')}
              className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 text-sm font-medium hover:bg-green-500/30 transition"
            >
              Accept
            </button>
            <button
              onClick={() => handleAction(booking.id, 'cancelled')}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm font-medium hover:bg-red-500/30 transition"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
