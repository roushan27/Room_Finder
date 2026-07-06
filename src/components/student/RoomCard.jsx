import { useLocation } from '../../context/LocationContext'
import { calculateDistance, formatDistance } from '../../utils/distance'

export default function RoomCard({ room, onClick }) {
  const { referenceLocation } = useLocation()
  const locality = room.address ? room.address.split(',')[0].trim() : ''

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

  const distance =
    referenceLocation && room.latitude && room.longitude
      ? calculateDistance(referenceLocation.lat, referenceLocation.lng, room.latitude, room.longitude)
      : null

  return (
    <div
      onClick={() => onClick(room)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05) inset',
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: '0 0 0 1px rgba(59,130,246,0.5), 0 8px 40px rgba(59,130,246,0.35)',
        }}
      />

      <div className="h-44 bg-white/5 relative overflow-hidden">
        {room.photos?.[0] ? (
          <img
            src={room.photos[0]}
            alt={room.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
            No photo available
          </div>
        )}

        {room.avg_rating > 0 && (
          <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-yellow-400 text-xs font-semibold px-2 py-1 rounded-lg">
            ⭐ {room.avg_rating.toFixed(1)}
          </span>
        )}

        <span className="absolute bottom-3 left-3 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
          {room.city}
        </span>

        {room.room_type && (
          <span className="absolute top-3 left-3 bg-purple-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
            {room.room_type}
          </span>
        )}
      </div>

      <div className="p-4 relative">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-white font-semibold text-lg truncate">{room.title}</h3>
          <span className="text-white/30 text-[10px] whitespace-nowrap mt-1">{getTimeAgo()}</span>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <svg className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-white/40 text-xs tracking-wide truncate">
            {distance !== null ? formatDistance(distance) : locality ? `${locality} area` : room.city}
          </span>
        </div>

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
          <div className="flex flex-col">
            <span className="text-blue-300 font-medium text-sm">
              {room.available_rooms > 0 ? `${room.available_rooms} rooms left` : 'Full'}
            </span>
            <span className="text-green-300 text-xs font-medium mt-0.5">
              ₹{room.price}/month
            </span>
          </div>
          <span className="text-white/40 text-xs group-hover:text-blue-300 transition flex items-center gap-1">
            View details
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}
