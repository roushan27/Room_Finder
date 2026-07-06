import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLocation } from '../../context/LocationContext'
import { calculateDistance, formatDistance } from '../../utils/distance'
import LocationSearchBar from '../common/LocationSearchBar'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const referenceIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'hue-rotate-90', // visually distinguish reference marker a bit
})

export default function RoomMapView({ room }) {
  const { referenceLocation } = useLocation()

  if (!room.latitude || !room.longitude) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/40 text-sm text-center">
        Location not available for this room yet.
      </div>
    )
  }

  const distance = referenceLocation
    ? calculateDistance(referenceLocation.lat, referenceLocation.lng, room.latitude, room.longitude)
    : null

  const center = referenceLocation
    ? [
        (referenceLocation.lat + room.latitude) / 2,
        (referenceLocation.lng + room.longitude) / 2,
      ]
    : [room.latitude, room.longitude]

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden border border-white/20" style={{ height: '220px' }}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={[room.latitude, room.longitude]}>
            <Popup>{room.title}</Popup>
          </Marker>
          {referenceLocation && (
            <Marker position={[referenceLocation.lat, referenceLocation.lng]} icon={referenceIcon}>
              <Popup>Your location</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {distance !== null && (
        <p className="text-blue-300 text-sm font-medium">
          📏 {formatDistance(distance)} from {referenceLocation.label}
        </p>
      )}

      <LocationSearchBar compact />
    </div>
  )
}
