import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { calculateDistance, formatDistance } from '../../utils/distance'
import { useLocation } from '../../context/LocationContext'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom pulsing blue dot, like Google Maps' "you are here" marker
const currentLocationIcon = L.divIcon({
  className: 'current-location-marker',
  html: `<div style="position: relative; width: 20px; height: 20px;">
      <div style="position: absolute; inset: 0; background: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(59,130,246,0.8);"></div>
      <div style="position: absolute; inset: -6px; background: rgba(59,130,246,0.3); border-radius: 50%; animation: pulseLoc 2s infinite;"></div>
    </div>
    <style>@keyframes pulseLoc { 0% { transform: scale(0.8); opacity: 0.8; } 70% { transform: scale(2); opacity: 0; } 100% { transform: scale(0.8); opacity: 0; } }</style>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function FlyTo({ position, trigger }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 0.8 })
  }, [trigger])
  return null
}

export default function RoomMapView({ room }) {
  const { referenceLocation, updateReferenceLocation, useFixedLocation } = useLocation()
  const [locationError, setLocationError] = useState('')
  const [locating, setLocating] = useState(false)
  const [flyTrigger, setFlyTrigger] = useState(0)

  // The point we measure distance from: user's live GPS if they've tapped the button,
  // otherwise falls back to the fixed default (Sarala Birla University)
  const liveLocation = referenceLocation ? [referenceLocation.lat, referenceLocation.lng] : null

  // Requires an explicit tap to work reliably on mobile browsers —
  // silent/automatic geolocation calls are often blocked on phones until the user interacts.
 const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported on this device')
      return
    }
    setLocating(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateReferenceLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'My current location',
        })
        setLocationError('')
        setLocating(false)
        setFlyTrigger((prev) => prev + 1)
      },
      (err) => {
        setLocationError(
          err.code === 1 ? 'Location permission denied' : 'Unable to get your location'
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  if (!room.latitude || !room.longitude) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/40 text-sm text-center">
        Location not available for this room yet.
      </div>
    )
  }

  const distance = liveLocation
    ? calculateDistance(liveLocation[0], liveLocation[1], room.latitude, room.longitude)
    : null

  const center = liveLocation
    ? [(liveLocation[0] + room.latitude) / 2, (liveLocation[1] + room.longitude) / 2]
    : [room.latitude, room.longitude]

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden border border-white/20" style={{ height: '220px' }}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <Marker position={[room.latitude, room.longitude]}>
            <Popup>{room.title}</Popup>
          </Marker>
          {liveLocation && (
            <Marker position={liveLocation} icon={currentLocationIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}
          <FlyTo position={liveLocation} trigger={flyTrigger} />
        </MapContainer>
      </div>

     <div className="flex justify-between items-center">
  {distance !== null ? (
  <p className="text-blue-300 text-sm font-medium">
    📏 {formatDistance(distance)} from {referenceLocation?.label === 'My current location' ? 'your location' : referenceLocation?.label}
  </p>
) : locationError ? (
    <p className="text-red-400 text-xs">{locationError}</p>
  ) : (
    <p className="text-white/30 text-xs">Distance unavailable</p>
  )}

  <div className="flex items-center gap-2 flex-shrink-0">
  {referenceLocation?.label === 'My current location' && (
    <button
      onClick={useFixedLocation}
      className="text-white/40 text-xs hover:text-white/70 transition underline"
    >
      Reset
    </button>
  )}
  <button
    onClick={requestLocation}
    disabled={locating}
    className="text-blue-300 text-xs hover:text-blue-200 transition flex items-center gap-1 disabled:opacity-50"
  >
    📍 {locating ? 'Locating...' : 'Use my exact location'}
  </button>
</div>
    </div>
    </div>
  )
}
