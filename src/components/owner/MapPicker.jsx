import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    )
    const data = await res.json()
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

function FlyToLocation({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 0.8 })
    }
  }, [position, map])
  return null
}

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
  const [searching, setSearching] = useState(false)
  const [resolvedAddress, setResolvedAddress] = useState('')
  const [position, setPosition] = useState(
    latitude && longitude ? [latitude, longitude] : [20.5937, 78.9629]
  )

  const handlePick = async (lat, lng) => {
    setPosition([lat, lng])
    setResolvedAddress('Locating address...')
    const address = await reverseGeocode(lat, lng)
    setResolvedAddress(address)
    onChange(lat, lng, address)
  }

  const runSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
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

  // No <form> here — this is a plain button click + Enter-key handler,
  // since this component lives INSIDE the parent AddRoomForm's <form>,
  // and HTML does not allow nested <form> elements.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      runSearch()
    }
  }

  const selectResult = async (r) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    setPosition([lat, lng])
    setResolvedAddress(r.display_name)
    onChange(lat, lng, r.display_name)
    setResults([])
    setQuery('')
  }

  return (
    <div>
      <label className="text-white/60 text-sm mb-2 block">Room Location on Map</label>

      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search address to place pin..."
          className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400"
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={searching}
          className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm transition disabled:opacity-50"
        >
          {searching ? '...' : 'Find'}
        </button>
      </div>

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
          <FlyToLocation position={position} />
        </MapContainer>
      </div>

      <p className="text-white/40 text-xs mt-1">Tap on the map to place the exact pin location</p>

      {resolvedAddress && (
        <p className="text-blue-300 text-xs mt-2 bg-blue-500/10 px-3 py-2 rounded-lg">
          📍 {resolvedAddress}
        </p>
      )}
    </div>
  )
}
