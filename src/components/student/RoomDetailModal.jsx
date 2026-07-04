import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import RatingForm from './RatingForm'

export default function RoomDetailModal({ room, onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeImg, setActiveImg] = useState(0)
  const [booking, setBooking] = useState(false)
  const [bookingMsg, setBookingMsg] = useState('')

  const handleBook = async () => {
    setBooking(true)
    setBookingMsg('')

    const { error } = await supabase.from('bookings').insert({
      room_id: room.id,
      student_id: user.id,
      check_in: new Date().toISOString().split('T')[0],
      status: 'pending',
      payment_status: 'unpaid',
    })

    if (error) {
      setBookingMsg('Error: ' + error.message)
    } else {
      setBookingMsg('Booking request bhej di gayi! Owner confirm karega.')
    }
    setBooking(false)
  }

  const handleChat = () => {
    navigate(`/chat/${room.id}/${room.owner_id}`)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/95 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="relative h-64 bg-white/5">
          {room.photos?.length > 0 ? (
            <img
              src={room.photos[activeImg]}
              alt={room.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              No photo available
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/80"
          >
            ✕
          </button>

          {room.photos?.length > 1 && (
            <div className="absolute bottom-3 left-3 flex gap-1">
              {room.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-2 h-2 rounded-full ${i === activeImg ? 'bg-blue-400' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-2xl font-bold text-white">{room.title}</h2>
            {room.avg_rating > 0 && (
              <span className="text-yellow-400 font-medium">
                ⭐ {room.avg_rating.toFixed(1)} ({room.total_ratings})
              </span>
            )}
          </div>

          <p className="text-white/60 mb-1">📍 {room.address}, {room.city}</p>
          <p className="text-blue-300 text-xl font-semibold mb-4">₹{room.price}/month</p>

          {room.description && (
            <p className="text-white/70 mb-4">{room.description}</p>
          )}

          <p className="text-white/50 mb-4">
            {room.available_rooms} of {room.total_rooms} rooms available
          </p>

          {room.facilities?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-white/60 text-sm mb-2">Facilities</h4>
              <div className="flex flex-wrap gap-2">
                {room.facilities.map((f) => (
                  <span key={f} className="px-3 py-1 rounded-lg bg-white/10 text-white/80 text-sm">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {room.videos?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-white/60 text-sm mb-2">Videos</h4>
              <video src={room.videos[0]} controls className="w-full rounded-xl" />
            </div>
          )}

          {bookingMsg && (
            <p className="text-sm mb-3 p-2 rounded-lg bg-blue-500/10 text-blue-300">
              {bookingMsg}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleBook}
              disabled={booking || room.available_rooms === 0}
              className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition text-white font-semibold disabled:opacity-50"
            >
              {room.available_rooms === 0 ? 'Fully Booked' : booking ? 'Booking...' : 'Book Now'}
            </button>
            <button
              onClick={handleChat}
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
            >
              💬 Chat
            </button>
          </div>

          <RatingForm roomId={room.id} />
        </div>
      </div>
    </div>
  )
}
