export default function RoomCard({ room, onClick }) {
  const locality = room.address ? room.address.split(',')[0].trim() : ''

  return (
    <div
      onClick={() => onClick(room)}
      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-400/50 hover:bg-white/15 transition group"
    >
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

      <div className="p-4">
        <h3 className="text-white font-semibold text-lg truncate">{room.title}</h3>

        {locality && (
          <div className="flex items-center gap-1.5 mt-2">
            <svg className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-white/40 text-xs tracking-wide truncate">{locality} area</span>
          </div>
        )}

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
