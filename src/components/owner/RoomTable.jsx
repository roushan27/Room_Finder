import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function RoomTable({ refreshTrigger, onEdit }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

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

  const confirmDelete = (room) => setDeleteTarget(room)
  const cancelDelete = () => setDeleteTarget(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)

    const { error } = await supabase.from('rooms').delete().eq('id', deleteTarget.id)

    if (error) {
      toast.error('Delete failed: ' + error.message)
    } else {
      setRooms((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      toast.success(`"${deleteTarget.title}" deleted successfully`)
    }
    setDeleting(false)
    setDeleteTarget(null)
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
    <>
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
                        onClick={() => confirmDelete(room)}
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={cancelDelete}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-orange-200/70 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="w-14 h-14 rounded-full bg-brand-coral/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-brand-coral" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <h3 className="text-slate-800 font-black text-base mb-1.5">Delete this room?</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
              "<span className="font-bold text-slate-700">{deleteTarget.title}</span>" will be permanently removed. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-brand-coral text-white text-xs font-black uppercase tracking-wider hover:opacity-90 transition active:scale-95 disabled:opacity-50 shadow-2xs"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}