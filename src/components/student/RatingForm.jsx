import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function RatingForm({ roomId, onSubmitted }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [existingRating, setExistingRating] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a star rating allocation')
      return
    }
    setSaving(true)
    setError('')

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
      setError(error.message)
      setSaving(false)
      return
    }

    setComment('')
    setSuccess(true)
    setSaving(false)

    if (onSubmitted) onSubmitted()

    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-4 shadow-2xs antialiased text-slate-800">
      <h4 className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-3">
        {existingRating ? 'Modify Asset Evaluation' : 'Submit Room Rating Feedback'}
      </h4>

      {error && (
        <p className="text-brand-coral text-xs font-bold mb-2 bg-brand-coral/5 border border-brand-coral/20 px-3 py-2 rounded-xl">
          ⚠ {error}
        </p>
      )}
      {success && (
        <p className="text-brand-sage text-xs font-bold mb-2 bg-brand-sage/5 border border-brand-sage/20 px-3 py-2 rounded-xl">
          Feedback logged successfully! ✅
        </p>
      )}

      {/* Interactive Star Cluster Matrix */}
      <div className="flex gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-2xl transition-all duration-150 transform hover:scale-110 focus:outline-none filter saturate-120"
          >
            {star <= (hoverRating || rating) ? (
              <span className="text-amber-400 drop-shadow-3xs">★</span>
            ) : (
              <span className="text-slate-200 hover:text-slate-300">☆</span>
            )}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Provide optional qualitative details regarding your experience..."
        rows={2}
        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-brand-sage transition mb-3 shadow-inner"
      />

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full sm:w-auto px-5 py-2 rounded-xl bg-brand-sage text-white text-xs font-bold hover:opacity-90 transition disabled:opacity-50 active:scale-95 shadow-2xs uppercase tracking-wider"
      >
        {saving ? 'Processing...' : existingRating ? 'Update Rating Matrix' : 'Post Evaluation'}
      </button>
    </div>
  )
}