import { useLocation } from '../../context/LocationContext'
import { calculateDistance, formatDistance } from '../../utils/distance'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { useState } from 'react'
import { useToast } from '../../context/ToastContext'

export default function RoomCard({ room, onClick, guestMode = false, isFavorited = false, onFavoriteChange }) {
  const { referenceLocation } = useLocation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [favorited, setFavorited] = useState(isFavorited)
  const [toggling, setToggling] = useState(false)

  const locality = room.address ? room.address.split(',')[0].trim() : ''

  const distance =
    referenceLocation && room.latitude && room.longitude
      ? calculateDistance(referenceLocation.lat, referenceLocation.lng, room.latitude, room.longitude)
      : null

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation()
    if (guestMode || !user || toggling) return

    setToggling(true)
    const newState = !favorited
    setFavorited(newState)

    try {
      if (newState) {
        await supabase.from('favorites').insert({ student_id: user.id, room_id: room.id })
      } else {
        await supabase.from('favorites').delete().eq('student_id', user.id).eq('room_id', room.id)
      }
      if (onFavoriteChange) onFavoriteChange(room.id, newState)
    } catch {
      setFavorited(!newState)
      toast.error('Could not update favorites. Try again.')
    }
    setToggling(false)
  }

  return (
    <div
      onClick={() => onClick(room)}
       className="group cursor-pointer antialiased text-slate-800 bg-white rounded-2xl p-2 hover:shadow-md transition-shadow duration-300"
    >
      {/* Image Frame — rounded, no border, Airbnb-style */}
      <div className="relative h-36 sm:h-44 rounded-xl overflow-hidden bg-orange-50">
        {room.photos?.[0] ? (
          <img
            src={room.photos[0]}
            alt={room.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-[11px] uppercase tracking-wider bg-orange-50">
            No Media Content
          </div>
        )}

      {/* Top-left badge */}
{room.room_type && (
  <span className="absolute top-3 left-3 bg-brand-gold text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-2xs">
    {room.room_type}
  </span>
)}
 

        {/* Favorite heart — top-right, Airbnb-style */}
        {!guestMode && (
          <button
            onClick={handleFavoriteToggle}
            disabled={toggling}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center transition-transform active:scale-90"
            aria-label="Toggle favorite"
          >
            <svg
              className={`w-5 h-5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-colors ${
                favorited ? 'fill-brand-coral text-brand-coral' : 'fill-black/30 text-white'
              }`}
              stroke="white"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}

        {/* Bottom-right pagination dots placeholder if multiple photos exist */}
        {room.photos?.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
            {room.photos.slice(0, 5).map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Text block — minimal, no card background */}
      <div className="pt-2.5 px-0.5">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-slate-800 font-semibold text-sm truncate flex-1">
            {room.title}
          </h3>
          {room.avg_rating > 0 && (
            <span className="flex items-center gap-1 text-amber-600 text-sm font-semibold flex-shrink-0">
              <svg className="w-3.5 h-3.5 fill-amber-500" viewBox="0 0 24 24">
              
                <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z" />
              </svg>
              {Number(room.avg_rating.toFixed(1)).toString()}
            </span>
          )}
        </div>

        <p className="text-slate-400 text-sm truncate mt-0.5">
  {distance !== null
    ? `${formatDistance(distance)} from Sarala Birla University`
    : 'Sarala Birla University'}
</p>

        <p className="text-slate-800 text-sm mt-1">
          <span className="font-semibold">₹{room.price.toLocaleString('en-IN')}</span>
          <span className="text-slate-500"> for 1 month</span>
        </p>

        {room.available_rooms === 0 && (
          <p className="text-slate-400 text-xs font-semibold mt-0.5">Fully Occupied</p>
        )}
      </div>
    </div>
  )
}