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
          // If the incoming message is meant for me, mark it read immediately since chat is open
          if (payload.new.receiver_id === user.id) {
            supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id).then(() => {})
          }
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
    // Mark all messages sent TO me from the other user, in this room, as read
    await supabase
      .from('messages')
      .update({ is_read: true })
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
    })

    if (error) alert('Message send failed: ' + error.message)
  }

  // Group consecutive messages from the same sender (Instagram-style)
  const groupedMessages = messages.reduce((groups, msg, idx) => {
    const prev = messages[idx - 1]
    const isSameSenderAsPrev =
      prev &&
      prev.sender_id === msg.sender_id &&
      new Date(msg.created_at) - new Date(prev.created_at) < 5 * 60 * 1000 // within 5 min

    if (isSameSenderAsPrev && groups.length > 0) {
      groups[groups.length - 1].push(msg)
    } else {
      groups.push([msg])
    }
    return groups
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <button
          onClick={() => navigate(-1)}
          className="text-white/60 hover:text-white text-xl"
        >
          ←
        </button>
        <h2 className="text-white font-semibold">{otherName || 'Chat'}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                    <div
                      key={msg.id}
                      className={`max-w-xs md:max-w-md px-4 py-2 ${
                        isMe
                          ? `bg-blue-500 text-white ${isFirst ? 'rounded-t-2xl' : 'rounded-t-md'} ${
                              isLast ? 'rounded-bl-2xl rounded-br-sm' : 'rounded-b-md'
                            }`
                          : `bg-white/10 text-white ${isFirst ? 'rounded-t-2xl' : 'rounded-t-md'} ${
                              isLast ? 'rounded-br-2xl rounded-bl-sm' : 'rounded-b-md'
                            }`
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  )
                })}
                {/* Timestamp + read status only on the last message of the group */}
                <div className="flex items-center gap-1 px-1">
                  <p className="text-[10px] text-white/30">
                    {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {isMe && (
                    <span className="text-[10px] text-white/30">
                      {lastMsg.is_read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
        />
        <button
          type="submit"
          className="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition"
        >
          Send
        </button>
      </form>
    </div>
  )
}
