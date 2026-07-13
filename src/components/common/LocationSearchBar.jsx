import { useState } from 'react'
import { useLocation } from '../../context/LocationContext'

export default function LocationSearchBar({ compact = false }) {
  const { referenceLocation, updateReferenceLocation, useMyLocation } = useLocation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setResults([])

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )
      const data = await res.json()
      setResults(data)
    } catch {
      setResults([])
    }
    setSearching(false)
  }

  const selectResult = (result) => {
    updateReferenceLocation({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      label: result.display_name.split(',').slice(0, 2).join(','),
    })
    setResults([])
    setQuery('')
  }

  return (
    <div className={compact ? '' : 'mb-4'}>
      <form onSubmit={handleSearch} className="flex gap-2">
        {/* Centralized Update: Alpha inputs converted to flat light borders with brand-sage focus */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your location (e.g. college name, area)"
          className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-brand-sage transition-all shadow-xs"
        />
        
        {/* Centralized Update: Button state mapped to brand-sage */}
        <button
          type="submit"
          disabled={searching}
          className="px-5 py-2.5 rounded-xl bg-brand-sage hover:opacity-90 text-white text-xs font-bold transition disabled:opacity-50 shadow-md shadow-emerald-700/10 active:scale-98"
        >
          {searching ? '...' : 'Search'}
        </button>

        {/* Location pinpoint button transformed to standard white control block */}
        <button
          type="button"
          onClick={useMyLocation}
          title="Use my current location"
          className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition active:scale-95 shadow-xs text-xs"
        >
          📍
        </button>
      </form>

      {/* Suggestion Dropdown panel converted from deep slate-900 overlay to solid white elevation menu */}
      {results.length > 0 && (
        <div className="mt-2 bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-lg shadow-slate-200/50 relative z-20">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => selectResult(r)}
              className="w-full text-left px-4 py-2.5 text-slate-700 text-xs hover:bg-slate-50 transition border-b border-slate-100 last:border-0 font-medium"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}

      {/* Distance anchor target tracking pill text mapped to brand tokens */}
      {referenceLocation && (
        <p className="text-slate-400 font-semibold text-[11px] mt-2.5 flex items-center gap-1">
          📍 Distances shown from: <span className="text-brand-coral hover:underline cursor-pointer">{referenceLocation.label}</span>
        </p>
      )}
    </div>
  )
}