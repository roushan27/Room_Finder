import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import RoomCard from './RoomCard'
import RoomDetailModal from './RoomDetailModal'
import { useModalBackButton } from '../../hooks/useModalBackButton'

const ROOM_TYPES = ['1BHK', '2BHK', 'Independent']

export default function RoomList({ guestMode = false }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Applied filters — what's actually used to filter the room list
  const [appliedRoomTypes, setAppliedRoomTypes] = useState([])
  const [appliedMinPrice, setAppliedMinPrice] = useState(0)
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(30000)

  // Draft filters — what the user is currently adjusting in the panel, before hitting "Apply"
  const [draftRoomTypes, setDraftRoomTypes] = useState([])
  const [draftMinPrice, setDraftMinPrice] = useState(0)
  const [draftMaxPrice, setDraftMaxPrice] = useState(30000)

  useModalBackButton(showFilters, () => setShowFilters(false))

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rooms')
      .select('id, owner_id, title, description, address, city, price, total_rooms, available_rooms, room_type, facilities, photos, videos, avg_rating, total_ratings, latitude, longitude, created_at, is_active, phone_number, category, occupancy, tenant_type')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) setError(error.message)
    else setRooms(data)
    setLoading(false)
  }

  const toggleDraftRoomType = (type) => {
    setDraftRoomTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const openFilters = () => {
    // Load current applied values into the draft when opening, so the panel reflects reality
    setDraftRoomTypes(appliedRoomTypes)
    setDraftMinPrice(appliedMinPrice)
    setDraftMaxPrice(appliedMaxPrice)
    setShowFilters(true)
  }

  const applyFilters = () => {
    setAppliedRoomTypes(draftRoomTypes)
    setAppliedMinPrice(draftMinPrice)
    setAppliedMaxPrice(draftMaxPrice)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setDraftRoomTypes([])
    setDraftMinPrice(0)
    setDraftMaxPrice(30000)
  }

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase())
    const matchesType = appliedRoomTypes.length === 0 || appliedRoomTypes.includes(r.room_type)
    const matchesPrice = r.price >= appliedMinPrice && r.price <= appliedMaxPrice
    return matchesSearch && matchesType && matchesPrice
  })

  const activeFilterCount =
    appliedRoomTypes.length + (appliedMinPrice > 0 || appliedMaxPrice < 30000 ? 1 : 0)

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-44 bg-white/10" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) return <p className="text-red-400">{error}</p>

  return (
    <div>
      <div className="mb-4 flex justify-between items-center gap-2">
  <button
    onClick={openFilters}
    className="relative flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/15 transition shadow-lg"
    aria-label="Open filters"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 4v3m0 0a2 2 0 100 4 2 2 0 000-4zM6 11v9M12 4v9m0 0a2 2 0 100 4 2 2 0 000-4zm0 4v3M18 4v3m0 0a2 2 0 100 4 2 2 0 000-4zm0 4v9" />
    </svg>
    {activeFilterCount > 0 && (
      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-pink-500 text-white text-[10px] font-bold rounded-full">
        {activeFilterCount}
      </span>
    )}
  </button>

  <div className="flex justify-between items-center gap-2">
    <div className="relative w-40 sm:w-56">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none text-sm z-10">🔍</span>
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400/60 transition"
      />
    </div>
  </div>
</div>

      {/* Filter panel modeled after the reference design — light card, pill categories, dual price range */}
   {showFilters && (
  <div
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={() => setShowFilters(false)}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-sm p-6 max-h-[85vh] overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-white font-bold text-lg">Filters</h3>
        <button
          onClick={() => setShowFilters(false)}
          className="text-white/50 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>

      <div className="mb-6">
        <p className="text-white/70 text-xs uppercase tracking-wider font-semibold mb-3">Room Type</p>
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => toggleDraftRoomType(type)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                draftRoomTypes.includes(type)
                  ? 'bg-blue-500 border-blue-400 text-white shadow-md shadow-blue-500/30'
                  : 'bg-white/5 border-white/15 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 pt-4 border-t border-white/10">
        <p className="text-white/70 text-xs uppercase tracking-wider font-semibold mb-1">Price per month</p>
        <p className="text-blue-300 font-semibold text-sm mb-3 bg-blue-500/10 inline-block px-3 py-1 rounded-lg">
          ₹{draftMinPrice.toLocaleString()} — ₹{draftMaxPrice.toLocaleString()}
        </p>

        <div className="relative h-6 flex items-center mt-2">
          <div className="absolute w-full h-1.5 bg-white/10 rounded-full" />
          <div
            className="absolute h-1.5 bg-blue-500 rounded-full"
            style={{
              left: `${(draftMinPrice / 30000) * 100}%`,
              right: `${100 - (draftMaxPrice / 30000) * 100}%`,
            }}
          />
          <input
            type="range"
            min="0"
            max="30000"
            step="500"
            value={draftMinPrice}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), draftMaxPrice - 500)
              setDraftMinPrice(val)
            }}
            className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <input
            type="range"
            min="0"
            max="30000"
            step="500"
            value={draftMaxPrice}
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), draftMinPrice + 500)
              setDraftMaxPrice(val)
            }}
            className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        <div className="flex justify-between text-white/30 text-xs mt-2">
          <span>₹0</span>
          <span>₹30,000+</span>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          onClick={clearFilters}
          className="px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white/60 text-sm font-medium hover:bg-white/10 transition"
        >
          Clear
        </button>
        <button
          onClick={applyFilters}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold transition shadow-lg shadow-blue-500/30"
        >
          Apply filters
        </button>
      </div>
    </div>
  </div>
)}

      {filteredRooms.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-white/60 text-center">
          No rooms found.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} onClick={setSelectedRoom} />
          ))}
        </div>
      )}

      {selectedRoom && <RoomDetailModal room={selectedRoom} onClose={() => setSelectedRoom(null)} guestMode={guestMode} />}
    </div>
  )
}
