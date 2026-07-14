import { useLocation } from '../../context/LocationContext'
import { calculateDistance, formatDistance } from '../../utils/distance'

export default function RoomCard({ room, onClick }) {
  const { referenceLocation } = useLocation()
  const locality = room.address ? room.address.split(',')[0].trim() : ''

  const distance =
    referenceLocation && room.latitude && room.longitude
      ? calculateDistance(referenceLocation.lat, referenceLocation.lng, room.latitude, room.longitude)
      : null

  const getTimeAgo = () => {
    const diffMs = Date.now() - new Date(room.created_at).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`

    return new Date(room.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
   <div
  onClick={() => onClick(room)}
  className="group relative bg-[#faead2] border border-orange-200/70 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-orange-100 hover:border-orange-300 antialiased text-slate-800"
>
     {/* Asset Media Frame */}
<div className="h-44 bg-orange-50 relative overflow-hidden">
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

        {room.avg_rating > 0 && (
          <span className="absolute top-3 right-3 bg-white border border-slate-100 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-2xs flex items-center gap-1">
            ★ {room.avg_rating.toFixed(1)}
          </span>
        )}

        {room.room_type && (
          <span className="absolute top-3 left-3 bg-brand-gold text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-2xs">
            {room.room_type}
          </span>
        )}
      </div>

      {/* Primary Details Matrix */}
      <div className="p-4 relative">
        <div className="flex justify-between items-start gap-3">
          <h3 className="text-slate-800 font-black text-base truncate tracking-tight flex-1">
            {room.title}
          </h3>
          <span className="text-brand-coral text-[9px] font-black uppercase tracking-wider whitespace-nowrap mt-0.5 bg-brand-coral/5 border border-brand-coral/10 px-2 py-0.5 rounded-md">
            {getTimeAgo()}
          </span>
        </div>

        {/* Spatial Geolocation Metric Layout */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <svg className="w-3.5 h-3.5 text-brand-sage flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-slate-400 text-xs font-semibold tracking-wide truncate">
            {distance !== null ? formatDistance(distance) : locality ? `${locality} area` : room.city}
          </span>
        </div>

        {/* Transaction & Inventory Split */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-wider ${room.available_rooms > 0 ? 'text-brand-sage' : 'text-slate-400'}`}>
              {room.available_rooms > 0 ? `${room.available_rooms} units left` : 'Fully Occupied'}
            </span>
            <span className="text-slate-900 font-black text-base mt-0.5 tracking-tight">
              ₹{room.price.toLocaleString('en-IN')}<span className="text-slate-400 font-medium text-[11px]">/mo</span>
            </span>
          </div>
          
          <span className="text-slate-400 text-xs group-hover:text-brand-coral font-bold transition-all flex items-center gap-1 uppercase tracking-wider text-[10px]">
            View
            <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}