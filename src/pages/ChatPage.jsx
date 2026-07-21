import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const TYPING_TIMEOUT_MS = 2500

export default function ChatPage() {
  const { roomId, otherUserId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [otherName, setOtherName] = useState('')
  const [loading, setLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [otherIsTyping, setOtherIsTyping] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [longPressMsgId, setLongPressMsgId] = useState(null)
  const bottomRef = useRef(null)
  const typingChannelRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const otherTypingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const isRecordingRef = useRef(false)
const pressTimerRef = useRef(null)

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
            supabase.from('messages').update({ is_read: true, is_delivered: true }).eq('id', payload.new.id).then(() => {})
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)))
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [roomId, otherUserId])

  useEffect(() => {
    const typingChannel = supabase.channel(`typing-${roomId}-${[user.id, otherUserId].sort().join('-')}`)
    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId !== user.id) {
          setOtherIsTyping(true)
          clearTimeout(otherTypingTimeoutRef.current)
          otherTypingTimeoutRef.current = setTimeout(() => setOtherIsTyping(false), TYPING_TIMEOUT_MS)
        }
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        if (payload.payload.userId !== user.id) {
          setOtherIsTyping(false)
          clearTimeout(otherTypingTimeoutRef.current)
        }
      })
      .subscribe()
    typingChannelRef.current = typingChannel
    return () => {
      clearTimeout(otherTypingTimeoutRef.current)
      clearTimeout(typingTimeoutRef.current)
      supabase.removeChannel(typingChannel)
    }
  }, [roomId, otherUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: loading ? 'auto' : 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null)
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [])

  const fetchOtherProfile = async () => {
    const { data } = await supabase.from('profiles').select('full_name').eq('id', otherUserId).single()
    if (data) setOtherName(data.full_name)
  }

  const fetchMessages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    if (!error) setMessages(data)
    setLoading(false)
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }))
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

  const handleTextChange = (e) => {
    setText(e.target.value)
    typingChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id } })
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      typingChannelRef.current?.send({ type: 'broadcast', event: 'stop_typing', payload: { userId: user.id } })
    }, TYPING_TIMEOUT_MS)
  }

  const stopTypingNow = () => {
    clearTimeout(typingTimeoutRef.current)
    typingChannelRef.current?.send({ type: 'broadcast', event: 'stop_typing', payload: { userId: user.id } })
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    const messageText = text
    setText('')
    stopTypingNow()

    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      sender_id: user.id,
      receiver_id: otherUserId,
      text: messageText,
      message_type: 'text',
      is_delivered: false,
      is_read: false,
    })
    if (error) toast.error('Message send failed: ' + error.message)
  }

  const uploadAndSendMedia = async (blob, type, extension) => {
    setUploading(true)
    try {
      const fileName = `${user.id}/${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage.from('chat-media').upload(fileName, blob, {
        contentType: blob.type,
        upsert: false,
      })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('chat-media').getPublicUrl(fileName)

      const { error: insertError } = await supabase.from('messages').insert({
        room_id: roomId,
        sender_id: user.id,
        receiver_id: otherUserId,
        text: type === 'image' ? '📷 Photo' : '🎤 Voice message',
        media_url: data.publicUrl,
        message_type: type,
        is_delivered: false,
        is_read: false,
      })
      if (insertError) throw insertError
    } catch (err) {
      toast.error('Failed to send: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    uploadAndSendMedia(file, 'image', file.name.split('.').pop() || 'jpg')
    e.target.value = ''
  }

  const startRecording = async (e) => {
    e.preventDefault()
    if (isRecordingRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: mimeType })
          uploadAndSendMedia(blob, 'audio', mimeType.includes('webm') ? 'webm' : 'm4a')
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      isRecordingRef.current = true
      setRecording(true)
    } catch (err) {
      toast.error('Microphone access denied or unavailable')
    }
  }

  const stopRecording = (e) => {
    e.preventDefault()
    if (!isRecordingRef.current) return
    isRecordingRef.current = false
    setRecording(false)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const handleDelete = async (messageId) => {
    setOpenMenuId(null)
   const { error, count } = await supabase
   .from('messages')
   .delete({ count: 'exact' })
   .eq('id', messageId)
   .eq('sender_id', user.id)
    if (error) {
      toast.error('Delete failed: ' + error.message)
      } else if (count === 0) {
     toast.error('You can only delete your own messages')
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
    const isSameSenderAsPrev = prev && prev.sender_id === msg.sender_id && new Date(msg.created_at) - new Date(prev.created_at) < 5 * 60 * 1000
    if (isSameSenderAsPrev && groups.length > 0) groups[groups.length - 1].push(msg)
    else groups.push([msg])
    return groups
  }, [])

  return (
    <div className="h-screen bg-brand-cream flex flex-col font-sans antialiased text-slate-800">
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-[#b5451a] to-[#e8792e] px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/15 text-white transition-all outline-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          {otherName?.trim().charAt(0).toUpperCase() || '?'}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-white truncate">{otherName || 'Chat'}</h2>
          <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">
            {otherIsTyping ? (
              <span className="flex items-center gap-1 normal-case font-semibold">
                typing
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-white/80 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-1 bg-white/80 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-1 bg-white/80 rounded-full animate-bounce" />
                </span>
              </span>
            ) : (
              'Room Owner'
            )}
          </p>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`h-9 w-32 rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-brand-sage/20' : 'bg-orange-100'}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <span className="text-3xl mb-2">💬</span>
            <p className="text-slate-500 text-xs font-bold">No messages yet</p>
            <p className="text-slate-400 text-[11px] font-medium mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          groupedMessages.map((group, groupIdx) => {
            const isMe = group[0].sender_id === user.id
            const lastMsg = group[group.length - 1]
            return (
              <div key={groupIdx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1`}>
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
                      onPointerDown={() => {
         if (!isMe) return
         pressTimerRef.current = setTimeout(() => {
           setLongPressMsgId(msg.id)
           if (navigator.vibrate) navigator.vibrate(30)
         }, 500)
       }}
       onPointerUp={() => clearTimeout(pressTimerRef.current)}
       onPointerLeave={() => clearTimeout(pressTimerRef.current)}
                        className={`max-w-[78%] sm:max-w-xs md:max-w-md text-[13px] font-medium leading-relaxed shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${
                          msg.message_type === 'image' ? 'p-1.5' : 'px-4 py-2.5'
                        } ${
                          isMe
                            ? `bg-brand-sage text-white ${isFirst ? 'rounded-t-2xl' : 'rounded-t-lg'} ${isLast ? 'rounded-bl-2xl rounded-br-md' : 'rounded-b-lg'}`
                            : `bg-white text-slate-700 ${isFirst ? 'rounded-t-2xl' : 'rounded-t-lg'} ${isLast ? 'rounded-br-2xl rounded-bl-md' : 'rounded-b-lg'}`
                        }`}
                      >
                        {msg.message_type === 'image' && msg.media_url ? (
                          <img src={msg.media_url} alt="Sent photo" className="rounded-xl max-w-full max-h-72 object-cover" />
                        ) : msg.message_type === 'audio' && msg.media_url ? (
                          <audio
   src={msg.media_url}
   controls
   controlsList="nodownload noplaybackrate"
   onContextMenu={(e) => e.preventDefault()}
   className="w-56 h-9"
    />
                        ) : (
                          msg.text
                        )}
                      </div>

                      {isMe && openMenuId === msg.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-full mr-1 top-0 bg-white border border-orange-200 rounded-lg shadow-xl z-10 overflow-hidden"
                        >
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="px-4 py-2 text-brand-coral text-xs font-bold hover:bg-orange-50 transition whitespace-nowrap"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                       {isMe && longPressMsgId === msg.id && (
       <div
         className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
         onClick={() => setLongPressMsgId(null)}
       >
         <div
           onClick={(e) => e.stopPropagation()}
           className="bg-white border border-orange-200/70 rounded-2xl shadow-2xl w-full max-w-xs p-5 text-center animate-in fade-in zoom-in-95 duration-150"
         >
           <p className="text-slate-800 font-bold text-sm mb-4">Delete this message?</p>
           <div className="flex gap-2">
             <button
               onClick={() => setLongPressMsgId(null)}
               className="flex-1 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider active:scale-95 transition"
             >
               Cancel
             </button>
             <button
               onClick={() => {
                 handleDelete(msg.id)
                 setLongPressMsgId(null)
               }}
               className="flex-1 py-2 rounded-xl bg-brand-coral text-white text-xs font-black uppercase tracking-wider active:scale-95 transition shadow-2xs"
             >
               Delete
             </button>
           </div>
         </div>
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
                    <span className={`text-[11px] ${getTickStatus(lastMsg) === 'read' ? 'text-brand-sage font-bold' : 'text-slate-400'}`}>
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
      <footer className="w-full bg-white border-t border-orange-100 p-3 sticky bottom-0 flex-shrink-0">
        <form onSubmit={sendMessage} className="max-w-xl mx-auto flex gap-2 items-center">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || recording}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-slate-400 hover:text-brand-sage transition disabled:opacity-40"
            aria-label="Attach photo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <input
            type="text"
            placeholder="Type your message..."
            value={text}
            onChange={handleTextChange}
            disabled={recording}
            className="flex-grow px-4 py-2.5 bg-slate-100 rounded-full text-[13px] text-slate-800 placeholder-slate-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-sage/30 transition-all disabled:opacity-50"
          />

          {text.trim() ? (
            <button
              type="submit"
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-brand-sage hover:opacity-90 active:scale-90 text-white rounded-full transition-all shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerLeave={(e) => recording && stopRecording(e)}
              disabled={uploading}
              className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all shadow-md active:scale-90 touch-none select-none ${
                recording ? 'bg-brand-coral animate-pulse' : 'bg-brand-sage hover:opacity-90'
              } text-white disabled:opacity-40`}
              aria-label="Hold to record voice message"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </button>
          )}
        </form>
        {recording && (
          <p className="text-center text-brand-coral text-[10px] font-bold mt-2 uppercase tracking-wider animate-pulse">
            Recording... release to send
          </p>
        )}
      </footer>
    </div>
  )
}