import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useBrowserNotifications() {
  const { user } = useAuth()
  const permissionAsked = useRef(false)

  useEffect(() => {
    if (!user?.id) return

    // Ask for notification permission once per session
    if (!permissionAsked.current && 'Notification' in window && Notification.permission === 'default') {
      permissionAsked.current = true
      Notification.requestPermission()
    }

    const channel = supabase
      .channel(`browser-notify-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        async (payload) => {
          const msg = payload.new

          // Don't notify for messages the user sent to themselves (safety) or if tab is focused
          if (msg.sender_id === user.id) return
          if (document.visibilityState === 'visible') return
          if (!('Notification' in window) || Notification.permission !== 'granted') return

          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', msg.sender_id)
            .single()

          const senderName = senderProfile?.full_name || 'New message'

          const notification = new Notification(senderName, {
            body: msg.text || 'Sent you a message',
            icon: '/logo.png',
            tag: `msg-${msg.room_id}-${msg.sender_id}`,
          })

          notification.onclick = () => {
            window.focus()
            window.location.href = `/chat/${msg.room_id}/${msg.sender_id}`
            notification.close()
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])
}