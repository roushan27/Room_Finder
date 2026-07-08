import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { compressImage } from '../../utils/imageCompress'

const FACILITY_OPTIONS = [
  'WiFi', 'AC', 'Food/Mess', 'Laundry', 'Parking',
  'Power Backup', 'Attached Bathroom', 'Furnished', 'Water Supply', 'CCTV'
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
    address: room.address,
    city: room.city,
    price: room.price,
    total_rooms: room.total_rooms,
    available_rooms: room.available_rooms,
    room_type: room.room_type || '1BHK',
    category: room.category || 'PG',
    occupancy: room.occupancy || 'Single',
    tenant_type: room.tenant_type || 'Students',
    website: room.website || '',
    requirements: room.requirements || '',
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

    try {
      let updatedPhotos = room.photos || []

      if (selectedPhotos.length > 0) {
        updatedPhotos = await uploadPhotos(selectedPhotos)
      }

      const { error } = await supabase
        .from('rooms')
        .update({
          title: form.title,
          description: form.description,
          address: form.address,
          city: form.city,
          price: parseFloat(form.price),
          total_rooms: parseInt(form.total_rooms),
          available_rooms: parseInt(form.available_rooms),
          room_type: form.room_type,
          category: form.category,
          occupancy: form.occupancy,
          tenant_type: form.tenant_type,
          website: form.website,
          requirements: form.requirements,
          facilities,
          photos: updatedPhotos,
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
            value={form.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400"
          />

          <div>
            <label className="text-white/60 text-sm mb-2 block">Room Type</label>
            <div className="flex flex-wrap gap-2">
              {ROOM_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setForm({ ...form, room_type: type })}
                  className={`px-4 py-2 rounded-lg text-sm border transition ${
                    form.room_type === type
                      ? 'bg-blue-500 border-blue-400 text-white'
                      : 'bg-white/10 border-white/20 text-white/60'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400"
          />
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              required
              className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400"
            />
            <input
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              required
              className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-sm">Total Rooms</label>
              <input
                name="total_rooms"
                type="number"
                min={1}
                value={form.total_rooms}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400"
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
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block">Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="w-full text-sm text-white/70 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white file:cursor-pointer"
            />
            {selectedPhotos.length > 0 && (
              <p className="text-xs text-blue-300 mt-2">{selectedPhotos.length} new image selected</p>
            )}
            {room.photos?.length > 0 && !selectedPhotos.length && (
              <p className="text-xs text-white/40 mt-2">Current images will be kept unless you choose new ones.</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-sm mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={handleChange}
                name="category"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400"
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
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400"
              >
                {OCCUPANCY_OPTIONS.map((option) => (
                  <option key={option} value={option} className="text-slate-900">{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-sm mb-1 block">Preferred Tenant</label>
              <select
                value={form.tenant_type}
                onChange={handleChange}
                name="tenant_type"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400"
              >
                {TENANT_TYPES.map((option) => (
                  <option key={option} value={option} className="text-slate-900">{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Website / Contact Link</label>
              <input
                name="website"
                type="url"
                placeholder="https://example.com"
                value={form.website}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1 block">Requirements</label>
            <textarea
              name="requirements"
              placeholder="Mention age, gender, documents, college, or other requirements"
              value={form.requirements}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block">Facilities</label>
            <div className="flex flex-wrap gap-2">
              {FACILITY_OPTIONS.map((facility) => (
                <button
                  type="button"
                  key={facility}
                  onClick={() => toggleFacility(facility)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                    facilities.includes(facility)
                      ? 'bg-blue-500 border-blue-400 text-white'
                      : 'bg-white/10 border-white/20 text-white/60'
                  }`}
                >
                  {facility}
                </button>
              ))}
            </div>
          </div>

          {uploadLabel && <p className="text-sm text-blue-300">{uploadLabel}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition text-white font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
