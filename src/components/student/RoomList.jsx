import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import RoomCard from './RoomCard'
import RoomDetailModal from './RoomDetailModal'
import LocationSearchBar from '../common/LocationSearchBar'

const ROOM_TYPES = ['All', '1BHK', '2BHK', 'Independent']

export default function RoomList({ guestMode = false }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [search, setSearch] = useState('')
  const [roomType, setRoomType] = useState('All')
  const [maxPrice, setMaxPrice] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setRooms(data)
    setLoading(false)
  }

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase())
    const matchesType = roomType === 'All' || r.room_type === roomType
    const matchesPrice = maxPrice === null || r.price <= maxPrice
    return matchesSearch && matchesType && matchesPrice
  })

  const activeFilterCount = (roomType !== 'All' ? 1 : 0) + (maxPrice !== null ? 1 : 0)

  if (loading) return <p className="text-white/60">Loading rooms...</p>
  if (error) return <p className="text-red-400">{error}</p>

  return (
    <div>
      <LocationSearchBar />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none text-lg z-10">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by city or room name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400/60 focus:bg-white/[0.13] transition shadow-lg"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`relative flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border backdrop-blur-xl transition shadow-lg font-medium ${
            showFilters
              ? 'bg-blue-500 border-blue-400 text-white shadow-blue-500/40'
              : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
          }`}
        >
          <span className="text-lg">⚙️</span>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-pink-500 text-white text-[10px] font-bold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-5 mb-6 shadow-lg space-y-5">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-3">
              Room Type
            </p>
            <div className="flex flex-wrap gap-2">
              {ROOM_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setRoomType(type)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                    roomType === type
                      ? 'bg-blue-500 border-blue-400 text-white shadow-md shadow-blue-500/30'
                      : 'bg-white/5 border-white/15 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between items-center mb-3">
              <p className="text-white/50 text-xs uppercase tracking-wider font-semibold">
                Max Rent
              </p>
              <span className="text-blue-300 font-semibold text-sm bg-blue-500/10 px-3 py-1 rounded-lg">
                {maxPrice === null ? 'No limit' : `₹${maxPrice.toLocaleString()}/mo`}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="30000"
              step="500"
              value={maxPrice ?? 1000}
              onChange={(e) => {
                const val = Number(e.target.value)
                setMaxPrice(val === 1000 ? null : val)
              }}
              className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-white/30 text-xs mt-1">
              <span>₹1,000</span>
              <span>₹30,000</span>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setRoomType('All')
                setMaxPrice(null)
              }}
              className="text-blue-300 text-sm hover:text-blue-200 transition"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {filteredRooms.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-white/60 text-center">
          Koi room nahi mila is filter ke saath.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} onClick={setSelectedRoom} />
          ))}
        </div>
      )}

      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          guestMode={guestMode}
        />
      )}
    </div>
  )
}
