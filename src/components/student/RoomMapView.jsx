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

// Custom pulsing blue dot matching the ecosystem typography layout
const currentLocationIcon = L.divIcon({
  className: 'current-location-marker',
  html: `<div style="position: relative; width: 18px; height: 18px;">
      <div style="position: absolute; inset: 0; background: #c87a65; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 1px 6px rgba(200,122,101,0.4);"></div>
      <div style="position: absolute; inset: -5px; background: rgba(200,122,101,0.25); border-radius: 50%; animation: pulseLoc 2s infinite ease-in-out;"></div>
    </div>
    <style>@keyframes pulseLoc { 0% { transform: scale(0.8); opacity: 0.9; } 70% { transform: scale(1.9); opacity: 0; } 100% { transform: scale(0.8); opacity: 0; } }</style>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
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

  const liveLocation = referenceLocation ? [referenceLocation.lat, referenceLocation.lng] : null

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
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-slate-400 text-xs font-bold uppercase tracking-wider text-center">
        Spatial location parameters missing for this asset.
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
    <div className="space-y-3 antialiased">
      {/* Map viewport canvas card */}
      <div className="rounded-xl overflow-hidden border border-slate-200/80 shadow-2xs z-0 relative" style={{ height: '220px' }}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>' 
          />
          <Marker position={[room.latitude, room.longitude]}>
            <Popup>
              <span className="font-bold text-xs text-slate-800">{room.title}</span>
            </Popup>
          </Marker>
          {liveLocation && (
            <Marker position={liveLocation} icon={currentLocationIcon}>
              <Popup>
                <span className="font-bold text-xs text-slate-800">Your Target Coordinate</span>
              </Popup>
            </Marker>
          )}
          <FlyTo position={liveLocation} trigger={flyTrigger} />
        </MapContainer>
      </div>

      {/* Control interface block */}
      <div className="flex justify-between items-center gap-2 pt-0.5">
        {distance !== null ? (
          <p className="text-brand-coral text-xs font-black uppercase tracking-wider flex items-center gap-1">
            <span>📏</span> {formatDistance(distance)} from {referenceLocation?.label === 'My current location' ? 'your location' : referenceLocation?.label}
          </p>
        ) : locationError ? (
          <p className="text-brand-coral font-bold text-[11px] bg-brand-coral/5 px-2.5 py-1 rounded-lg border border-brand-coral/10">{locationError}</p>
        ) : (
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Proximity metric deferred</p>
        )}

        <div className="flex items-center gap-3 flex-shrink-0">
          {referenceLocation?.label === 'My current location' && (
            <button
              onClick={useFixedLocation}
              className="text-slate-400 text-[11px] font-bold uppercase tracking-wider hover:text-slate-600 transition underline decoration-dotted underline-offset-2"
            >
              Reset
            </button>
          )}
          <button
            onClick={requestLocation}
            disabled={locating}
            className="text-brand-sage text-[11px] font-black uppercase tracking-wider hover:opacity-80 transition flex items-center gap-1 disabled:opacity-40"
          >
            📍 {locating ? 'Tracking...' : 'Sync GPS Location'}
          </button>
        </div>
      </div>
    </div>
  )
}