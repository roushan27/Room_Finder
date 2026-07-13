import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function BookingRequests({ refreshTrigger, onUpdated }) {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [refreshTrigger])

  const fetchBookings = async () => {
    setLoading(true)

    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id')
      .eq('owner_id', user.id)

    if (roomsError) {
      setLoading(false)
      return
    }

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

    if (!error) {
      setBookings(data)
    }
    setLoading(false)
  }

  const handleAction = async (bookingId, newStatus) => {
    setActionError('')

    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)

    if (error) {
      setActionError(`Action failed: ${error.message}`)
    } else {
      setBookings((prev) => prev.filter((b) => b.id !== bookingId))
      if (onUpdated) onUpdated()
    }
  }

  if (loading) {
    return (
      <p className="text-slate-400 font-bold text-xs tracking-wider animate-pulse py-4">
        Loading pending requests...
      </p>
    )
  }

  return (
    <div className="space-y-3 antialiased">
      {actionError && (
        <p className="text-brand-coral text-xs font-bold bg-brand-coral/10 p-3 rounded-xl border border-brand-coral/20">
          {actionError}
        </p>
      )}

      {bookings.length === 0 ? (
        // Converted from dark translucent to solid clean slate empty container
       <div className="bg-[#fbe4c8] border border-orange-200 rounded-xl p-8 text-center">
  <svg className="w-10 h-10 mx-auto mb-2 text-[#e8862e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="2" />
    <path strokeLinecap="round" strokeWidth="2" d="M3 10h18M8 3v4M16 3v4" />
  </svg>
  <p className="text-slate-500 text-xs font-semibold">No pending booking requests at the moment.</p>
</div>
      ) : (
        bookings.map((booking) => (
          // Main dynamic card wrapper tracking minimal structural elevations
        <div
  key={booking.id}
  className="bg-[#fbe4c8] border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-orange-300 transition"
>
            <div className="min-w-0">
              <p className="text-slate-800 font-black text-sm tracking-tight truncate">
                {booking.rooms?.title}
              </p>
              <p className="text-slate-500 font-medium text-xs mt-0.5 truncate">
                {booking.profiles?.full_name} {booking.profiles?.phone ? ` · ${booking.profiles.phone}` : ''}
              </p>
              <p className="text-slate-400 font-bold text-[10px] mt-1.5 uppercase tracking-wider">
                Requested on {new Date(booking.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            
            {/* Action Buttons refitted into the brand color tokens */}
            <div className="flex gap-2 sm:flex-shrink-0">
              <button
                onClick={() => handleAction(booking.id, 'confirmed')}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-brand-sage text-white text-xs font-bold hover:opacity-90 transition shadow-xs active:scale-95"
              >
                Accept
              </button>
              <button
                onClick={() => handleAction(booking.id, 'cancelled')}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white border border-brand-coral/30 text-brand-coral text-xs font-bold hover:bg-brand-coral/5 transition active:scale-95"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}