import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import RoomCard from './RoomCard'
import RoomDetailModal from './RoomDetailModal'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { useAuth } from '../../context/AuthContext'

const ROOM_TYPES = ['1BHK', '2BHK', 'Independent']
const SORT_OPTIONS = [
   { key: 'newest', label: 'Newest First' },
   { key: 'price_low', label: 'Price: Low to High' },
   { key: 'price_high', label: 'Price: High to Low' },
 ]
export default function RoomList({ guestMode = false, city }) {
  const { user } = useAuth()  
  const [searchParams, setSearchParams] = useSearchParams()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const [appliedRoomTypes, setAppliedRoomTypes] = useState([])
  const [appliedMinPrice, setAppliedMinPrice] = useState(0)
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(30000)
  const [appliedCity, setAppliedCity] = useState('') 
  const [sortBy, setSortBy] = useState('newest')
   
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [draftRoomTypes, setDraftRoomTypes] = useState([])
  const [draftMinPrice, setDraftMinPrice] = useState(0)
  const [draftMaxPrice, setDraftMaxPrice] = useState(30000)
   const [draftCity, setDraftCity] = useState('')
   const [availableCities, setAvailableCities] = useState([])

  useModalBackButton(showFilters, () => setShowFilters(false))

  const fetchRooms = async () => {
    setLoading(true)
    let query = supabase
      .from('rooms')
      .select('id, owner_id, title, description, address, city, price, total_rooms, available_rooms, room_type, facilities, photos, videos, avg_rating, total_ratings, latitude, longitude, created_at, is_active, phone_number, category, occupancy, tenant_type')
      .eq('is_active', true)

    if (city) {
      query = query.eq('city', city)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) setError(error.message)
    else {
   setRooms(data)
   const uniqueCities = [...new Set(data.map((r) => r.city).filter(Boolean))].sort()
   setAvailableCities(uniqueCities)
 }
    setLoading(false)
  }
 const fetchFavorites = async () => {
    if (!user?.id) return
    const { data } = await supabase.from('favorites').select('room_id').eq('student_id', user.id)
    if (data) setFavoriteIds(new Set(data.map((f) => f.room_id)))
  }
  useEffect(() => {
    fetchRooms()
    fetchFavorites()
  }, [city, user?.id])

  useEffect(() => {
   if (searchParams.get('favorites') === '1') {
     setShowFavoritesOnly(true)
   }
 }, [])

useEffect(() => {
  const sharedRoomId = searchParams.get('room')
  if (!sharedRoomId) return

  if (rooms.length > 0) {
    const found = rooms.find((r) => r.id === sharedRoomId)
    if (found) {
      setSelectedRoom(found)
      searchParams.delete('room')
      setSearchParams(searchParams, { replace: true })
      return
    }
  }

  // Fallback: room not in the current filtered list — fetch it directly
  const fetchSharedRoom = async () => {
    const { data } = await supabase
      .from('rooms')
      .select('id, owner_id, title, description, address, city, price, total_rooms, available_rooms, room_type, facilities, photos, videos, avg_rating, total_ratings, latitude, longitude, created_at, is_active, phone_number, category, occupancy, tenant_type')
      .eq('id', sharedRoomId)
      .maybeSingle()

    if (data) setSelectedRoom(data)
    searchParams.delete('room')
    setSearchParams(searchParams, { replace: true })
  }

  if (!loading) fetchSharedRoom()
}, [rooms, loading])

  const toggleDraftRoomType = (type) => {
    setDraftRoomTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }
  const handleFavoriteChange = (roomId, isFavorited) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (isFavorited) next.add(roomId)
      else next.delete(roomId)
      return next
    })
  }

  const openFilters = () => {
    setDraftRoomTypes(appliedRoomTypes)
    setDraftMinPrice(appliedMinPrice)
    setDraftMaxPrice(appliedMaxPrice)
    setDraftCity(appliedCity)
    setShowFilters(true)
  }

  const applyFilters = () => {
    setAppliedRoomTypes(draftRoomTypes)
    setAppliedMinPrice(draftMinPrice)
    setAppliedMaxPrice(draftMaxPrice)
    setAppliedCity(draftCity)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setDraftRoomTypes([])
    setDraftMinPrice(0)
    setDraftMaxPrice(30000)
    setDraftCity('')
  }

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase())
    const matchesType = appliedRoomTypes.length === 0 || appliedRoomTypes.includes(r.room_type)
    const matchesPrice = r.price >= appliedMinPrice && r.price <= appliedMaxPrice
    const matchesFavorite = !showFavoritesOnly || favoriteIds.has(r.id)
    const matchesCity = !appliedCity || r.city === appliedCity
    return matchesSearch && matchesType && matchesPrice && matchesFavorite && matchesCity
  })
 const sortedRooms = [...filteredRooms].sort((a, b) => {
   if (sortBy === 'price_low') return a.price - b.price
   if (sortBy === 'price_high') return b.price - a.price
   if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at)
   return 0
 })
  const activeFilterCount =
     appliedRoomTypes.length + (appliedMinPrice > 0 || appliedMaxPrice < 30000 ? 1 : 0) + (appliedCity ? 1 : 0)

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 antialiased">
       {[1, 2, 3, 4, 5, 6].map((i) => (
  <div key={i} className="rounded-2xl overflow-hidden animate-pulse bg-[#fef6ec] border border-orange-200/60 shadow-2xs">
    <div className="h-36 sm:h-44 bg-orange-100" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-orange-100/70 rounded-lg w-5/6" />
      <div className="h-3 bg-orange-100/50 rounded-lg w-1/2" />
      <div className="pt-2 flex justify-between">
        <div className="h-3 bg-orange-100/70 rounded-lg w-1/3" />
        <div className="h-3 bg-orange-100/70 rounded-lg w-1/4" />
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
      
   <div className="mb-5 flex items-center gap-2 sm:gap-3">
  {/* Filter + Sort — ek grouped pill mein */}
  <div className="flex items-center gap-1 bg-white border border-orange-200 rounded-xl p-1 shadow-2xs flex-shrink-0">
    <button
      onClick={openFilters}
      className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-[#b5451a] hover:bg-orange-50 transition active:scale-95"
      aria-label="Open filters"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h18M6 4v3m0 0a2 2 0 100 4 2 2 0 000-4zM6 11v9M12 4v9m0 0a2 2 0 100 4 2 2 0 000-4zm0 4v3M18 4v3m0 0a2 2 0 100 4 2 2 0 000-4zm0 4v9" />
      </svg>
      {activeFilterCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 flex items-center justify-center bg-brand-coral text-white text-[9px] font-black rounded-full shadow-xs border-2 border-white">
          {activeFilterCount}
        </span>
      )}
    </button>

    <div className="w-px h-6 bg-orange-100" />

    <div className="relative">
      <button
        onClick={() => setShowSortMenu((prev) => !prev)}
        className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-[#b5451a] hover:bg-orange-50 transition active:scale-95"
        aria-label="Sort options"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 7h10M3 12h6M3 17h3M17 4v13m0 0l-4-4m4 4l4-4" />
        </svg>
      </button>

      {showSortMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
          <div className="absolute top-full left-0 mt-2 bg-white border border-orange-200 rounded-xl shadow-lg overflow-hidden z-50 w-44">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setSortBy(opt.key)
                  setShowSortMenu(false)
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition ${
                  sortBy === opt.key
                    ? 'bg-brand-sage/10 text-brand-sage'
                    : 'text-slate-600 hover:bg-orange-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  </div>

  {/* Favorites — alag standalone button */}
  {!guestMode && (
    <button
      onClick={() => setShowFavoritesOnly((prev) => !prev)}
     className={`hidden sm:flex flex-shrink-0 items-center justify-center w-11 h-11 rounded-xl border transition active:scale-95 shadow-2xs ${
        showFavoritesOnly
          ? 'bg-brand-coral border-brand-coral text-white'
          : 'bg-white border-orange-200 text-brand-coral hover:bg-orange-50'
      }`}
      aria-label="Show favorites only"
    >
      <svg className="w-4 h-4" fill={showFavoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  )}

  <div className="relative flex-1">
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
           {availableCities.length > 0 && (
   <div>
     <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-3">City</p>
     <div className="flex flex-wrap gap-2">
       <button
         onClick={() => setDraftCity('')}
         className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 uppercase tracking-wider text-[10px] ${
           draftCity === ''
             ? 'bg-brand-sage border-brand-sage text-white shadow-xs'
             : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
         }`}
       >
         All Cities
       </button>
       {availableCities.map((c) => (
         <button
           key={c}
           onClick={() => setDraftCity(c)}
           className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 uppercase tracking-wider text-[10px] ${
             draftCity === c
               ? 'bg-brand-sage border-brand-sage text-white shadow-xs'
               : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
           }`}
         >
           {c}
         </button>
       ))}
     </div>
   </div>
 )}
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
       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {sortedRooms.map((room) => (
            <RoomCard key={room.id} room={room} onClick={setSelectedRoom} 
            guestMode={guestMode}
 isFavorited={favoriteIds.has(room.id)}
 onFavoriteChange={handleFavoriteChange}
            />
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