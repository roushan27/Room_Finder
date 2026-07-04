import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#eab308']

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
        value: r.avg_rating > 0 ? r.avg_rating : 0.1, // small value so 0-rated rooms still show a sliver
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

  if (loading) return <p className="text-white/60">Loading stats...</p>

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5">
          <p className="text-white/50 text-sm">Total Rooms</p>
          <p className="text-3xl font-bold text-white mt-1">{summary.totalRooms}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5">
          <p className="text-white/50 text-sm">Total Bookings</p>
          <p className="text-3xl font-bold text-blue-300 mt-1">{summary.totalBookings}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5">
          <p className="text-white/50 text-sm">Average Rating</p>
          <p className="text-3xl font-bold text-yellow-400 mt-1">⭐ {summary.avgRating}</p>
        </div>
      </div>

      {/* Donut chart */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Ratings by Room</h3>
        {data.length === 0 ? (
          <p className="text-white/40 text-sm">No rooms yet to show data</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                label={({ name }) => name}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15,23,42,0.9)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                }}
                formatter={(value) => value.toFixed(1) + ' ⭐'}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
