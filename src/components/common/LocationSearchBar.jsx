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
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your location (e.g. college name, area)"
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400"
        />
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition disabled:opacity-50"
        >
          {searching ? '...' : 'Search'}
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          title="Use my current location"
          className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
        >
          📍
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-2 bg-slate-900/95 border border-white/20 rounded-xl overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => selectResult(r)}
              className="w-full text-left px-4 py-2.5 text-white/80 text-sm hover:bg-white/10 transition border-b border-white/5 last:border-0"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}

      {referenceLocation && (
        <p className="text-white/40 text-xs mt-2">
          📍 Distances shown from: <span className="text-blue-300">{referenceLocation.label}</span>
        </p>
      )}
    </div>
  )
}
