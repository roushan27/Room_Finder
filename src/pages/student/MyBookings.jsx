import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import LogoutButton from '../../components/common/LogoutButton'
import NotificationBell from '../../components/common/NotificationBell'
import ChatInbox from '../../components/common/ChatInbox'
import Footer from '../../components/common/Footer'
import { useToast } from '../../context/ToastContext'

const STATUS_STYLES = {
  pending: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Pending Confirmation' },
  confirmed: { bg: 'bg-brand-sage/10', border: 'border-brand-sage/30', text: 'text-brand-sage', label: 'Confirmed' },
  cancelled: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', label: 'Cancelled' },
}

export default function MyBookings() {
  const { user } = useAuth()
  const navigate = useNavigate()
   const { toast } = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  useEffect(() => {
    if (user?.id) fetchBookings()
  }, [user?.id])

  const fetchBookings = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
  .from('bookings')
  .select(`
    id, status, payment_status, check_in, created_at,
    rooms ( id, title, photos, price, city, address, room_type, phone_number, owner_id )
  `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setBookings(data || [])
    setLoading(false)
  }
 
  const confirmCancel = (booking) => setCancelTarget(booking)
const dismissCancel = () => setCancelTarget(null)

const handleCancelBooking = async () => {
  if (!cancelTarget) return
  setCancelling(true)

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', cancelTarget.id)
    .eq('student_id', user.id) // safety: only cancel own bookings

  if (error) {
    toast.error('Could not cancel booking: ' + error.message)
  } else {
    toast.success('Booking cancelled')
    setBookings((prev) =>
      prev.map((b) => (b.id === cancelTarget.id ? { ...b, status: 'cancelled' } : b))
    )
     // Notify the room owner — non-blocking, don't fail the cancel flow if this errors
     const ownerId = cancelTarget.rooms?.owner_id
     if (ownerId) {
      const { data: studentProfile } = await supabase
         .from('profiles')
         .select('full_name')
         .eq('id', user.id)
         .single()

       const studentName = studentProfile?.full_name || 'A student'
       await supabase.from('notifications').insert({
         user_id: ownerId,
         message: `${studentName} cancelled their booking for "${cancelTarget.rooms?.title || 'your room'}"`,
         is_read: false,
       })
     }
  }
  setCancelling(false)
  setCancelTarget(null)
}
  const filteredBookings = bookings.filter((b) => filter === 'all' || b.status === filter)

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  }

  return (
    <div className="min-h-screen bg-brand-cream antialiased text-slate-800">
      {/* Header banner */}
      <div className="bg-gradient-to-b from-[#e8792e] to-[#f4a565] px-4 sm:px-6 py-5 sm:py-6">
        <div className="max-w-5xl w-full mx-auto flex flex-row justify-between items-center gap-2">
          <div className="min-w-0 flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition flex-shrink-0"
              aria-label="Go back"
            >
              ←
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-semibold text-white tracking-tight truncate">
                My Bookings
              </h1>
              <p className="text-white/70 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 hidden sm:block">
                Track your room booking requests
              </p>
            </div>
          </div>

          <div className="flex flex-nowrap gap-1.5 sm:gap-2 items-center flex-shrink-0">
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

      <div className="max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                filter === tab.key
                  ? 'bg-brand-sage text-white shadow-[2px_3px_5px_rgba(20,60,30,0.3),-1px_-1px_2px_rgba(255,255,255,0.2)]'
                  : 'bg-white text-slate-600 shadow-[2px_3px_5px_rgba(180,120,60,0.2),-1px_-1px_2px_rgba(255,255,255,0.7)]'
              }`}
            >
              {tab.label} <span className="opacity-70">({counts[tab.key]})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-orange-200/60 rounded-2xl p-4 animate-pulse flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-orange-100 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-orange-100 rounded-lg w-1/2" />
                  <div className="h-3 bg-orange-100/70 rounded-lg w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-brand-coral font-bold text-xs bg-brand-coral/5 border border-brand-coral/20 px-4 py-3 rounded-xl">
            ⚠ {error}
          </p>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-[#fbe4c8] border border-orange-200 rounded-2xl p-10 text-center">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
            </p>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="mt-4 px-5 py-2 rounded-xl bg-brand-sage text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition"
            >
              Browse Rooms
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => {
              const room = booking.rooms
              const style = STATUS_STYLES[booking.status] || STATUS_STYLES.pending
              return (
                <div
                  key={booking.id}
                  className="bg-white border border-orange-200/60 rounded-2xl p-4 flex gap-4 items-center"
                >
                  {/* Room thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-orange-50 flex-shrink-0">
                    {room?.photos?.[0] ? (
                      <img src={room.photos[0]} alt={room.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-[9px] font-bold uppercase">
                        No Photo
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-sm text-slate-800 truncate">
                        {room?.title || 'Room unavailable'}
                      </h3>
                      <span className={`flex-shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border ${style.bg} ${style.border} ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs font-semibold mt-1 truncate">
                      {room?.city || '-'} {room?.room_type ? `· ${room.room_type}` : ''}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-slate-900 font-black text-sm">
                        ₹{room?.price?.toLocaleString('en-IN') || '-'}<span className="text-slate-400 font-medium text-[10px]">/mo</span>
                      </span>
                      <span className="text-slate-400 text-[10px] font-bold">
                        Requested {new Date(booking.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {booking.status === 'confirmed' && room?.phone_number && (
                      
                      <a  href={`tel:${room.phone_number}`}
                        className="inline-flex items-center gap-1.5 mt-2 text-brand-sage text-[10px] font-black uppercase tracking-wider"
                      >
                        📞 Call Owner: {room.phone_number}
                      </a>
                    )}
                    {booking.status === 'pending' && (
   <button
     onClick={() => confirmCancel(booking)}
     className="inline-flex items-center gap-1.5 mt-2 text-brand-coral text-[10px] font-black uppercase tracking-wider hover:underline"
   >
     ✕ Cancel Booking
   </button>
 )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>


     {/* Cancel Confirmation Modal */}
     {cancelTarget && (
       <div
         className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
         onClick={dismissCancel}
       >
         <div
           onClick={(e) => e.stopPropagation()}
           className="bg-white border border-orange-200/70 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150"
         >
           <div className="w-14 h-14 rounded-full bg-brand-coral/10 flex items-center justify-center mx-auto mb-4">
             <svg className="w-6 h-6 text-brand-coral" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </div>

           <h3 className="text-slate-800 font-black text-base mb-1.5">Cancel this booking?</h3>
           <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
             Your request for "<span className="font-bold text-slate-700">{cancelTarget.rooms?.title}</span>" will be cancelled.
           </p>

           <div className="flex gap-3">
             <button
               onClick={dismissCancel}
               disabled={cancelling}
               className="flex-1 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition active:scale-95 disabled:opacity-50"
             >
               Keep Booking
             </button>
             <button
               onClick={handleCancelBooking}
               disabled={cancelling}
               className="flex-1 py-2.5 rounded-xl bg-brand-coral text-white text-xs font-black uppercase tracking-wider hover:opacity-90 transition active:scale-95 disabled:opacity-50 shadow-2xs"
             >
               {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
             </button>
           </div>
         </div>
       </div>
     )}

      <div className="mt-12 max-w-5xl w-full mx-auto">
        <Footer />
      </div>
    </div>
  )
}
   