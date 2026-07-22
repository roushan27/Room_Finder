import { supabase } from './supabaseClient'

/**
 * Logs a room engagement event (view, call_click, chat_click, book_click).
 * Fails silently — analytics should never break the user's experience.
 */
export async function logRoomEvent(roomId, eventType, userId = null) {
  try {
    await supabase.from('room_events').insert({
      room_id: roomId,
      event_type: eventType,
      viewer_id: userId || null,
    })
  } catch {
    // silent — analytics is best-effort only
  }
}