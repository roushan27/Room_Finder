import { useState, lazy, Suspense } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { compressImage } from '../../utils/imageCompress'
import { useToast } from '../../context/ToastContext'

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
  const { toast } = useToast()
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
  city: room.city || '',
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
        // fallback
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
    if (parseInt(form.available_rooms) > parseInt(form.total_rooms)) {
      setError('Available rooms cannot be more than total rooms')
      setSaving(false)
      return
    }
    if (form.phone_number && !/^[6-9]\d{9}$/.test(form.phone_number.trim())) {
     toast.error('Please enter a valid 10-digit phone number')
     setSaving(false)
     return
   }
    try {
      let updatedPhotos = room.photos || []

      if (selectedPhotos.length > 0) {
        updatedPhotos = await uploadPhotos(selectedPhotos)
      }

      const city = coords.city || room.city || 'Unknown'
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
        toast.error(error.message)
        setSaving(false)
        setUploadLabel('')
      } else {
        setUploadLabel('')
        toast.success('Room updated successfully!')
        setSaving(false)
        onUpdated() // Notify parent component about the update
        onClose()
      }
    } catch (err) {
      setError(err.message)
      setSaving(false)
      setUploadLabel('')
    }
  }

  return (
    // Backdrop transformed to matches soft neutral overlays
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 sm:p-4 animate-fade-in text-slate-800">
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl shadow-slate-900/10">
        
        {/* Header Layout Grid Block */}
        <div className="flex justify-between items-center mb-5 pb-2 border-b border-slate-100">
          <h2 className="text-base font-black text-brand-gold uppercase tracking-wider">
            Edit Room Configuration
          </h2>
          <button 
            onClick={onClose} 
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition active:scale-95 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="text-brand-coral text-xs font-bold bg-brand-coral/10 p-3 rounded-xl border border-brand-coral/20 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSave} className="space-y-4 antialiased p-0.5">
          {/* Title Input */}
          <input
            name="title"
            type="text"
            placeholder="Room title"
            value={form.title}
            onChange={handleChange}
            required
            disabled={saving}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-brand-sage transition shadow-xs"
          />

          {/* Room Type Configure Segment */}
          <div>
            <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-2 block">Room Type</label>
            <div className="flex flex-wrap gap-2">
              {ROOM_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  disabled={saving}
                  onClick={() => setForm({ ...form, room_type: type })}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition border active:scale-95 ${
                    form.room_type === type
                      ? 'bg-brand-sage border-brand-sage text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Select Parameters Section Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={handleChange}
                name="category"
                disabled={saving}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none focus:border-brand-sage transition shadow-xs"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-1 block">Occupancy</label>
              <select
                value={form.occupancy}
                onChange={handleChange}
                name="occupancy"
                disabled={saving}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none focus:border-brand-sage transition shadow-xs"
              >
                {OCCUPANCY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preferred Tenant Options */}
          <div>
            <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-1 block">Preferred Tenant</label>
            <select
              value={form.tenant_type}
              onChange={handleChange}
              name="tenant_type"
              disabled={saving}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none focus:border-brand-sage transition shadow-xs"
            >
              {TENANT_TYPES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Description Block */}
          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            disabled={saving}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-brand-sage transition shadow-xs resize-none"
          />

          {/* Rent Price Box */}
          <input
            name="price"
            type="number"
            placeholder="Price per month (₹)"
            value={form.price}
            onChange={handleChange}
            required
            disabled={saving}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-brand-sage transition shadow-xs"
          />

          {/* Facilities Integration Workspace */}
          <div>
            <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-2 block">Facilities</label>
            <div className="flex flex-wrap gap-1.5">
              {FACILITY_OPTIONS.map((facility) => (
                <button
                  type="button"
                  key={facility}
                  disabled={saving}
                  onClick={() => toggleFacility(facility)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border active:scale-95 ${
                    facilities.includes(facility)
                      ? 'bg-brand-sage border-brand-sage text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {facility}
                </button>
              ))}
            </div>
          </div>

          {/* Lazy Map Component Layer Wrapper */}
          <Suspense fallback={<div className="bg-white border border-slate-200 rounded-xl h-[200px] flex items-center justify-center text-slate-400 text-xs font-bold animate-pulse">Loading Map Layer Workspace...</div>}>
            <MapPicker
              latitude={coords.lat}
              longitude={coords.lng}
               onChange={(lat, lng, address, city) => setCoords({ lat, lng, address, city })}
            />
          </Suspense>

          {/* Capacity Settings Layout */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-1 block">Total Rooms</label>
              <input
                name="total_rooms"
                type="number"
                min={1}
                value={form.total_rooms}
                onChange={handleChange}
                disabled={saving}
                className="w-full px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-brand-sage transition"
              />
            </div>
            <div>
              <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-1 block">Available Rooms</label>
              <input
                name="available_rooms"
                type="number"
                min={0}
                value={form.available_rooms}
                onChange={handleChange}
                disabled={saving}
                className="w-full px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-brand-sage transition"
              />
            </div>
          </div>

          {/* Multi Image Update Control Block */}
          <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
            <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider block mb-1">Images Asset Pipeline</label>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={saving}
              onChange={handlePhotoSelect}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-brand-sage file:text-white file:font-bold file:text-xs file:cursor-pointer disabled:opacity-50"
            />
            {selectedPhotos.length > 0 && (
              <p className="text-[11px] text-brand-coral font-bold mt-2">✕ {selectedPhotos.length} new asset queue staged.</p>
            )}
            {room.photos?.length > 0 && !selectedPhotos.length && (
              <p className="text-[10px] text-slate-400 font-medium mt-1.5">Existing room storage arrays will remain active.</p>
            )}
          </div>

          {/* Optional Fields Contact */}
          <div>
            <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-1 block">Phone Number (optional)</label>
            <input
              name="phone_number"
              type="tel"
              placeholder="+91 9876543210"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-brand-sage transition shadow-xs"
            />
          </div>

          {uploadLabel && (
            <p className="text-xs text-brand-sage font-bold animate-pulse p-1">{uploadLabel}</p>
          )}

          {/* Trigger Button Block */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 mt-2 rounded-xl bg-brand-sage hover:opacity-90 transition text-white font-bold text-xs disabled:opacity-50 shadow-md shadow-emerald-700/10 active:scale-98"
          >
            {saving ? 'Processing Parameters...' : 'Commit Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}