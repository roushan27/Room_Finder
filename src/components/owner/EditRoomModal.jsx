import { useState, lazy, Suspense } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { compressImage } from '../../utils/imageCompress'

const MapPicker = lazy(() => import('./MapPicker'))

const FACILITY_OPTIONS = [
  'WiFi', 'AC', 'Food/Mess', 'Laundry', 'Parking',
  'Power Backup', 'Attached Bathroom', 'Furnished', 'Water Supply', 'CCTV',
  'Study Table', 'Wardrobe', 'Private Bathroom', 'Housekeeping'
]

const ROOM_TYPES = ['1BHK', '2BHK', '3BHK', 'Independent']
const CATEGORIES = ['PG', 'Hostel', 'Flat', 'House', 'Shared Room']
const OCCUPANCY_OPTIONS = ['Single', 'Double', 'Triple', 'Any']
const TENANT_TYPES = ['Students', 'Working Professionals', 'Families', 'Anyone']

export default function EditRoomModal({ room, onClose, onUpdated }) {
  useModalBackButton(true, onClose)
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: room.title,
    description: room.description || '',
    price: room.price,
    total_rooms: room.total_rooms,
    available_rooms: room.available_rooms,
    room_type: room.room_type || '1BHK',
    category: room.category || 'PG',
    occupancy: room.occupancy || 'Single',
    tenant_type: room.tenant_type || 'Students',
    phone_number: room.phone_number || '',
  })
  const [coords, setCoords] = useState({
    lat: room.latitude || null,
    lng: room.longitude || null,
    address: room.address || '',
  })
  const [facilities, setFacilities] = useState(room.facilities || [])
  const [selectedPhotos, setSelectedPhotos] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadLabel, setUploadLabel] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const toggleFacility = (facility) => {
    setFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    )
  }

  const handlePhotoSelect = (e) => {
    const newFiles = Array.from(e.target.files)
    if (newFiles.length > 0) {
      setSelectedPhotos((prev) => [...prev, ...newFiles])
    }
    e.target.value = ''
  }

  const uploadPhotos = async (files) => {
    if (!files.length) return room.photos || []

    const urls = []

    for (let i = 0; i < files.length; i++) {
      let file = files[i]
      setUploadLabel(`Compressing image ${i + 1} of ${files.length}...`)

      try {
        file = await compressImage(file)
      } catch {
        // fall back to original file if compression fails
      }

      const fileExt = file.name.split('.').pop() || 'jpg'
      const uniqueName = `${user.id}/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`

      setUploadLabel(`Uploading image ${i + 1} of ${files.length}...`)

      const { error: uploadError } = await supabase.storage.from('room-photos').upload(uniqueName, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (uploadError) {
        throw new Error(`"${file.name}" upload failed: ${uploadError.message}`)
      }

      const { data } = supabase.storage.from('room-photos').getPublicUrl(uniqueName)
      urls.push(data.publicUrl)
    }

    return urls
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (!coords.lat || !coords.lng) {
      setError('Please select the room location on the map')
      setSaving(false)
      return
    }

    try {
      let updatedPhotos = room.photos || []

      if (selectedPhotos.length > 0) {
        updatedPhotos = await uploadPhotos(selectedPhotos)
      }

      const city = coords.address
        ? coords.address.split(',').slice(-3, -2)[0]?.trim() || room.city || 'Unknown'
        : room.city || 'Unknown'

      const { error } = await supabase
        .from('rooms')
        .update({
          title: form.title,
          description: form.description,
          address: coords.address,
          city,
          price: parseFloat(form.price),
          total_rooms: parseInt(form.total_rooms),
          available_rooms: parseInt(form.available_rooms),
          room_type: form.room_type,
          category: form.category,
          occupancy: form.occupancy,
          tenant_type: form.tenant_type,
          phone_number: form.phone_number || null,
          facilities,
          photos: updatedPhotos,
          latitude: coords.lat,
          longitude: coords.lng,
        })
        .eq('id', room.id)

      if (error) {
        setError(error.message)
        setSaving(false)
        setUploadLabel('')
      } else {
        setUploadLabel('')
        onUpdated()
        onClose()
      }
    } catch (err) {
      setError(err.message)
      setSaving(false)
      setUploadLabel('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-slate-900/95 border border-white/20 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-white">Edit Room</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl">✕</button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded-lg">{error}</p>}

        <form onSubmit={handleSave} className="space-y-3">
          <input
            name="title"
            placeholder="Room title (e.g. Sunrise PG for Boys)"
            value={form.title}
            onChange={handleChange}
            required
            disabled={saving}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 disabled:opacity-50"
          />

          <div>
            <label className="text-white/60 text-sm mb-2 block">Room Type</label>
            <div className="flex flex-wrap gap-2">
              {ROOM_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  disabled={saving}
                  onClick={() => setForm({ ...form, room_type: type })}
                  className={`px-4 py-2 rounded-lg text-sm border transition disabled:opacity-50 ${
                    form.room_type === type
                      ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/40'
                      : 'bg-white/10 border-white/20 text-white/60'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-sm mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={handleChange}
                name="category"
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} className="text-slate-900">{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Occupancy</label>
              <select
                value={form.occupancy}
                onChange={handleChange}
                name="occupancy"
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
              >
                {OCCUPANCY_OPTIONS.map((option) => (
                  <option key={option} value={option} className="text-slate-900">{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1 block">Preferred Tenant</label>
            <select
              value={form.tenant_type}
              onChange={handleChange}
              name="tenant_type"
              disabled={saving}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
            >
              {TENANT_TYPES.map((option) => (
                <option key={option} value={option} className="text-slate-900">{option}</option>
              ))}
            </select>
          </div>

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            disabled={saving}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 disabled:opacity-50"
          />

          <input
            name="price"
            type="number"
            placeholder="Price per month (₹)"
            value={form.price}
            onChange={handleChange}
            required
            disabled={saving}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 disabled:opacity-50"
          />

          <div>
            <label className="text-white/60 text-sm mb-2 block">Facilities</label>
            <div className="flex flex-wrap gap-2">
              {FACILITY_OPTIONS.map((facility) => (
                <button
                  type="button"
                  key={facility}
                  disabled={saving}
                  onClick={() => toggleFacility(facility)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition disabled:opacity-50 ${
                    facilities.includes(facility)
                      ? 'bg-blue-500 border-blue-400 text-white shadow-md shadow-blue-500/30'
                      : 'bg-white/10 border-white/20 text-white/60'
                  }`}
                >
                  {facility}
                </button>
              ))}
            </div>
          </div>

          <Suspense fallback={<div className="bg-white/5 rounded-xl h-[250px] flex items-center justify-center text-white/30 text-sm">Loading map...</div>}>
            <MapPicker
              latitude={coords.lat}
              longitude={coords.lng}
              onChange={(lat, lng, address) => setCoords({ lat, lng, address })}
            />
          </Suspense>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-sm">Total Rooms</label>
              <input
                name="total_rooms"
                type="number"
                min={1}
                value={form.total_rooms}
                onChange={handleChange}
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-white/60 text-sm">Available Rooms</label>
              <input
                name="available_rooms"
                type="number"
                min={0}
                value={form.available_rooms}
                onChange={handleChange}
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block">Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={saving}
              onChange={handlePhotoSelect}
              className="w-full text-sm text-white/70 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white file:cursor-pointer disabled:opacity-50"
            />
            {selectedPhotos.length > 0 && (
              <p className="text-xs text-blue-300 mt-2">{selectedPhotos.length} new image(s) selected</p>
            )}
            {room.photos?.length > 0 && !selectedPhotos.length && (
              <p className="text-xs text-white/40 mt-2">Current images will be kept unless you choose new ones.</p>
            )}
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1 block">Phone Number (optional)</label>
            <input
              name="phone_number"
              type="tel"
              placeholder="+91 9876543210"
              value={form.phone_number}
              onChange={handleChange}
              disabled={saving}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 disabled:opacity-50"
            />
          </div>

          {uploadLabel && <p className="text-sm text-blue-300">{uploadLabel}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 transition text-white font-semibold disabled:opacity-50 shadow-lg shadow-blue-500/30"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
