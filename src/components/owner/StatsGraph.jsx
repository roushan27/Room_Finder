import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

// Calibrated to fit soft minimal tokens: brand-sage, brand-gold, slate neutrals, and brand-coral accent variations
const COLORS = ['#658872', '#CBB26A', '#475569', '#E07A5F', '#818CF8', '#94A3B8', '#F43F5E', '#34D399']

export default function StatsGraph({ refreshTrigger }) {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [summary, setSummary] = useState({ totalRooms: 0, totalBookings: 0, avgRating: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [refreshTrigger])

  const fetchStats = async () => {
    setLoading(true)

    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, title, avg_rating, total_ratings')
      .eq('owner_id', user.id)

    if (rooms) {
      const chartData = rooms.map((r) => ({
        name: r.title.length > 14 ? r.title.slice(0, 14) + '...' : r.title,
        value: r.avg_rating > 0 ? r.avg_rating : 0.1, // small sliver fallback
      }))
      setData(chartData)

      const roomIds = rooms.map((r) => r.id)
      let totalBookings = 0
      if (roomIds.length > 0) {
        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('room_id', roomIds)
        totalBookings = count || 0
      }

      const ratedRooms = rooms.filter((r) => r.total_ratings > 0)
      const avgRating =
        ratedRooms.length > 0
          ? ratedRooms.reduce((sum, r) => sum + r.avg_rating, 0) / ratedRooms.length
          : 0

      setSummary({
        totalRooms: rooms.length,
        totalBookings,
        avgRating: avgRating.toFixed(1),
      })
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <p className="text-slate-400 font-bold text-xs tracking-wider animate-pulse py-4">
        Aggregating analytics data...
      </p>
    )
  }

  return (
    <div className="space-y-6 antialiased text-slate-800">
      
      {/* Structural Minimalist Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <p className="text-brand-gold font-bold text-[11px] uppercase tracking-wider">Total Rooms</p>
          <p className="text-3xl font-black text-slate-800 mt-1 tracking-tight">{summary.totalRooms}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <p className="text-brand-gold font-bold text-[11px] uppercase tracking-wider">Total Bookings</p>
          <p className="text-3xl font-black text-slate-800 mt-1 tracking-tight">{summary.totalBookings}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <p className="text-brand-gold font-bold text-[11px] uppercase tracking-wider">Average Rating</p>
          <p className="text-3xl font-black text-brand-sage mt-1 tracking-tight flex items-center gap-1.5">
            <span className="text-xl">⭐</span> {summary.avgRating}
          </p>
        </div>
      </div>

      {/* Analytics Chart Block Canvas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <h3 className="text-brand-gold font-bold text-[11px] uppercase tracking-wider mb-5 pb-2 border-b border-slate-100">
          Ratings Distribution by Asset
        </h3>
        {data.length === 0 ? (
          <p className="text-slate-400 text-xs font-semibold py-4 text-center">
            No dynamic telemetry metrics recorded yet.
          </p>
        ) : (
          <div className="w-full" style={{ minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  label={({ name }) => name}
                  labelLine={false}
                  className="focus:outline-none"
                >
                  {data.map((_, index) => (
                    <Cell 
                      key={index} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="#ffffff" 
                      strokeWidth={2}
                      className="focus:outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#1e293b',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                  formatter={(value) => [`${value.toFixed(1)} ⭐`, 'Rating Allocation']}
                />
                <Legend 
                  wrapperStyle={{ 
                    fontSize: '11px', 
                    fontWeight: '600',
                    color: '#475569',
                    paddingTop: '10px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}