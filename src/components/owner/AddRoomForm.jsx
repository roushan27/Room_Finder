import { useState, useEffect, lazy, Suspense } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { compressImage } from '../../utils/imageCompress'
import { useToast } from '../../context/ToastContext'

const MapPicker = lazy(() => import('./MapPicker'))

const FACILITY_OPTIONS = [
  'WiFi', 'AC', 'Food/Mess', 'Laundry', 'Parking',
  'Power Backup', 'Attached Bathroom', 'Furnished', 'Water Supply', 'CCTV',
  'Study Table', 'Wardrobe', 'Private Bathroom','Housekeeping'
]

const ROOM_TYPES = ['1BHK', '2BHK', '3BHK', 'Independent']
const CATEGORIES = ['PG', 'Hostel', 'Flat', 'House', 'Shared Room']
const OCCUPANCY_OPTIONS = ['Single', 'Double', 'Triple', 'Any']
const TENANT_TYPES = ['Students', 'Working Professionals', 'Families', 'Anyone']

export default function AddRoomForm({ onSuccess }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({
    title: '', description: '', city: '', price: '',
    total_rooms: 1, available_rooms: 1, room_type: '1BHK',
    category: 'PG', occupancy: 'Single', tenant_type: 'Students',
    phone_number: '',
  })
  const [coords, setCoords] = useState({ lat: null, lng: null, address: '',city: '' })
  const [facilities, setFacilities] = useState([])
  const [photos, setPhotos] = useState([])
  const [videos, setVideos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [uploadLabel, setUploadLabel] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('addRoomDraft')
    if (saved) {
      try {
        const draft = JSON.parse(saved)
        if (draft.form) setForm((prev) => ({ ...prev, ...draft.form }))
        if (draft.facilities) setFacilities(draft.facilities)
        if (draft.coords) setCoords(draft.coords)
      } catch {
        // ignore corrupt draft
      }
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return
    sessionStorage.setItem('addRoomDraft', JSON.stringify({ form, facilities, coords }))
  }, [form, facilities, coords, user?.id])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sessionStorage.setItem('addRoomDraft', JSON.stringify({ form, facilities, coords }))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [form, facilities, coords])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const toggleFacility = (facility) => {
    setFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    )
  }

  const handlePhotoSelect = (e) => {
    const newFiles = Array.from(e.target.files)
    if (newFiles.length > 0) setPhotos((prev) => [...prev, ...newFiles])
    e.target.value = ''
  }

  const handleVideoSelect = (e) => {
    const newFiles = Array.from(e.target.files)
    if (newFiles.length > 0) setVideos((prev) => [...prev, ...newFiles])
    e.target.value = ''
  }

  const uploadFilesWithProgress = async (files, bucket, startPercent, endPercent, label, compress) => {
    const urls = []
    const range = endPercent - startPercent

    for (let i = 0; i < files.length; i++) {
      let file = files[i]

      if (compress) {
        setUploadLabel(`Compressing ${label.toLowerCase()} ${i + 1} of ${files.length}...`)
        try {
          file = await compressImage(file)
        } catch {
          // fallback
        }
      }

      setUploadLabel(`${label} ${i + 1} of ${files.length}...`)

      const fileExt = compress ? 'jpg' : file.name.split('.').pop()
      const uniqueName = `${user.id}/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(uniqueName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        throw new Error(`"${file.name}" upload failed: ${uploadError.message}`)
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(uniqueName)
      urls.push(data.publicUrl)

      const currentPercent = startPercent + Math.round(((i + 1) / files.length) * range)
      setUploadPercent(currentPercent)
    }

    return urls
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!coords.lat || !coords.lng) {
      setError('Please select the room location on the map')
      return
    }
    if (parseInt(form.available_rooms) > parseInt(form.total_rooms)) {
      setError('Available rooms cannot be more than total rooms')
      return
    }
     if (form.phone_number && !/^[6-9]\d{9}$/.test(form.phone_number.trim())) {
    toast.error('Please enter a valid 10-digit phone number')
     return
    }

    setUploading(true)
    setUploadPercent(0)

    try {
      let photoUrls = []
      let videoUrls = []

      const hasPhotos = photos.length > 0
      const hasVideos = videos.length > 0

      if (hasPhotos) {
        const endPoint = hasVideos ? 70 : 90
        photoUrls = await uploadFilesWithProgress(photos, 'room-photos', 5, endPoint, 'Uploading photo', true)
      }

      if (hasVideos) {
        videoUrls = await uploadFilesWithProgress(videos, 'room-videos', hasPhotos ? 70 : 5, 90, 'Uploading video', false)
      }

      setUploadLabel('Saving room details...')
      setUploadPercent(95)

      const { error: insertError } = await supabase.from('rooms').insert({
        owner_id: user.id,
        title: form.title,
        description: form.description,
        address: coords.address,
        city: coords.city || 'Unknown',
        price: parseFloat(form.price),
        total_rooms: parseInt(form.total_rooms),
        available_rooms: parseInt(form.available_rooms),
        room_type: form.room_type,
        category: form.category,
        occupancy: form.occupancy,
        tenant_type: form.tenant_type,
        phone_number: form.phone_number || null,
        facilities,
        photos: photoUrls,
        videos: videoUrls,
        latitude: coords.lat,
        longitude: coords.lng,
      })

      if (insertError) throw insertError
      toast.success('Room listed successfully!')
      setUploadPercent(100)
      setUploadLabel('Done!')

      setTimeout(() => {
        sessionStorage.removeItem('addRoomDraft')
        setForm({ title: '', description: '', city: '', price: '', total_rooms: 1, available_rooms: 1, room_type: '1BHK', category: 'PG', occupancy: 'Single', tenant_type: 'Students', phone_number: '' })
        setCoords({ lat: null, lng: null, address: '',city: '' })
        setFacilities([])
        setPhotos([])
        setVideos([])
        setUploading(false)
        setUploadPercent(0)
        setUploadLabel('')
        if (onSuccess) onSuccess()
      }, 500)
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
      setUploading(false)
      setUploadPercent(0)
      setUploadLabel('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 antialiased max-w-2xl mx-auto p-1 text-slate-800">
      {error && (
        <p className="text-brand-coral text-xs font-bold bg-brand-coral/10 p-3 rounded-xl border border-brand-coral/20">
          {error}
        </p>
      )}

      {/* Title Input */}
      <input
        name="title"
        type="text"
        placeholder="Room title (e.g. Sunrise PG for Boys)"
        value={form.title}
        onChange={handleChange}
        required
        disabled={uploading}
        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-brand-sage transition-all shadow-xs"
      />

      {/* Room Type Configurator Selector */}
      <div>
        <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-2 block">Room Type</label>
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPES.map((type) => (
            <button
              type="button"
              key={type}
              disabled={uploading}
              onClick={() => setForm({ ...form, room_type: type })}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition border active:scale-98 ${
                form.room_type === type
                  ? 'bg-brand-sage border-brand-sage text-white shadow-md shadow-emerald-700/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Select Box Grid Layer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-1.5 block">Category</label>
          <select
            value={form.category}
            onChange={handleChange}
            name="category"
            disabled={uploading}
            className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none focus:border-brand-sage transition shadow-xs"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-1.5 block">Occupancy</label>
          <select
            value={form.occupancy}
            onChange={handleChange}
            name="occupancy"
            disabled={uploading}
            className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none focus:border-brand-sage transition shadow-xs"
          >
            {OCCUPANCY_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Preferred Tenant Option Selector */}
      <div>
        <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-1.5 block">Preferred Tenant</label>
        <select
          value={form.tenant_type}
          onChange={handleChange}
          name="tenant_type"
          disabled={uploading}
          className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none focus:border-brand-sage transition shadow-xs"
        >
          {TENANT_TYPES.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {/* Description Area */}
      <textarea
        name="description"
        placeholder="Provide clean layout descriptions about the room setup rules..."
        value={form.description}
        onChange={handleChange}
        rows={3}
        disabled={uploading}
        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-brand-sage transition-all shadow-xs resize-none"
      />

      {/* Rent Pricing Block */}
      <input
        name="price"
        type="number"
        placeholder="Price per month (₹)"
        value={form.price}
        onChange={handleChange}
        required
        disabled={uploading}
        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-brand-sage transition-all shadow-xs"
      />

      {/* Facilities Setup Block */}
      <div>
        <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-2 block">Facilities</label>
        <div className="flex flex-wrap gap-2">
          {FACILITY_OPTIONS.map((facility) => (
            <button
              type="button"
              key={facility}
              disabled={uploading}
              onClick={() => toggleFacility(facility)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border active:scale-95 ${
                facilities.includes(facility)
                  ? 'bg-brand-sage border-brand-sage text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {facility}
            </button>
          ))}
        </div>
      </div>

      {/* Map Segment Wrapper */}
      <Suspense fallback={<div className="bg-white border border-slate-200 rounded-xl h-[250px] flex items-center justify-center text-slate-400 text-xs font-bold animate-pulse">Loading Map Workspace Canvas...</div>}>
        <MapPicker
          latitude={coords.lat}
          longitude={coords.lng}
          onChange={(lat, lng, address, city) => setCoords({ lat, lng, address, city })}
        />
      </Suspense>

      {/* Rooms Capacity Quantities Grid Block */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-1 block">Total Rooms</label>
          <input
            name="total_rooms"
            type="number"
            min={1}
            value={form.total_rooms}
            onChange={handleChange}
            disabled={uploading}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-brand-sage transition shadow-xs"
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
            disabled={uploading}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-brand-sage transition shadow-xs"
          />
        </div>
      </div>

      {/* Photos Media Stream Input Area */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
        <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider block mb-0.5">
          Photos {photos.length > 0 && <span className="text-brand-coral font-black">({photos.length} selected)</span>}
        </label>
        <p className="text-slate-400 text-[10px] font-medium mb-3">Photos are automatically optimized for streaming layout performance.</p>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={handlePhotoSelect}
          className="w-full text-slate-500 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-brand-sage file:text-white file:font-bold file:text-xs disabled:opacity-50 cursor-pointer"
        />
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {photos.map((file, i) => (
              <span key={i} className="text-slate-600 text-[11px] font-bold bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                {file.name.length > 15 ? file.name.slice(0, 15) + '...' : file.name}
                {!uploading && (
                  <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))} className="text-brand-coral font-black hover:opacity-80 ml-0.5">✕</button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Videos Entry Area */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
        <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider block mb-0.5">
          Videos (optional) {videos.length > 0 && <span className="text-brand-coral font-black">({videos.length} selected)</span>}
        </label>
        <p className="text-slate-400 text-[10px] font-medium mb-3">Tip: Record at 720p or lower to balance fast media streaming speeds.</p>
        <input
          type="file"
          accept="video/*"
          multiple
          disabled={uploading}
          onChange={handleVideoSelect}
          className="w-full text-slate-500 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-brand-sage file:text-white file:font-bold file:text-xs disabled:opacity-50 cursor-pointer"
        />
        {videos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {videos.map((file, i) => (
              <span key={i} className="text-slate-600 text-[11px] font-bold bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                {file.name.length > 15 ? file.name.slice(0, 15) + '...' : file.name}
                {!uploading && (
                  <button type="button" onClick={() => setVideos((prev) => prev.filter((_, idx) => idx !== i))} className="text-brand-coral font-black hover:opacity-80 ml-0.5">✕</button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Phone Fields */}
      <div>
        <label className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-1.5 block">Phone Number (optional)</label>
        <input
          name="phone_number"
          type="tel"
          placeholder="+91 9876543210"
          value={form.phone_number}
          onChange={(e) => setForm({ ...form, phone_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
          disabled={uploading}
          className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-brand-sage transition-all shadow-xs"
        />
      </div>

      {/* Active Pipeline Progress Tracker */}
      {uploading && (
        <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-brand-sage">{uploadLabel}</span>
            <span className="text-brand-gold">{uploadPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-sage rounded-full transition-all duration-300" style={{ width: `${uploadPercent}%` }} />
          </div>
        </div>
      )}

      {/* Submit Trigger Execution block */}
      <button
        type="submit"
        disabled={uploading}
        className="w-full py-3 rounded-xl bg-brand-sage hover:opacity-90 transition text-white font-bold text-sm disabled:opacity-50 shadow-md shadow-emerald-700/10 active:scale-98"
      >
        {uploading ? `${uploadPercent}% Uploading...` : 'Add Room Layout'}
      </button>
    </form>
  )
}