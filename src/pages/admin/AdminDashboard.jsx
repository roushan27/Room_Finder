import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import LogoutButton from '../../components/common/LogoutButton'
import NotificationBell from '../../components/common/NotificationBell'
import ChatInbox from '../../components/common/ChatInbox'
import { useToast } from '../../context/ToastContext'
import ClearSessionButton from '../../components/ClearSessionButton'

const ROLE_COLORS = {
  student: '#769F86',
  owner: '#C87A65',
  admin: '#A67C52',
  unknown: '#94a3b8',
}

const BOOKING_COLORS = {
  pending: '#C87A65',
  confirmed: '#769F86',
  cancelled: '#ef4444',
  unknown: '#94a3b8',
}

const PAGE_SIZE = 8

export default function AdminDashboard() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Full datasets — used only for charts/aggregates (lightweight columns)
  const [allUsersLite, setAllUsersLite] = useState([])
  const [allRoomsLite, setAllRoomsLite] = useState([])
  const [allBookingsLite, setAllBookingsLite] = useState([])
  const [counts, setCounts] = useState({ messages: 0, ratings: 0, notifications: 0, users: 0, rooms: 0, bookings: 0 })

  // Paginated table data — fetched independently, server-side
  const [usersPage, setUsersPage] = useState(0)
  const [usersRows, setUsersRows] = useState([])
  const [usersTotal, setUsersTotal] = useState(0)

  const [roomsPage, setRoomsPage] = useState(0)
  const [roomsRows, setRoomsRows] = useState([])
  const [roomsTotal, setRoomsTotal] = useState(0)

  const [ownersById, setOwnersById] = useState({})

  useEffect(() => {
    fetchAggregateData()
  }, [])

  useEffect(() => {
    fetchUsersPage(usersPage)
  }, [usersPage])

  useEffect(() => {
    fetchRoomsPage(roomsPage)
    toast.success('Dashboard refreshed!')
  }, [roomsPage])

  const fetchAggregateData = async () => {
    setLoading(true)
    setError('')

    // Lightweight column-only fetches for chart aggregation (not full row data)
    const [
      usersLiteResult,
      roomsLiteResult,
      bookingsLiteResult,
      messagesCountResult,
      ratingsCountResult,
      notificationsCountResult,
    ] = await Promise.all([
      supabase.from('profiles').select('id, full_name, role, created_at'),
      supabase.from('rooms').select('id, owner_id, is_active, available_rooms, total_rooms, avg_rating, total_ratings, price, created_at'),
      supabase.from('bookings').select('id, room_id, status, created_at'),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('ratings').select('*', { count: 'exact', head: true }),
      supabase.from('notifications').select('*', { count: 'exact', head: true }),
    ])

    const firstError =
      usersLiteResult.error ||
      roomsLiteResult.error ||
      bookingsLiteResult.error ||
      messagesCountResult.error ||
      ratingsCountResult.error ||
      notificationsCountResult.error

    if (firstError) {
      setError(firstError.message)
      toast.error('Failed to load admin data')
      setLoading(false)
      return
    }

    const users = usersLiteResult.data || []
    const rooms = roomsLiteResult.data || []
    const bookings = bookingsLiteResult.data || []

    setAllUsersLite(users)
    setAllRoomsLite(rooms)
    setAllBookingsLite(bookings)
    setOwnersById(users.reduce((map, user) => {
      map[user.id] = user
      return map
    }, {}))
    setCounts({
      messages: messagesCountResult.count || 0,
      ratings: ratingsCountResult.count || 0,
      notifications: notificationsCountResult.count || 0,
      users: users.length,
      rooms: rooms.length,
      bookings: bookings.length,
    })
    setLoading(false)
  }

  const fetchUsersPage = async (page) => {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, count, error } = await supabase
      .from('profiles')
      .select('full_name, role, phone, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!error) {
      setUsersRows(data || [])
      setUsersTotal(count || 0)
    }
  }

  const fetchRoomsPage = async (page) => {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, count, error } = await supabase
      .from('rooms')
      .select('title, owner_id, city, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!error) {
      setRoomsRows(data || [])
      setRoomsTotal(count || 0)
    }
  }

  const totalRevenue = useMemo(() => {
    return allRoomsLite.reduce((sum, room) => sum + Number(room.price || 0), 0)
  }, [allRoomsLite])

  const roleData = useMemo(() => {
    return toChartCounts(allUsersLite.map((user) => user.role || 'unknown'))
  }, [allUsersLite])

  const bookingStatusData = useMemo(() => {
    return toChartCounts(allBookingsLite.map((booking) => booking.status || 'unknown'))
  }, [allBookingsLite])

  const activityData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))
      const key = date.toISOString().slice(0, 10)
      return { key, day: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), users: 0, rooms: 0, bookings: 0 }
    })

    addActivity(days, allUsersLite, 'users')
    addActivity(days, allRoomsLite, 'rooms')
    addActivity(days, allBookingsLite, 'bookings')
    return days
  }, [allUsersLite, allRoomsLite, allBookingsLite])

  const ownerStats = useMemo(() => {
    const stats = new Map()

    for (const room of allRoomsLite) {
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
        bookings: allBookingsLite.filter((booking) => allRoomsLite.some((room) => room.id === booking.room_id && room.owner_id === owner.ownerId)).length,
      }))
      .sort((a, b) => b.rooms - a.rooms)
  }, [allBookingsLite, ownersById, allRoomsLite])

  const pendingBookings = allBookingsLite.filter((booking) => booking.status === 'pending').length

  const handleRefresh = () => {
    fetchAggregateData()
    fetchUsersPage(usersPage)
    fetchRoomsPage(roomsPage)
  }

  return (
    <div className="min-h-screen bg-brand-cream p-4 sm:p-6 text-slate-800 font-sans antialiased">
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[#A67C52] px-5 py-3 bg-white border border-orange-200/70 rounded-2xl inline-block shadow-sm">
          Admin Panel - {profile?.full_name || 'Administrator'}
        </h1>
        
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <ChatInbox />
          <NotificationBell />
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-xl bg-white text-slate-600 text-sm font-semibold transition-all shadow-[3px_4px_8px_rgba(180,120,60,0.2),-2px_-2px_5px_rgba(255,255,255,0.7)] hover:shadow-[2px_3px_5px_rgba(180,120,60,0.2),-1px_-1px_3px_rgba(255,255,255,0.7)] active:shadow-[inset_2px_2px_5px_rgba(180,120,60,0.25)] active:scale-98"
          >
            Refresh
          </button>
          <LogoutButton />
          <ClearSessionButton />
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400 font-medium">Loading admin telemetry data...</p>
      ) : error ? (
        <div className="rounded-2xl border border-orange-200 bg-orange-500/10 p-5 text-orange-800 font-semibold">
          {error}. Admin RLS policies must allow this account to read app tables.
        </div>
      ) : (
        <div className="space-y-6">
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Total Users" value={counts.users} />
            <StatCard label="Owners" value={allUsersLite.filter((user) => user.role === 'owner').length} accent="text-[#C87A65]" />
            <StatCard label="Students" value={allUsersLite.filter((user) => user.role === 'student').length} accent="text-[#769F86]" />
            <StatCard label="Rooms Listed" value={counts.rooms} accent="text-[#A67C52]" />
            <StatCard label="Active Rooms" value={allRoomsLite.filter((room) => room.is_active).length} />
            <StatCard label="Bookings" value={counts.bookings} accent="text-[#C87A65]" />
            <StatCard label="Pending Requests" value={pendingBookings} accent="text-amber-600" />
            <StatCard label="Messages" value={counts.messages} accent="text-[#769F86]" />
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
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
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
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Business Snapshot">
              <div className="space-y-4">
                <MetricRow label="Total ratings" value={counts.ratings} />
                <MetricRow label="Notifications" value={counts.notifications} />
                <MetricRow label="Available beds/rooms" value={allRoomsLite.reduce((sum, room) => sum + Number(room.available_rooms || 0), 0)} />
                <MetricRow label="Listed monthly value" value={`Rs ${totalRevenue.toLocaleString('en-IN')}`} />
              </div>
            </Panel>
          </div>

          <Panel title="7 Day Activity">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(0,0,0,0.4)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(0,0,0,0.4)" allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="users" name="Users" fill="#769F86" radius={[6, 6, 0, 0]} />
                <Bar dataKey="rooms" name="Rooms" fill="#A67C52" radius={[6, 6, 0, 0]} />
                <Bar dataKey="bookings" name="Bookings" fill="#C87A65" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Owner Related Graph">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={ownerStats.slice(0, 10)}>
                <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="ownerName" stroke="rgba(0,0,0,0.4)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(0,0,0,0.4)" allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="rooms" name="Rooms" fill="#769F86" radius={[6, 6, 0, 0]} />
                <Bar dataKey="bookings" name="Bookings" fill="#C87A65" radius={[6, 6, 0, 0]} />
                <Bar dataKey="availableRooms" name="Available" fill="#A67C52" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Panel title="All Users">
              <ServerPaginatedTable
                columns={['Name', 'Role', 'Phone', 'Joined']}
                rows={usersRows.map((user) => [
                  user.full_name || 'Unknown',
                  user.role || '-',
                  user.phone || '-',
                  formatDate(user.created_at),
                ])}
                total={usersTotal}
                page={usersPage}
                setPage={setUsersPage}
                pageSize={PAGE_SIZE}
                emptyText="No users found."
              />
            </Panel>

            <Panel title="All Rooms">
              <ServerPaginatedTable
                columns={['Room', 'Owner', 'City', 'Status']}
                rows={roomsRows.map((room) => [
                  room.title || 'Untitled',
                  ownersById[room.owner_id]?.full_name || 'Unknown',
                  room.city || '-',
                  room.is_active ? 'Active' : 'Hidden',
                ])}
                total={roomsTotal}
                page={roomsPage}
                setPage={setRoomsPage}
                pageSize={PAGE_SIZE}
                emptyText="No rooms found."
              />
            </Panel>
          </div>

          <Panel title="Owner Performance">
            <ClientPaginatedTable
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

   
    </div>
  )
}

