import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import BottomNav from '../components/common/BottomNav'
import Footer from '../components/common/Footer'

const LONG_PRESS_MS = 550

export default function Messages() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [longPressKey, setLongPressKey] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const pressTimer = useRef(null)

  useEffect(() => {
    if (user?.id) fetchConversations()
  }, [user?.id])

  const fetchConversations = async () => {
    setLoading(true)

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error || !messages) {
      setLoading(false)
      return
    }

    const seen = new Map()
    for (const msg of messages) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      const key = `${msg.room_id}-${otherId}`
      if (!seen.has(key)) {
        seen.set(key, { ...msg, otherId, unread: msg.receiver_id === user.id && !msg.is_read })
      }
    }
    const convoList = Array.from(seen.values())

    const otherIds = [...new Set(convoList.map((c) => c.otherId))]
    const roomIds = [...new Set(convoList.map((c) => c.room_id))]

    const [profilesResult, roomsResult] = await Promise.all([
      otherIds.length > 0
        ? supabase.from('profiles').select('id, full_name').in('id', otherIds)
        : Promise.resolve({ data: [] }),
      roomIds.length > 0
        ? supabase.from('rooms').select('id, title, photos').in('id', roomIds)
        : Promise.resolve({ data: [] }),
    ])

    const profiles = profilesResult.data || []
    const rooms = roomsResult.data || []

    const enriched = convoList.map((c) => ({
      ...c,
      otherName: profiles?.find((p) => p.id === c.otherId)?.full_name || 'Unknown',
      roomTitle: rooms?.find((r) => r.id === c.room_id)?.title || 'Room',
      roomPhoto: rooms?.find((r) => r.id === c.room_id)?.photos?.[0] || null,
    }))

    enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setConversations(enriched)
    setLoading(false)
  }

  const openChat = (convo) => {
    if (longPressKey) return
    navigate(`/chat/${convo.room_id}/${convo.otherId}`)
  }

  const startPress = (key) => {
    pressTimer.current = setTimeout(() => {
      setLongPressKey(key)
      if (navigator.vibrate) navigator.vibrate(30)
    }, LONG_PRESS_MS)
  }

  const cancelPress = () => {
    clearTimeout(pressTimer.current)
  }

  const confirmDelete = (convo) => {
    setDeleteTarget(convo)
    setLongPressKey(null)
  }

  const handleDeleteConversation = async () => {
    if (!deleteTarget) return
    const convo = deleteTarget

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('room_id', convo.room_id)
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${convo.otherId}),and(sender_id.eq.${convo.otherId},receiver_id.eq.${user.id})`
      )

    if (error) {
      toast.error('Could not delete conversation')
    } else {
      toast.success('Conversation deleted')
      setConversations((prev) => prev.filter((c) => `${c.room_id}-${c.otherId}` !== `${convo.room_id}-${convo.otherId}`))
    }
    setDeleteTarget(null)
  }

  return (
    <div className="min-h-screen bg-brand-cream antialiased text-slate-800 pb-20 sm:pb-0">
      {/* Header banner */}
      <div className="bg-gradient-to-b from-[#e8792e] to-[#f4a565] px-4 sm:px-6 py-5 sm:py-6">
        <div className="max-w-3xl w-full mx-auto flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition flex-shrink-0"
            aria-label="Go back"
          >
            ←
          </button>
          <h1 className="text-base sm:text-2xl font-semibold text-white tracking-tight">
            Messages
          </h1>
        </div>
      </div>

      <div className="max-w-3xl w-full mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse bg-white rounded-2xl p-3 border border-orange-200/60">
                <div className="w-14 h-14 rounded-xl bg-orange-100 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 bg-orange-100 rounded w-1/3" />
                  <div className="h-3 bg-orange-100/70 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-[#fbe4c8] border border-orange-200 rounded-2xl p-10 text-center">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {conversations.map((c) => {
              const key = `${c.room_id}-${c.otherId}`
              return (
                <button
                  key={key}
                  onClick={() => openChat(c)}
                  onMouseDown={() => startPress(key)}
                  onMouseUp={cancelPress}
                  onMouseLeave={cancelPress}
                  onTouchStart={() => startPress(key)}
                  onTouchEnd={cancelPress}
                   className={`relative w-full text-left flex gap-3 bg-white rounded-2xl p-3 border transition-all active:scale-[0.98] select-none ${
                    longPressKey === key ? 'border-brand-coral shadow-lg scale-[0.98]' : 'border-orange-200/60'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-orange-50 flex-shrink-0">
                    {c.roomPhoto ? (
                      <img src={c.roomPhoto} alt={c.roomTitle} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-[9px] font-bold uppercase">
                        No Photo
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-slate-800 font-bold text-sm flex items-center gap-1.5 min-w-0 truncate">
                        {c.unread && <span className="w-2 h-2 bg-brand-coral rounded-full flex-shrink-0" />}
                        {c.otherName}
                      </p>
                      <p className="text-slate-400 text-[10px] font-medium flex-shrink-0">
                        {new Date(c.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <p className="text-brand-sage text-[11px] font-semibold mt-0.5 truncate">{c.roomTitle}</p>
                    <p className="text-slate-500 text-xs mt-1 truncate font-medium">{c.text}</p>
                  </div>

                  {longPressKey === key && (
                    <div
                      className="absolute inset-0 bg-slate-900/5 rounded-2xl flex items-center justify-end pr-4"
                      onClick={(e) => {
                        e.stopPropagation()
                        confirmDelete(c)
                      }}
                    >
                      <span className="bg-brand-coral text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-md">
                        🗑️ Delete
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteTarget(null)}
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

            <h3 className="text-slate-800 font-black text-base mb-1.5">Delete conversation?</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
              All messages with "<span className="font-bold text-slate-700">{deleteTarget.otherName}</span>" will be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
                className="flex-1 py-2.5 rounded-xl bg-brand-coral text-white text-xs font-black uppercase tracking-wider hover:opacity-90 transition active:scale-95 shadow-2xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 max-w-3xl w-full mx-auto">
        <Footer />
      </div>
      <BottomNav />
    </div>
  )
}