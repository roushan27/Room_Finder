import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    checkUnread()

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
          setHasUnread(true)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkUnread = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setHasUnread((count || 0) > 0)
  }

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (data) setNotifications(data)
  }

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setHasUnread(false)
  }

  const handleToggle = () => {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) {
      fetchNotifications()
      markAllAsRead()
    }
  }

  const handleDelete = async (id) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (!error) setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleClearAll = async () => {
    const ids = notifications.map((n) => n.id)
    if (ids.length === 0) return
    const { error } = await supabase.from('notifications').delete().in('id', ids)
    if (!error) setNotifications([])
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
      >
        <span className="text-base sm:text-lg">🔔</span>
        {hasUnread && (
          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-pink-500 rounded-full border-2 border-slate-900" />
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-80 max-h-96 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50">
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <h3 className="text-white font-semibold text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-white/40 text-xs hover:text-red-300 transition"
              >
                Clear all
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">No notifications yet</p>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex justify-between items-start gap-2 p-3 hover:bg-white/5 transition group"
                >
                  <div className="min-w-0">
                    <p className="text-white/90 text-sm">{n.message}</p>
                    <p className="text-white/30 text-xs mt-1">
                      {new Date(n.created_at).toLocaleString([], {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="text-white/40 hover:text-red-400 transition text-sm flex-shrink-0"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
