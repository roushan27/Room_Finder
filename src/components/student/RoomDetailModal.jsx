import { useState, useRef, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import RatingForm from './RatingForm'
import { useModalBackButton } from '../../hooks/useModalBackButton'
const RoomMapView = lazy(() => import('./RoomMapView'))

export default function RoomDetailModal({ room, onClose, guestMode = false }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  useModalBackButton(true, onClose)
  const [activeIdx, setActiveIdx] = useState(0)
  const [playingVideo, setPlayingVideo] = useState(false)
  const [booking, setBooking] = useState(false)
  const [bookingMsg, setBookingMsg] = useState('')
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const touchStartX = useRef(null)

  const requireLogin = () => setShowLoginPrompt(true)

  const mediaItems = [
    ...(room.photos || []).map((url) => ({ type: 'photo', url })),
    ...(room.videos || []).map((url) => ({ type: 'video', url })),
  ]
  const mediaCount = mediaItems.length
  const activeMedia = mediaItems[activeIdx]

  const handleBook = async () => {
    if (guestMode || !user) {
      requireLogin()
      return
    }
    setBooking(true)
    setBookingMsg('')

    const { error } = await supabase.from('bookings').insert({
      room_id: room.id,
      student_id: user.id,
      check_in: new Date().toISOString().split('T')[0],
      status: 'pending',
      payment_status: 'unpaid',
    })

    if (error) setBookingMsg('Error: ' + error.message)
    else setBookingMsg('Booking request bhej di gayi! Owner confirm karega.')
    setBooking(false)
  }

  const handleChat = () => {
    if (guestMode || !user) {
      requireLogin()
      return
    }
    navigate(`/chat/${room.id}/${room.owner_id}`)
  }

  const goToIndex = (idx) => {
    setActiveIdx(idx)
    setPlayingVideo(false)
  }

  const goPrev = () => goToIndex(activeIdx === 0 ? mediaCount - 1 : activeIdx - 1)
  const goNext = () => goToIndex(activeIdx === mediaCount - 1 ? 0 : activeIdx + 1)

  // Swipe gesture support — swipe left/right on the media area to change photo/video
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-slate-900/95 border border-white/20 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        <div
  className="relative h-56 sm:h-64 bg-black flex items-center justify-center overflow-hidden"
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
  style={{ scrollBehavior: 'smooth' }}
>
          {mediaCount > 0 ? (
            activeMedia.type === 'photo' ? (
              <img
  key={activeIdx}
  src={activeMedia.url}
  alt={room.title}
  className="w-full h-full object-cover select-none transition-opacity duration-300 animate-[fadeIn_0.3s_ease-in-out]"
  draggable={false}
/>
            ) : playingVideo ? (
              <video src={activeMedia.url} controls autoPlay className="w-full h-full object-contain bg-black" />
            ) : (
              // Video not loaded until tapped — saves bandwidth, faster initial load
              <button
                onClick={() => setPlayingVideo(true)}
                className="relative w-full h-full flex items-center justify-center bg-slate-800"
              >
                <span className="absolute inset-0 flex items-center justify-center text-white/40 text-xs">
                  Tap to load video
                </span>
                <span className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl text-white z-10">
                  ▶
                </span>
              </button>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">No media available</div>
          )}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/80 z-10"
          >
            ✕
          </button>

          {mediaCount > 1 && (
            <>
              <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/70">‹</button>
              <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/70">›</button>
              <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">{activeIdx + 1} / {mediaCount}</span>
            </>
          )}
        </div>

        {mediaCount > 1 && (
          <div className="flex gap-2 overflow-x-auto p-3 bg-black/20 scroll-smooth" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
            {mediaItems.map((item, i) => (
              <button
                key={i}
                onClick={() => goToIndex(i)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                  i === activeIdx ? 'border-blue-400 opacity-100' : 'border-white/10 opacity-60 hover:opacity-90'
                }`}
              >
                {item.type === 'photo' ? (
                  <img src={item.url} alt={`Media ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-lg">▶</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{room.title}</h2>
            {room.avg_rating > 0 && (
              <span className="text-yellow-400 font-medium text-sm sm:text-base">⭐ {room.avg_rating.toFixed(1)} ({room.total_ratings})</span>
            )}
          </div>

          <p className="text-white/50 mb-3 text-sm">{room.city}</p>
          <p className="text-blue-300 text-lg sm:text-xl font-semibold mb-4">₹{room.price}/month</p>

          {room.description && <p className="text-white/70 mb-4 text-sm sm:text-base">{room.description}</p>}

          <p className="text-white/50 mb-4 text-sm sm:text-base">{room.available_rooms} of {room.total_rooms} rooms available</p>

          <div className="mb-4">
            <h4 className="text-white/60 text-sm mb-2">Location</h4>
            <Suspense fallback={<div className="bg-white/5 rounded-xl h-[220px] flex items-center justify-center text-white/30 text-sm">Loading map...</div>}>
              <RoomMapView room={room} />
            </Suspense>
          </div>

          {room.facilities?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-white/60 text-sm mb-2">Facilities</h4>
              <div className="flex flex-wrap gap-2">
                {room.facilities.map((f) => (
                  <span key={f} className="px-3 py-1 rounded-lg bg-white/10 text-white/80 text-xs sm:text-sm">{f}</span>
                ))}
              </div>
            </div>
          )}

          {showLoginPrompt && (
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 mb-4 text-center">
              <p className="text-white text-sm mb-3">Booking ya chat karne ke liye login karna zaroori hai</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => navigate('/login')} className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition">Log In</button>
                <button onClick={() => navigate('/signup?role=student')} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition">Sign Up</button>
              </div>
            </div>
          )}

          {bookingMsg && <p className="text-sm mb-3 p-2 rounded-lg bg-blue-500/10 text-blue-300">{bookingMsg}</p>}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleBook}
              disabled={booking || room.available_rooms === 0}
              className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition text-white font-semibold disabled:opacity-50"
            >
              {room.available_rooms === 0 ? 'Fully Booked' : booking ? 'Booking...' : 'Book Now'}
            </button>
            <button onClick={handleChat} className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition">💬 Chat</button>
          </div>

          {!guestMode && user && <RatingForm roomId={room.id} />}
        </div>
      </div>
    </div>
  )
}
