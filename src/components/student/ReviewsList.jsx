import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function ReviewsList({ roomId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [roomId])

  const fetchReviews = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ratings')
      .select('id, rating, comment, created_at, student_id, profiles ( full_name )')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })

    if (!error) setReviews(data || [])
    setLoading(false)
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.trim().split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')
  }

  const getTimeAgo = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays < 1) return 'Today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 30) return `${diffDays} days ago`
    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex-shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-orange-100 rounded w-1/3" />
              <div className="h-3 bg-orange-100/70 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <p className="text-slate-400 text-xs font-medium italic">
        No reviews yet. Be the first to share your experience!
      </p>
    )
  }

  const visibleReviews = showAll ? reviews : reviews.slice(0, 3)
  const withComments = reviews.filter((r) => r.comment?.trim()).length

  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
        {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        {withComments > 0 && ` · ${withComments} with comments`}
      </p>

      <div className="space-y-4">
        {visibleReviews.map((review) => (
          <div key={review.id} className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-sage to-[#5a8a6b] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {getInitials(review.profiles?.full_name)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-slate-800 font-bold text-xs truncate">
                  {review.profiles?.full_name || 'Anonymous'}
                </p>
                <span className="text-slate-400 text-[10px] font-semibold flex-shrink-0">
                  {getTimeAgo(review.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-0.5 mt-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-xs ${star <= review.rating ? 'text-amber-400' : 'text-slate-200'}`}
                  >
                    ★
                  </span>
                ))}
              </div>

              {review.comment && (
                <p className="text-slate-600 text-xs leading-relaxed mt-1.5">
                  {review.comment}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 3 && (
        <button
          onClick={() => setShowAll((prev) => !prev)}
          className="text-brand-sage text-xs font-bold uppercase tracking-wider hover:underline"
        >
          {showAll ? 'Show less' : `Show all ${reviews.length} reviews`}
        </button>
      )}
    </div>
  )
}