import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import LogoutButton from '../../components/common/LogoutButton'
import NotificationBell from '../../components/common/NotificationBell'
import ChatInbox from '../../components/common/ChatInbox'
import Footer from '../../components/common/Footer'

const ROLE_COLORS = {
  student: '#3b82f6',
  owner: '#f59e0b',
  admin: '#10b981',
  unknown: '#94a3b8',
}

const BOOKING_COLORS = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  cancelled: '#ef4444',
  unknown: '#94a3b8',
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [counts, setCounts] = useState({ messages: 0, ratings: 0, notifications: 0 })

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    setLoading(true)
    setError('')

    const [
      usersResult,
      roomsResult,
      bookingsResult,
      messagesResult,
      ratingsResult,
      notificationsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('rooms').select('*').order('created_at', { ascending: false }),
      supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('ratings').select('*', { count: 'exact', head: true }),
      supabase.from('notifications').select('*', { count: 'exact', head: true }),
    ])

    const firstError =
      usersResult.error ||
      roomsResult.error ||
      bookingsResult.error ||
      messagesResult.error ||
      ratingsResult.error ||
      notificationsResult.error

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setUsers(usersResult.data || [])
    setRooms(roomsResult.data || [])
    setBookings(bookingsResult.data || [])
    setCounts({
      messages: messagesResult.count || 0,
      ratings: ratingsResult.count || 0,
      notifications: notificationsResult.count || 0,
    })
    setLoading(false)
  }

  const ownersById = useMemo(() => {
    return users.reduce((map, user) => {
      map[user.id] = user
      return map
    }, {})
  }, [users])

  const totalRevenue = useMemo(() => {
    return rooms.reduce((sum, room) => sum + Number(room.price || 0), 0)
  }, [rooms])

  const roleData = useMemo(() => {
    return toChartCounts(users.map((user) => user.role || 'unknown'))
  }, [users])

  const bookingStatusData = useMemo(() => {
    return toChartCounts(bookings.map((booking) => booking.status || 'unknown'))
  }, [bookings])

  const activityData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))
      const key = date.toISOString().slice(0, 10)
      return { key, day: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), users: 0, rooms: 0, bookings: 0 }
    })

    addActivity(days, users, 'users')
    addActivity(days, rooms, 'rooms')
    addActivity(days, bookings, 'bookings')
    return days
  }, [users, rooms, bookings])

  const ownerStats = useMemo(() => {
    const stats = new Map()

    for (const room of rooms) {
      const current = stats.get(room.owner_id) || {
        ownerId: room.owner_id,
        ownerName: ownersById[room.owner_id]?.full_name || 'Unknown owner',
        rooms: 0,
        activeRooms: 0,
        availableRooms: 0,
        totalRooms: 0,
        avgRatingSum: 0,
        ratedRooms: 0,
      }

      current.rooms += 1
      current.activeRooms += room.is_active ? 1 : 0
      current.availableRooms += Number(room.available_rooms || 0)
      current.totalRooms += Number(room.total_rooms || 0)
      if (Number(room.total_ratings || 0) > 0) {
        current.avgRatingSum += Number(room.avg_rating || 0)
        current.ratedRooms += 1
      }
      stats.set(room.owner_id, current)
    }

    return Array.from(stats.values())
      .map((owner) => ({
        ...owner,
        avgRating: owner.ratedRooms > 0 ? owner.avgRatingSum / owner.ratedRooms : 0,
        bookings: bookings.filter((booking) => rooms.some((room) => room.id === booking.room_id && room.owner_id === owner.ownerId)).length,
      }))
      .sort((a, b) => b.rooms - a.rooms)
  }, [bookings, ownersById, rooms])

  const recentUsers = users.slice(0, 8)
  const recentRooms = rooms.slice(0, 8)
  const pendingBookings = bookings.filter((booking) => booking.status === 'pending').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1
          className="text-xl sm:text-2xl font-bold text-white px-5 py-3 rounded-2xl inline-block"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 4px 12px rgba(16,185,129,0.15)',
          }}
        >
          Admin Panel - {profile?.full_name || 'Administrator'}
        </h1>
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <ChatInbox />
          <NotificationBell />
          <button
            onClick={fetchAdminData}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition"
          >
            Refresh
          </button>
          <LogoutButton />
        </div>
      </div>

      {loading ? (
        <p className="text-white/60">Loading admin data...</p>
      ) : error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">
          {error}. Admin RLS policies must allow this account to read app tables.
        </div>
      ) : (
        <div className="space-y-6 text-slate-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Total Users" value={users.length} />
            <StatCard label="Owners" value={users.filter((user) => user.role === 'owner').length} accent="text-amber-300" />
            <StatCard label="Students" value={users.filter((user) => user.role === 'student').length} accent="text-blue-300" />
            <StatCard label="Rooms Listed" value={rooms.length} accent="text-emerald-300" />
            <StatCard label="Active Rooms" value={rooms.filter((room) => room.is_active).length} />
            <StatCard label="Bookings" value={bookings.length} accent="text-purple-300" />
            <StatCard label="Pending Requests" value={pendingBookings} accent="text-yellow-300" />
            <StatCard label="Messages" value={counts.messages} accent="text-cyan-300" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Panel title="User Roles">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {roleData.map((entry) => (
                      <Cell key={entry.name} fill={ROLE_COLORS[entry.name] || ROLE_COLORS.unknown} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Booking Status">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={bookingStatusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {bookingStatusData.map((entry) => (
                      <Cell key={entry.name} fill={BOOKING_COLORS[entry.name] || BOOKING_COLORS.unknown} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Business Snapshot">
              <div className="space-y-4">
                <MetricRow label="Total ratings" value={counts.ratings} />
                <MetricRow label="Notifications" value={counts.notifications} />
                <MetricRow label="Available beds/rooms" value={rooms.reduce((sum, room) => sum + Number(room.available_rooms || 0), 0)} />
                <MetricRow label="Listed monthly value" value={`Rs ${totalRevenue.toLocaleString('en-IN')}`} />
              </div>
            </Panel>
          </div>

          <Panel title="7 Day Activity">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.55)" />
                <YAxis stroke="rgba(255,255,255,0.55)" allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="rooms" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="bookings" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Owner Related Graph">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={ownerStats.slice(0, 10)}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="ownerName" stroke="rgba(255,255,255,0.55)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.55)" allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="rooms" name="Rooms" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="bookings" name="Bookings" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="availableRooms" name="Available" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Panel title="Recent Users">
              <DataTable
                columns={['Name', 'Role', 'Phone', 'Joined']}
                rows={recentUsers.map((user) => [
                  user.full_name || 'Unknown',
                  user.role || '-',
                  user.phone || '-',
                  formatDate(user.created_at),
                ])}
                emptyText="No users found."
              />
            </Panel>

            <Panel title="Recent Rooms">
              <DataTable
                columns={['Room', 'Owner', 'City', 'Status']}
                rows={recentRooms.map((room) => [
                  room.title || 'Untitled',
                  ownersById[room.owner_id]?.full_name || 'Unknown',
                  room.city || '-',
                  room.is_active ? 'Active' : 'Hidden',
                ])}
                emptyText="No rooms found."
              />
            </Panel>
          </div>

          <Panel title="Owner Performance">
            <DataTable
              columns={['Owner', 'Rooms', 'Active', 'Bookings', 'Avg Rating']}
              rows={ownerStats.map((owner) => [
                owner.ownerName,
                owner.rooms,
                owner.activeRooms,
                owner.bookings,
                owner.avgRating ? owner.avgRating.toFixed(1) : 'No ratings',
              ])}
              emptyText="No owner data found."
            />
          </Panel>
        </div>
      )}

      <Footer />
    </div>
  )
}

function StatCard({ label, value, accent = 'text-white' }) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-5">
      <p className="text-white/50 text-xs sm:text-sm">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <section className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-5">
      <h2 className="text-base sm:text-lg font-semibold text-white mb-4">{title}</h2>
      {children}
    </section>
  )
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0">
      <span className="text-white/60 text-sm">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  )
}

function DataTable({ columns, rows, emptyText }) {
  if (rows.length === 0) {
    return <p className="text-white/40 text-sm">{emptyText}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[540px] text-left">
        <thead>
          <tr className="border-b border-white/10 text-white/50 text-xs">
            {columns.map((column) => (
              <th key={column} className="py-3 pr-4 font-medium">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-white/5 text-sm text-white/80">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="py-3 pr-4">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function toChartCounts(values) {
  const counts = values.reduce((map, value) => {
    map[value] = (map[value] || 0) + 1
    return map
  }, {})

  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

function addActivity(days, rows, key) {
  for (const row of rows) {
    if (!row.created_at) continue
    const dateKey = new Date(row.created_at).toISOString().slice(0, 10)
    const bucket = days.find((day) => day.key === dateKey)
    if (bucket) bucket[key] += 1
  }
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const tooltipStyle = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '10px',
  color: 'white',
}
