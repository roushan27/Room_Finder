import { useState, useRef, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import RatingForm from './RatingForm'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { useToast } from '../../context/ToastContext'

const RoomMapView = lazy(() => import('./RoomMapView'))

export default function RoomDetailModal({ room, onClose, guestMode = false }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  useModalBackButton(true, onClose)
  const [activeIdx, setActiveIdx] = useState(0)
  const [loadedImages, setLoadedImages] = useState({})
  const [playingVideo, setPlayingVideo] = useState(false)
  const [booking, setBooking] = useState(false)
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

    const { error } = await supabase.from('bookings').insert({
      room_id: room.id,
      student_id: user.id,
      check_in: new Date().toISOString().split('T')[0],
      status: 'pending',
      payment_status: 'unpaid',
    })

    if (error) toast.error('Error: ' + error.message)
    else toast.success('Booking request bhej di gayi! Owner confirm karega.')
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 sm:p-4 antialiased text-slate-800">
      <div className="bg-brand-cream border border-orange-200/70 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Media Block Vault */}
        <div
          className="relative h-60 sm:h-72 bg-orange-50 flex items-center justify-center overflow-hidden border-b border-orange-200/60"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ scrollBehavior: 'smooth' }}
        >
          {mediaCount > 0 ? (
            activeMedia.type === 'photo' ? (
              <>
                {!loadedImages[activeIdx] && (
                   <div className="absolute inset-0 flex items-center justify-center bg-orange-50 overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, rgba(0,0,0,0.02) 25%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.02) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                      }}
                    />
                  </div>
                )}
                <img
                  key={activeIdx}
                  src={activeMedia.url}
                  alt={room.title}
                  onLoad={() => setLoadedImages((prev) => ({ ...prev, [activeIdx]: true }))}
                  className={`w-full h-full object-cover select-none transition-opacity duration-300 ${
                    loadedImages[activeIdx] ? 'opacity-100' : 'opacity-0'
                  }`}
                  draggable={false}
                />
              </>
            ) : playingVideo ? (
              <video src={activeMedia.url} controls autoPlay className="w-full h-full object-contain bg-slate-950" />
            ) : (
              <button
                onClick={() => setPlayingVideo(true)}
                className="relative w-full h-full flex items-center justify-center bg-orange-50 group"
              >
                <span className="absolute bottom-4 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                  Tap to load video content
                </span>
                <span className="w-14 h-14 rounded-full bg-white border border-orange-200 flex items-center justify-center text-xl text-brand-sage shadow-sm group-hover:scale-105 transition-transform pl-1">
                  ▶
                </span>
              </button>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium text-xs uppercase tracking-wider">
              No Asset Media Available
            </div>
          )}

          {/* Core Dismissal Anchor */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/90 text-slate-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white shadow-xs border border-slate-200/50 font-bold text-xs transition z-10"
          >
            ✕
          </button>

          {mediaCount > 1 && (
            <>
              <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 border border-slate-200/50 text-slate-700 w-8 h-8 rounded-full flex items-center justify-center shadow-2xs hover:bg-white font-bold transition">‹</button>
              <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 border border-slate-200/50 text-slate-700 w-8 h-8 rounded-full flex items-center justify-center shadow-2xs hover:bg-white font-bold transition">›</button>
              <span className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider">
                {activeIdx + 1} / {mediaCount}
              </span>
            </>
          )}
        </div>

        {/* Swipe Thumbnails Pipeline */}
        {mediaCount > 1 && (
          <div className="flex gap-2 overflow-x-auto p-4 bg-orange-50 border-b border-orange-200/60 scroll-smooth">
            {mediaItems.map((item, i) => (
              <button
                key={i}
                onClick={() => goToIndex(i)}
                className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition ${
                  i === activeIdx ? 'border-brand-sage opacity-100' : 'border-orange-200 opacity-60 hover:opacity-90'
                }`}
              >
                {item.type === 'photo' ? (
                  <img src={item.url} alt={`Thumb ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-600 text-xs font-bold">▶</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Descriptive Information Field */}
        <div className="p-5 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div>
             <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{room.title}</h2>
<p className="text-slate-400 text-xs font-medium tracking-wide mt-1 uppercase">{room.city}</p>
            </div>
            {room.avg_rating > 0 && (
              <span className="text-amber-500 font-black text-sm sm:text-base border border-amber-100 bg-amber-50/50 px-3 py-1 rounded-xl flex items-center gap-1.5 self-start">
                ★ {room.avg_rating.toFixed(1)} <span className="text-slate-400 font-bold text-xs">({room.total_ratings})</span>
              </span>
            )}
          </div>

          <div className="bg-[#faead2] border border-orange-200/60 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-brand-gold font-bold text-[10px] uppercase tracking-wider">Financial Assessment</p>
              <p className="text-xl font-black text-slate-900 mt-0.5 tracking-tight">
                ₹{room.price.toLocaleString('en-IN')}<span className="text-slate-400 font-medium text-xs">/month</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-brand-gold font-bold text-[10px] uppercase tracking-wider">Availability</p>
              <p className="text-xs font-black text-brand-sage mt-1">
                {room.available_rooms} of {room.total_rooms} Rooms free
              </p>
            </div>
          </div>

          {room.description && (
            <div className="space-y-1.5">
              <h4 className="text-brand-gold font-bold text-[11px] uppercase tracking-wider">Overview</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{room.description}</p>
            </div>
          )}

          {/* Spatial Mapping Box */}
          <div className="space-y-2">
            <h4 className="text-brand-gold font-bold text-[11px] uppercase tracking-wider">Spatial Location</h4>
            <Suspense fallback={<div className="bg-orange-50 border border-orange-200 rounded-2xl h-[220px] flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-wider animate-pulse">Loading map viewport...</div>}>
              <div className="rounded-2xl overflow-hidden border border-orange-200 shadow-2xs">
                <RoomMapView room={room} />
              </div>
            </Suspense>
          </div>

          {room.facilities?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-brand-gold font-bold text-[11px] uppercase tracking-wider">Available Amenities</h4>
              <div className="flex flex-wrap gap-1.5">
                {room.facilities.map((f) => (
                  <span key={f} className="px-3 py-1 rounded-xl bg-white border border-orange-200/60 text-slate-600 text-xs font-semibold">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {room.phone_number && (
            <div className="space-y-2 pt-1">
              <h4 className="text-brand-gold font-bold text-[11px] uppercase tracking-wider">Contact Details</h4>
              {guestMode || !user ? (
                <button
                  onClick={requireLogin}
                 className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-orange-200 text-slate-500 text-xs font-bold uppercase tracking-wider hover:bg-orange-50 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Login to view contact number
                </button>
              ) : (
                <a href={`tel:${room.phone_number}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-sage/5 border border-brand-sage/20 text-brand-sage text-xs font-black uppercase tracking-wider hover:bg-brand-sage/10 transition shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {room.phone_number}
                </a>
              )}
            </div>
          )}

          {showLoginPrompt && (
            <div className="bg-brand-coral/5 border border-brand-coral/20 rounded-2xl p-4 text-center space-y-3 shadow-2xs">
              <p className="text-slate-700 text-xs font-bold">Booking ya chat karne ke liye authentication zaroori hai</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => navigate('/login')} className="px-4 py-1.5 rounded-xl bg-brand-sage text-white text-xs font-bold uppercase tracking-wider shadow-2xs">Log In</button>
                <button onClick={() => navigate('/signup?role=student')} className="px-4 py-1.5 rounded-xl bg-white border border-orange-200 text-slate-600 text-xs font-bold uppercase tracking-wider shadow-2xs">Sign Up</button>
              </div>
            </div>
          )}

          

          {/* Action Trigger Deck */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleBook}
              disabled={booking || room.available_rooms === 0}
              className="flex-1 py-3 rounded-xl bg-brand-sage text-white text-xs font-black uppercase tracking-wider hover:opacity-95 transition disabled:opacity-40 active:scale-98 shadow-2xs"
            >
              {room.available_rooms === 0 ? 'Fully Booked' : booking ? 'Processing...' : 'Book Asset Now'}
            </button>
            <button 
              onClick={handleChat} 
              className="px-6 py-3 rounded-xl bg-white border border-orange-200 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-orange-50 transition active:scale-98 shadow-2xs"
            >
              💬 Chat
            </button>
          </div>

          {!guestMode && user && <RatingForm roomId={room.id} />}
        </div>
      </div>
    </div>
  )
}