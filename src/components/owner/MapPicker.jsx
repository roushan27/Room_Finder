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
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    const data = await res.json()
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

function FlyToLocation({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 0.8 })
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
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [resolvedAddress, setResolvedAddress] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
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
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
      const data = await res.json()
      setResults(data)
    } catch {
      setResults([])
    }
    setSearching(false)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      runSearch()
    }
  }

  const selectResult = (r) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    setPosition([lat, lng])
    setResolvedAddress(r.display_name)
    onChange(lat, lng, r.display_name)
    setResults([])
    setQuery('')
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported on this device')
      return
    }
    setLocating(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setPosition([lat, lng])
        setResolvedAddress('Locating address...')
        const address = await reverseGeocode(lat, lng)
        setResolvedAddress(address)
        onChange(lat, lng, address)
        setLocating(false)
      },
      (err) => {
        setLocationError(
          err.code === 1
            ? 'Location permission denied. Please allow location access.'
            : 'Could not get your location. Try searching instead.'
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="antialiased text-slate-800">
      <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-2 block">
        Geographic Location Layout
      </label>

      {/* Address Search Subsystem */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search for an address or milestone..."
          className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-brand-sage transition shadow-xs"
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={searching}
          className="px-4 py-2 rounded-xl bg-brand-sage text-white text-xs font-bold hover:opacity-90 transition disabled:opacity-50 active:scale-95"
        >
          {searching ? '...' : 'Find'}
        </button>
      </div>

      {/* Popover Search Results Drops */}
      {results.length > 0 && (
        <div className="mb-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-[180px] overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectResult(r)}
              className="w-full text-left px-3 py-2 text-slate-700 text-xs hover:bg-slate-50 transition border-b border-slate-100 last:border-0 font-medium"
            >
              📍 {r.display_name}
            </button>
          ))}
        </div>
      )}

      {/* GPS Geolocation Active Component */}
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={locating}
        className="w-full mb-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
      >
        <span>🎯</span> {locating ? 'Acquiring GPS coordinates...' : 'Use My Current Location'}
      </button>

      {locationError && (
        <p className="text-brand-coral text-[11px] font-bold mb-2 px-1">
          ⚠ {locationError}
        </p>
      )}

      {/* Main Map Frame */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-10 relative" style={{ height: '220px' }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <Marker position={position} />
          <ClickHandler onPick={handlePick} />
          <FlyToLocation position={position} />
        </MapContainer>
      </div>

      <p className="text-slate-400 text-[10px] font-semibold mt-2 px-1 uppercase tracking-wide">
        Interact with map layout canvas to override geolocation marker positions.
      </p>

      {/* Resolved Reverse Geocode Box */}
      {resolvedAddress && (
        <p className="text-brand-sage text-xs font-semibold mt-3 bg-brand-sage/5 border border-brand-sage/20 px-3 py-2.5 rounded-xl flex items-start gap-1.5 break-words">
          <span className="text-base leading-none">📍</span>
          <span className="flex-1">{resolvedAddress}</span>
        </p>
      )}
    </div>
  )
}