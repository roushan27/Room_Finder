import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useModalBackButton } from '../../hooks/useModalBackButton'

const FACILITY_OPTIONS = [
  'WiFi', 'AC', 'Food/Mess', 'Laundry', 'Parking',
  'Power Backup', 'Attached Bathroom', 'Furnished', 'Water Supply', 'CCTV'
]

const ROOM_TYPES = ['1BHK', '2BHK', 'Independent']

export default function EditRoomModal({ room, onClose, onUpdated }) {
  useModalBackButton(true, onClose)
  const [form, setForm] = useState({
    title: room.title,
    description: room.description || '',
    address: room.address,
    city: room.city,
    price: room.price,
    total_rooms: room.total_rooms,
    available_rooms: room.available_rooms,
    room_type: room.room_type || '1BHK',
  })
  const [facilities, setFacilities] = useState(room.facilities || [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const toggleFacility = (facility) => {
    setFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    )
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

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
        facilities,
      })
      .eq('id', room.id)

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      onUpdated()
      onClose()
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
