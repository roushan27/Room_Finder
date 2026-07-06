import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function ChatInbox() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [openMenuKey, setOpenMenuKey] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    checkUnread()

    const channel = supabase
      .channel(`inbox-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        () => setHasUnread(true)
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
        setOpenMenuKey(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkUnread = async () => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false)

    setHasUnread((count || 0) > 0)
  }

  const markAllAsRead = async () => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false)

    setHasUnread(false)
  }

  const fetchConversations = async () => {
    setLoading(true)

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(100)

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

    const [{ data: profiles }, { data: rooms }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', otherIds),
      supabase.from('rooms').select('id, title').in('id', roomIds),
    ])

    const enriched = convoList.map((c) => ({
      ...c,
      otherName: profiles?.find((p) => p.id === c.otherId)?.full_name || 'Unknown',
      roomTitle: rooms?.find((r) => r.id === c.room_id)?.title || 'Room',
    }))

    enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setConversations(enriched)
    setLoading(false)
  }

  const openChat = (convo) => {
    setOpen(false)
    navigate(`/chat/${convo.room_id}/${convo.otherId}`)
  }

  const handleToggle = () => {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) {
      fetchConversations()
      markAllAsRead()
    }
  }

  // Deletes the ENTIRE conversation (all messages between me and this person in this room)
  const handleDeleteConversation = async (convo, e) => {
    e.stopPropagation()
    setOpenMenuKey(null)

    const confirmed = window.confirm(`Delete conversation with ${convo.otherName}? This removes all messages permanently.`)
    if (!confirmed) return

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('room_id', convo.room_id)
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${convo.otherId}),and(sender_id.eq.${convo.otherId},receiver_id.eq.${user.id})`
      )

    if (error) {
      alert('Delete failed: ' + error.message)
    } else {
      setConversations((prev) => prev.filter((c) => `${c.room_id}-${c.otherId}` !== `${convo.room_id}-${convo.otherId}`))
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
      >
        <span className="text-base sm:text-lg">💬</span>
        {hasUnread && (
          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-400 rounded-full border-2 border-slate-900" />
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-80 max-h-96 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-white font-semibold text-sm">Messages</h3>
          </div>

          {loading ? (
            <p className="text-white/40 text-sm text-center py-8">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">No conversations yet</p>
          ) : (
            <div className="divide-y divide-white/5">
              {conversations.map((c) => {
                const key = `${c.room_id}-${c.otherId}`
                return (
                  <div key={key} className="relative group">
                    <button
                      onClick={() => openChat(c)}
                      className="w-full text-left p-3 pr-10 hover:bg-white/5 transition"
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-white font-medium text-sm flex items-center gap-1.5 min-w-0 truncate">
                          {c.unread && <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />}
                          {c.otherName}
                        </p>
                        <p className="text-white/30 text-[10px] flex-shrink-0">
                          {new Date(c.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <p className="text-white/40 text-xs mt-0.5 truncate">{c.roomTitle}</p>
                      <p className="text-white/50 text-xs mt-1 truncate">{c.text}</p>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuKey(openMenuKey === key ? null : key)
                      }}
                      className="absolute top-3 right-2 text-white/40 hover:text-white text-sm px-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      ⋮
                    </button>

                    {openMenuKey === key && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-9 right-2 bg-slate-800 border border-white/20 rounded-lg shadow-xl z-10 overflow-hidden"
                      >
                        <button
                          onClick={(e) => handleDeleteConversation(c, e)}
                          className="px-4 py-2 text-red-300 text-sm hover:bg-white/10 transition whitespace-nowrap"
                        >
                          🗑️ Delete conversation
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
