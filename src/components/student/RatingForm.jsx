import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function RatingForm({ roomId, onSubmitted }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [existingRating, setExistingRating] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkExistingRating()
  }, [roomId])

  const checkExistingRating = async () => {
    const { data } = await supabase
      .from('ratings')
      .select('*')
      .eq('room_id', roomId)
      .eq('student_id', user.id)
      .maybeSingle()

    if (data) {
      setExistingRating(data)
      setRating(data.rating)
      setComment(data.comment || '')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Please select a star rating')
      return
    }
    setSaving(true)

    const { error } = await supabase.from('ratings').upsert(
      {
        room_id: roomId,
        student_id: user.id,
        rating,
        comment,
      },
      { onConflict: 'room_id,student_id' }
    )

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    toast.success(existingRating ? 'Review updated!' : 'Thanks for your review!')
    setSaving(false)
     setRating(0)
 setComment('')
 setExistingRating(null)
    if (onSubmitted) onSubmitted()
  }

  return (
    <div className="bg-white border border-orange-200/70 rounded-2xl p-5 mt-4 shadow-2xs antialiased text-slate-800">
      <h4 className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-3">
        {existingRating ? 'Update Your Review' : 'Rate This Room'}
      </h4>

      {/* Interactive Star Cluster */}
      <div className="flex gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-2xl transition-all duration-150 transform hover:scale-110 focus:outline-none"
          >
            {star <= (hoverRating || rating) ? (
              <span className="text-amber-400 drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)]">★</span>
            ) : (
              <span className="text-slate-200 hover:text-slate-300">☆</span>
            )}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this room..."
        rows={2}
        className="w-full px-3 py-2.5 rounded-xl bg-orange-50/50 text-slate-800 placeholder-slate-400 text-xs font-medium focus:outline-none transition mb-3 shadow-[inset_2px_2px_5px_rgba(180,120,60,0.15),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] focus:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]"
      />

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-sage text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95 shadow-[3px_4px_8px_rgba(20,60,30,0.3),-2px_-2px_5px_rgba(255,255,255,0.2)] hover:shadow-[2px_3px_5px_rgba(20,60,30,0.3),-1px_-1px_3px_rgba(255,255,255,0.2)]"
      >
        {saving ? 'Submitting...' : existingRating ? 'Update Review' : 'Submit Review'}
      </button>
    </div>
  )
}