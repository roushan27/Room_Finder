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
      .single()
    if (data) setOtherName(data.full_name)
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
    if (msg.is_read) return 'read'
    if (msg.is_delivered) return 'delivered'
    return 'sent'
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
    <div className="h-screen bg-[#fdeee0] flex flex-col font-sans antialiased text-slate-800">
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-[#b5451a] to-[#e8792e] px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-white/15 text-white transition-all outline-none font-bold"
        >
          ←
        </button>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white truncate">{otherName || 'Chat'}</h2>
          <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Room #{roomId?.slice(0, 8)}</p>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {loading ? (
          <p className="text-slate-400 text-center text-xs font-semibold">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-slate-400 text-center text-xs font-semibold">Koi message nahi hai abhi. Baat shuru karo!</p>
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
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 text-sm px-1 transition"
                        >
                          ⋮
                        </button>
                      )}

                      <div
                        className={`max-w-[80%] sm:max-w-xs md:max-w-md px-4 py-2.5 text-xs font-semibold leading-relaxed shadow-xs ${
                          isMe
                            ? `bg-[#5d8a6e] text-white ${isFirst ? 'rounded-t-2xl' : 'rounded-t-md'} ${
                                isLast ? 'rounded-bl-2xl rounded-br-sm' : 'rounded-b-md'
                              }`
                            : `bg-white border border-slate-200/60 text-slate-700 ${isFirst ? 'rounded-t-2xl' : 'rounded-t-md'} ${
                                isLast ? 'rounded-br-2xl rounded-bl-sm' : 'rounded-b-md'
                              }`
                        }`}
                      >
                        {msg.text}
                      </div>

                      {isMe && openMenuId === msg.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-full mr-1 top-0 bg-white border border-slate-200 rounded-lg shadow-xl z-10 overflow-hidden"
                        >
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="px-4 py-2 text-[#c1614a] text-xs font-bold hover:bg-red-50 transition whitespace-nowrap"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}

                <div className="flex items-center gap-1 px-1">
                  <p className="text-[10px] text-slate-400 font-medium">
                    {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {isMe && (
                    <span
                      className={`text-[11px] ${
                        getTickStatus(lastMsg) === 'read' ? 'text-[#5d8a6e] font-bold' : 'text-slate-400'
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
      </main>

      {/* Input */}
      <footer className="w-full bg-white border-t border-slate-100 p-3 sticky bottom-0 flex-shrink-0">
        <form onSubmit={sendMessage} className="max-w-xl mx-auto flex gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-grow px-4 py-2.5 bg-[#fdeee0] border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5d8a6e] transition-all"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#c1614a] hover:opacity-90 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  )
}
