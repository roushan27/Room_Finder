import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function ChatPage() {
  const { roomId, otherUserId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [otherName, setOtherName] = useState('')
  const [loading, setLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchOtherProfile()
    fetchMessages()
    markAsRead()

    const channel = supabase
      .channel(`room-${roomId}-${otherUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
          if (payload.new.receiver_id === user.id) {
            supabase
              .from('messages')
              .update({ is_read: true, is_delivered: true })
              .eq('id', payload.new.id)
              .then(() => {})
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, otherUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null)
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [])

  const fetchOtherProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', otherUserId)
      .maybeSingle()

    setOtherName(data?.full_name || 'User')
  }

  const fetchMessages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })

    if (!error) setMessages(data)
    setLoading(false)
  }

  const markAsRead = async () => {
    await supabase
      .from('messages')
      .update({ is_read: true, is_delivered: true })
      .eq('room_id', roomId)
      .eq('sender_id', otherUserId)
      .eq('receiver_id', user.id)
      .eq('is_read', false)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!text.trim()) return

    const messageText = text
    setText('')

    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      sender_id: user.id,
      receiver_id: otherUserId,
      text: messageText,
      is_delivered: false,
      is_read: false,
    })

    if (error) alert('Message send failed: ' + error.message)
  }

  const handleDelete = async (messageId) => {
    setOpenMenuId(null)
    const { error } = await supabase.from('messages').delete().eq('id', messageId)
    if (error) {
      alert('Delete failed: ' + error.message)
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    }
  }

  const getTickStatus = (msg) => {
    if (msg.is_read) return 'read' // green double tick
    if (msg.is_delivered) return 'delivered' // grey double tick
    return 'sent' // single grey tick
  }

  const groupedMessages = messages.reduce((groups, msg, idx) => {
    const prev = messages[idx - 1]
    const isSameSenderAsPrev =
      prev &&
      prev.sender_id === msg.sender_id &&
      new Date(msg.created_at) - new Date(prev.created_at) < 5 * 60 * 1000

    if (isSameSenderAsPrev && groups.length > 0) {
      groups[groups.length - 1].push(msg)
    } else {
      groups.push([msg])
    }
    return groups
  }, [])

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-white/10 bg-white/5 backdrop-blur-xl flex-shrink-0">
        <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white text-xl">
          ←
        </button>
        <h2 className="text-white font-semibold text-sm sm:text-base truncate">{otherName || 'Chat'}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {loading ? (
          <p className="text-white/40 text-center">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-white/40 text-center">Koi message nahi hai abhi. Baat shuru karo!</p>
        ) : (
          groupedMessages.map((group, groupIdx) => {
            const isMe = group[0].sender_id === user.id
            const lastMsg = group[group.length - 1]

            return (
              <div key={groupIdx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-0.5`}>
                {group.map((msg, i) => {
                  const isFirst = i === 0
                  const isLast = i === group.length - 1

                  return (
                    <div key={msg.id} className="relative group flex items-center gap-1">
                      {isMe && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === msg.id ? null : msg.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white text-sm px-1 transition"
                        >
                          ⋮
                        </button>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-xs md:max-w-md px-3 sm:px-4 py-2 ${
                          isMe
                            ? `bg-blue-500 text-white ${isFirst ? 'rounded-t-2xl' : 'rounded-t-md'} ${
                                isLast ? 'rounded-bl-2xl rounded-br-sm' : 'rounded-b-md'
                              }`
                            : `bg-white/10 text-white ${isFirst ? 'rounded-t-2xl' : 'rounded-t-md'} ${
                                isLast ? 'rounded-br-2xl rounded-bl-sm' : 'rounded-b-md'
                              }`
                        }`}
                      >
                        <p className="text-sm break-words">{msg.text}</p>
                      </div>

                      {isMe && openMenuId === msg.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-full mr-1 top-0 bg-slate-800 border border-white/20 rounded-lg shadow-xl z-10 overflow-hidden"
                        >
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="px-4 py-2 text-red-300 text-sm hover:bg-white/10 transition whitespace-nowrap"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}

                <div className="flex items-center gap-1 px-1">
                  <p className="text-[10px] text-white/30">
                    {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {isMe && (
                    <span
                      className={`text-[11px] ${
                        getTickStatus(lastMsg) === 'read' ? 'text-green-400' : 'text-white/30'
                      }`}
                    >
                      {getTickStatus(lastMsg) === 'sent' ? '✓' : '✓✓'}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t border-white/10 bg-white/5 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 text-sm sm:text-base"
        />
        <button
          type="submit"
          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition text-sm sm:text-base"
        >
          Send
        </button>
      </form>
    </div>
  )
}
