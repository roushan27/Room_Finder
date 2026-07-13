import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function RoomTable({ refreshTrigger, onEdit }) {
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRooms()
  }, [refreshTrigger])

  const fetchRooms = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setRooms(data)
    setLoading(false)
  }

  const handleDelete = async (roomId, roomTitle) => {
    const confirmed = window.confirm(`Delete "${roomTitle}"? This action cannot be undone.`)
    if (!confirmed) return

    const { error } = await supabase.from('rooms').delete().eq('id', roomId)
    if (error) {
      alert('Delete failed: ' + error.message)
    } else {
      setRooms((prev) => prev.filter((r) => r.id !== roomId))
    }
  }

  const toggleActive = async (roomId, currentStatus) => {
    const { error } = await supabase
      .from('rooms')
      .update({ is_active: !currentStatus })
      .eq('id', roomId)

    if (!error) {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, is_active: !currentStatus } : r))
      )
    }
  }

  if (loading) {
    return (
      <p className="text-slate-400 font-bold text-xs tracking-wider animate-pulse py-4">
        Loading inventory arrays...
      </p>
    )
  }
  
  if (error) {
    return (
      <p className="text-brand-coral text-xs font-bold bg-brand-coral/10 p-3 rounded-xl border border-brand-coral/20">
        {error}
      </p>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-[#fbe4c8] border border-orange-200 rounded-xl p-8 text-slate-500 text-xs font-semibold text-center">
        No rooms have been added yet. Start by clicking the "+ Add Room" configuration trigger.
      </div>
    )
  }

  return (
    <div className="bg-[#fbe4c8] border border-orange-200 rounded-xl overflow-hidden antialiased">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-orange-200/50 text-[#b5451a] font-black text-[11px] uppercase tracking-wider">
              <th className="p-4">Asset</th>
              <th className="p-4">Title</th>
              <th className="p-4">City</th>
              <th className="p-4">Pricing</th>
              <th className="p-4">Metrics</th>
              <th className="p-4">Visibility</th>
              <th className="p-4 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-200/50 text-slate-700 text-xs font-medium">
            {rooms.map((room) => (
              <tr key={room.id} className="hover:bg-orange-200/30 transition">
                <td className="p-4">
                  {room.photos?.[0] ? (
                    <img
                      src={room.photos[0]}
                      alt={room.title}
                      className="w-12 h-12 object-cover rounded-xl border border-orange-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-orange-100 border border-orange-200 rounded-xl flex items-center justify-center text-orange-400 font-bold text-[10px] uppercase tracking-tight text-center">
                      No Media
                    </div>
                  )}
                </td>
                <td className="p-4 font-black text-slate-800 text-sm tracking-tight">
                  {room.title}
                </td>
                <td className="p-4 text-slate-600 font-semibold">{room.city}</td>
                <td className="p-4 font-bold text-slate-900">
                  ₹{room.price.toLocaleString('en-IN')}<span className="text-[10px] text-slate-500 font-medium">/mo</span>
                </td>
                <td className="p-4">
                  {room.total_ratings > 0 ? (
                    <span className="flex items-center gap-1 font-bold text-slate-800">
                      ⭐ {room.avg_rating?.toFixed(1)} 
                      <span className="text-[10px] text-slate-500 font-normal">({room.total_ratings})</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 font-normal text-[11px]">Unrated</span>
                  )}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleActive(room.id, room.is_active)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition active:scale-95 border ${
                      room.is_active
                        ? 'bg-brand-sage text-white border-brand-sage'
                        : 'bg-white text-slate-400 border-slate-300'
                    }`}
                  >
                    {room.is_active ? 'Active' : 'Hidden'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(room)}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition active:scale-95 shadow-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(room.id, room.title)}
                      className="px-4 py-2 rounded-xl bg-white border border-brand-coral/30 text-brand-coral font-bold text-xs hover:bg-brand-coral/5 transition active:scale-95"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}