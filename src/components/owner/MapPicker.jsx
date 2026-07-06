import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon paths (common Vite/bundler issue with Leaflet)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function MapPicker({ latitude, longitude, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [position, setPosition] = useState(
    latitude && longitude ? [latitude, longitude] : [20.5937, 78.9629] // default: India center
  )

  useEffect(() => {
    if (latitude && longitude) setPosition([latitude, longitude])
  }, [latitude, longitude])

  const handlePick = (lat, lng) => {
    setPosition([lat, lng])
    onChange(lat, lng)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )
      const data = await res.json()
      setResults(data)
    } catch {
      setResults([])
    }
  }

  const selectResult = (r) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    setPosition([lat, lng])
    onChange(lat, lng)
    setResults([])
    setQuery('')
  }

  return (
    <div>
      <label className="text-white/60 text-sm mb-2 block">Room Location on Map</label>

      <form onSubmit={handleSearch} className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search address to place pin..."
          className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm transition"
        >
          Find
        </button>
      </form>

      {results.length > 0 && (
        <div className="mb-2 bg-slate-800 border border-white/20 rounded-lg overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectResult(r)}
              className="w-full text-left px-3 py-2 text-white/80 text-xs hover:bg-white/10 transition border-b border-white/5 last:border-0"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-white/20" style={{ height: '250px' }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={position} />
          <ClickHandler onPick={handlePick} />
        </MapContainer>
      </div>
      <p className="text-white/40 text-xs mt-1">Tap on the map to place the exact pin location</p>
    </div>
  )
}
