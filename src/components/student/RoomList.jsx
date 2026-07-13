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

  const [appliedRoomTypes, setAppliedRoomTypes] = useState([])
  const [appliedMinPrice, setAppliedMinPrice] = useState(0)
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(30000)

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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 antialiased">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden animate-pulse bg-white border border-orange-200/60 shadow-2xs">
            <div className="h-44 bg-slate-100" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-slate-100 rounded-lg w-5/6" />
              <div className="h-3 bg-slate-50 rounded-lg w-1/2" />
              <div className="pt-2 flex justify-between">
                <div className="h-3 bg-slate-100 rounded-lg w-1/3" />
                <div className="h-3 bg-slate-100 rounded-lg w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) return <p className="text-brand-coral font-bold text-xs bg-brand-coral/5 border border-brand-coral/20 px-4 py-3 rounded-xl">⚠ {error}</p>

  return (
    <div className="antialiased text-slate-800">
      
      {/* Control Navigation Center */}
      <div className="mb-5 flex items-center justify-between gap-3">
       <button
  onClick={openFilters}
  className="relative flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-orange-200 text-[#b5451a] hover:bg-orange-50 transition active:scale-95 shadow-2xs"
  aria-label="Open filters"
>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h18M6 4v3m0 0a2 2 0 100 4 2 2 0 000-4zM6 11v9M12 4v9m0 0a2 2 0 100 4 2 2 0 000-4zm0 4v3M18 4v3m0 0a2 2 0 100 4 2 2 0 000-4zm0 4v9" />
          </svg>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-brand-coral text-white text-[9px] font-black rounded-full shadow-xs border-2 border-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs z-10">🔍</span>
         <input
  type="text"
  placeholder="Search localized area or key parameters..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-orange-200 text-slate-800 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-[#e8792e] transition-all shadow-2xs"
/>
        </div>
      </div>

      {/* Side View Overlay Filter Block */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowFilters(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm p-6 max-h-[85vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-[#b5451a] font-black text-[11px] uppercase tracking-wider">Refine Discovery</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-3">Structural Class</p>
              <div className="flex flex-wrap gap-2">
                {ROOM_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleDraftRoomType(type)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 uppercase tracking-wider text-[10px] ${
                      draftRoomTypes.includes(type)
                        ? 'bg-brand-sage border-brand-sage text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-2">Monthly Expenditure Matrix</p>
              <p className="text-brand-coral font-black text-xs mb-4 bg-brand-coral/5 border border-brand-coral/10 inline-block px-3 py-1.5 rounded-xl">
                ₹{draftMinPrice.toLocaleString('en-IN')} — ₹{draftMaxPrice.toLocaleString('en-IN')}
              </p>

              <div className="relative h-6 flex items-center mt-2">
                <div className="absolute w-full h-1 bg-slate-100 rounded-full" />
                <div
                  className="absolute h-1 bg-brand-coral rounded-full"
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
                  className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-coral [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-xs [&::-webkit-slider-thumb]:cursor-pointer"
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
                  className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-coral [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-xs [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>

              <div className="flex justify-between text-slate-400 text-[10px] font-bold mt-2 tracking-wide">
                <span>₹0</span>
                <span>₹30,000+</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 py-2.5 rounded-xl bg-brand-sage text-white text-xs font-black uppercase tracking-wider hover:opacity-95 transition shadow-2xs"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Architecture Render */}
      {filteredRooms.length === 0 ? (
       <div className="bg-[#fbe4c8] border border-orange-200 rounded-2xl p-10 text-slate-500 text-xs font-bold uppercase tracking-wider text-center">
  No assets match the specified parameters.
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