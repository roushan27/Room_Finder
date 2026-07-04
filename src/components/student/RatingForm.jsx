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
    // Comment box intentionally left empty on reload
  }
}
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a star rating')
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

    // Reset the message/comment area after successful submit
    setComment('')
    setSuccess(true)
    setSaving(false)

    if (onSubmitted) onSubmitted()

    // Auto-hide success message after 3 seconds
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
      <h4 className="text-white font-medium mb-3">
        {existingRating ? 'Update your rating' : 'Rate this room'}
      </h4>

      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
      {success && <p className="text-green-400 text-sm mb-2">Thanks for your feedback! ✅</p>}

      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-2xl transition"
          >
            {star <= (hoverRating || rating) ? '⭐' : '☆'}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)"
        rows={2}
        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-400 mb-3"
      />

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition disabled:opacity-50"
      >
        {saving ? 'Saving...' : existingRating ? 'Update Rating' : 'Submit Rating'}
      </button>
    </div>
  )
}
