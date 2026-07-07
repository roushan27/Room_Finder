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

  // Asks for browser location permission and places the pin at the current GPS position
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
    )
  }

  

  

  return (
    <div>
      <label className="text-white/60 text-sm mb-2 block">Room Location on Map</label>

     

      {/* New: Use current location button */}
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={locating}
        className="w-full mb-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <span>📍</span> {locating ? 'Getting your location...' : 'Use my current location'}
      </button>

      {locationError && (
        <p className="text-red-400 text-xs mb-2">{locationError}</p>
      )}

      

      <div className="rounded-xl overflow-hidden border border-white/20" style={{ height: '250px' }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <Marker position={position} />
          <ClickHandler onPick={handlePick} />
          <FlyToLocation position={position} />
        </MapContainer>
      </div>

      <p className="text-white/40 text-xs mt-1">Tap on the map or use current location to place the exact pin</p>

      {resolvedAddress && (
        <p className="text-blue-300 text-xs mt-2 bg-blue-500/10 px-3 py-2 rounded-lg">📍 {resolvedAddress}</p>
      )}
    </div>
  )
}