function StatCard({ label, value, accent = 'text-slate-700' }) {
  return (
    <div className="bg-white border border-orange-200/70 rounded-2xl p-4 sm:p-5 shadow-xs">
      <p className="text-slate-400 text-xs sm:text-sm font-medium">{label}</p>
      <p className={`text-xl sm:text-2xl font-black mt-1 ${accent}`}>{value}</p>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <section className="bg-white border border-orange-200/70 rounded-2xl p-4 sm:p-5 shadow-xs">
      <h2 className="text-sm font-bold text-[#A67C52] uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </section>
  )
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0">
      <span className="text-slate-500 text-sm font-medium">{label}</span>
      <span className="text-slate-800 font-bold text-sm">{value}</span>
    </div>
  )
}

// Table row/cell rendering shared by both pagination modes
function TableBody({ columns, rows, emptyText }) {
  if (rows.length === 0) {
    return <p className="text-slate-400 text-xs font-medium">{emptyText}</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[540px] text-left">
        <thead>
          <tr className="border-b border-slate-200/80 text-slate-400 text-xs uppercase tracking-wider">
            {columns.map((column) => (
              <th key={column} className="pb-3 pr-4 font-bold">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-100 last:border-b-0 text-xs font-medium text-slate-600 hover:bg-slate-50/50 transition-colors">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="py-3.5 pr-4">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PaginationControls({ page, totalPages, start, end, total, onPrev, onNext }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
        Showing {start}-{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page === 0}
          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 text-xs font-bold flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
        >
          ‹
        </button>
        <span className="text-slate-600 text-xs font-bold min-w-[3rem] text-center">
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={onNext}
          disabled={page === totalPages - 1}
          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 text-xs font-bold flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
        >
          ›
        </button>
      </div>
    </div>
  )
}

// Server-side pagination: rows already represent only the current page (fetched via .range())
function ServerPaginatedTable({ columns, rows, emptyText, total, page, setPage, pageSize }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : page * pageSize + 1
  const end = Math.min((page + 1) * pageSize, total)

  return (
    <div>
      <TableBody columns={columns} rows={rows} emptyText={emptyText} />
      <PaginationControls
        page={page}
        totalPages={totalPages}
        start={start}
        end={end}
        total={total}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
      />
    </div>
  )
}

// Client-side pagination: full rows already in memory (used for computed/aggregated tables like Owner Performance)
function ClientPaginatedTable({ columns, rows, emptyText, pageSize = 8 }) {
  const [page, setPage] = useState(0)

  if (rows.length === 0) {
    return <p className="text-slate-400 text-xs font-medium">{emptyText}</p>
  }

  const totalPages = Math.ceil(rows.length / pageSize)
  const start = page * pageSize
  const visibleRows = rows.slice(start, start + pageSize)

  return (
    <div>
      <TableBody columns={columns} rows={visibleRows} emptyText={emptyText} />
      <PaginationControls
        page={page}
        totalPages={totalPages}
        start={start + 1}
        end={Math.min(start + pageSize, rows.length)}
        total={rows.length}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
      />
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
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  color: '#334155',
  fontSize: '12px',
  fontWeight: '600',
  boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
}