import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const FACILITY_OPTIONS = [
  'WiFi', 'AC', 'Food/Mess', 'Laundry', 'Parking',
  'Power Backup', 'Attached Bathroom', 'Furnished', 'Water Supply', 'CCTV'
]

const ROOM_TYPES = ['1BHK', '2BHK', 'Independent']

export default function AddRoomForm({ onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    price: '',
    total_rooms: 1,
    available_rooms: 1,
    room_type: '1BHK',
  })
  const [facilities, setFacilities] = useState([])
  const [photos, setPhotos] = useState([])
  const [videos, setVideos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const toggleFacility = (facility) => {
    setFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    )
  }

  const uploadFiles = async (files, bucket) => {
    const urls = []
    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      urls.push(data.publicUrl)
    }
    return urls
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setUploading(true)

    try {
      const photoUrls = photos.length ? await uploadFiles(photos, 'room-photos') : []
      const videoUrls = videos.length ? await uploadFiles(videos, 'room-videos') : []

      const { error: insertError } = await supabase.from('rooms').insert({
        owner_id: user.id,
        title: form.title,
        description: form.description,
        address: form.address,
        city: form.city,
        price: parseFloat(form.price),
        total_rooms: parseInt(form.total_rooms),
        available_rooms: parseInt(form.available_rooms),
        room_type: form.room_type,
        facilities,
        photos: photoUrls,
        videos: videoUrls,
      })

      if (insertError) throw insertError

      setForm({
        title: '', description: '', address: '', city: '',
        price: '', total_rooms: 1, available_rooms: 1, room_type: '1BHK',
      })
      setFacilities([])
      setPhotos([])
      setVideos([])

      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 space-y-4">
      <h2 className="text-xl font-bold text-white mb-2">Add New Room</h2>

      {error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">{error}</p>}

      <input
        name="title"
        placeholder="Room Title (e.g. Sunrise PG for Boys)"
        value={form.title}
        onChange={handleChange}
        required
        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
      />

      <div>
        <label className="text-white/60 text-sm mb-2 block">Room Type</label>
        <div className="flex gap-2">
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
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        rows={3}
        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
      />

      <input
        name="address"
        placeholder="Full Address"
        value={form.address}
        onChange={handleChange}
        required
        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          name="city"
          placeholder="City"
          value={form.city}
          onChange={handleChange}
          required
          className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
        />
        <input
          name="price"
          type="number"
          placeholder="Price per month (₹)"
          value={form.price}
          onChange={handleChange}
          required
          className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
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

      <div>
        <label className="text-white/60 text-sm mb-1 block">Photos</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setPhotos(Array.from(e.target.files))}
          className="w-full text-white/60 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white"
        />
        {photos.length > 0 && <p className="text-white/40 text-xs mt-1">{photos.length} photo(s) selected</p>}
      </div>

      <div>
        <label className="text-white/60 text-sm mb-1 block">Videos (optional)</label>
        <input
          type="file"
          accept="video/*"
          multiple
          onChange={(e) => setVideos(Array.from(e.target.files))}
          className="w-full text-white/60 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white"
        />
        {videos.length > 0 && <p className="text-white/40 text-xs mt-1">{videos.length} video(s) selected</p>}
      </div>

      <button
        type="submit"
        disabled={uploading}
        className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition text-white font-semibold disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Add Room'}
      </button>
    </form>
  )
}
