import { useState, useEffect, lazy, Suspense } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { compressImage } from '../../utils/imageCompress'

const MapPicker = lazy(() => import('./MapPicker'))

const FACILITY_OPTIONS = [
  'WiFi', 'AC', 'Food/Mess', 'Laundry', 'Parking',
  'Power Backup', 'Attached Bathroom', 'Furnished', 'Water Supply', 'CCTV'
]

const ROOM_TYPES = ['1BHK', '2BHK', 'Independent']

export default function AddRoomForm({ onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: '', description: '', city: '', price: '',
    total_rooms: 1, available_rooms: 1, room_type: '1BHK',
  })
  const [coords, setCoords] = useState({ lat: null, lng: null, address: '' })
  const [facilities, setFacilities] = useState([])
  const [photos, setPhotos] = useState([])
  const [videos, setVideos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [uploadLabel, setUploadLabel] = useState('')
  const [error, setError] = useState('')

  // Restore any draft saved before the tab was minimized/reloaded
useEffect(() => {
  const saved = sessionStorage.getItem('addRoomDraft')
  if (saved) {
    try {
      const draft = JSON.parse(saved)
      if (draft.form) setForm(draft.form)
      if (draft.facilities) setFacilities(draft.facilities)
      if (draft.coords) setCoords(draft.coords)
    } catch {
      // ignore corrupt draft
    }
  }
}, [])

// Save draft continuously so it survives minimize/reload (text fields, facilities, map pin)
useEffect(() => {
  sessionStorage.setItem('addRoomDraft', JSON.stringify({ form, facilities, coords }))
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
          // if compression fails for any reason, fall back to original file
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
  city: coords.address ? coords.address.split(',').slice(-3, -2)[0]?.trim() || 'Unknown' : 'Unknown',
        price: parseFloat(form.price),
        total_rooms: parseInt(form.total_rooms),
        available_rooms: parseInt(form.available_rooms),
        room_type: form.room_type,
        facilities,
        photos: photoUrls,
        videos: videoUrls,
        latitude: coords.lat,
        longitude: coords.lng,
      })

      if (insertError) throw insertError

      setUploadPercent(100)
      setUploadLabel('Done!')

      setTimeout(() => {
        sessionStorage.removeItem('addRoomDraft')
        setForm({ title: '', description: '', city: '', price: '', total_rooms: 1, available_rooms: 1, room_type: '1BHK' })
        setCoords({ lat: null, lng: null, address: '' })
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
      setUploading(false)
      setUploadPercent(0)
      setUploadLabel('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">{error}</p>}

      <input
        name="title"
        placeholder="Room Title (e.g. Sunrise PG for Boys)"
        value={form.title}
        onChange={handleChange}
        required
        disabled={uploading}
        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 disabled:opacity-50"
      />

      <div>
        <label className="text-white/60 text-sm mb-2 block">Room Type</label>
        <div className="flex gap-2">
          {ROOM_TYPES.map((type) => (
            <button
              type="button"
              key={type}
              disabled={uploading}
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

      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        rows={3}
        disabled={uploading}
        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 disabled:opacity-50"
      />
  <input
  name="price"
  type="number"
  placeholder="Price per month (₹)"
  value={form.price}
  onChange={handleChange}
  required
  disabled={uploading}
  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 disabled:opacity-50"
/>
      

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
            disabled={uploading}
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
            disabled={uploading}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label className="text-white/60 text-sm mb-2 block">Facilities</label>
        <div className="flex flex-wrap gap-2">
          {FACILITY_OPTIONS.map((facility) => (
            <button
              type="button"
              key={facility}
              disabled={uploading}
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

      <div>
        <label className="text-white/60 text-sm mb-1 block">
          Photos {photos.length > 0 && <span className="text-blue-300 font-semibold">({photos.length} selected)</span>}
        </label>
        <p className="text-white/30 text-xs mb-1.5">Photos are automatically compressed for faster loading.</p>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={handlePhotoSelect}
          className="w-full text-white/60 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white disabled:opacity-50"
        />
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {photos.map((file, i) => (
              <span key={i} className="text-white/40 text-xs bg-white/5 px-2 py-1 rounded flex items-center gap-1">
                {file.name.length > 15 ? file.name.slice(0, 15) + '...' : file.name}
                {!uploading && (
                  <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300">✕</button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="text-white/60 text-sm mb-1 block">
          Videos (optional) {videos.length > 0 && <span className="text-blue-300 font-semibold">({videos.length} selected)</span>}
        </label>
        <p className="text-white/30 text-xs mb-1.5">Tip: record at 720p or lower for faster loading — large videos slow down viewing.</p>
        <input
          type="file"
          accept="video/*"
          multiple
          disabled={uploading}
          onChange={handleVideoSelect}
          className="w-full text-white/60 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white disabled:opacity-50"
        />
        {videos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {videos.map((file, i) => (
              <span key={i} className="text-white/40 text-xs bg-white/5 px-2 py-1 rounded flex items-center gap-1">
                {file.name.length > 15 ? file.name.slice(0, 15) + '...' : file.name}
                {!uploading && (
                  <button type="button" onClick={() => setVideos((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300">✕</button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-blue-300">{uploadLabel}</span>
            <span className="text-blue-300 font-semibold">{uploadPercent}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300 shadow-lg shadow-blue-500/50" style={{ width: `${uploadPercent}%` }} />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={uploading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 transition text-white font-semibold disabled:opacity-50 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
      >
        {uploading ? `${uploadPercent}% Uploading...` : 'Add Room'}
      </button>
    </form>
  )
}
