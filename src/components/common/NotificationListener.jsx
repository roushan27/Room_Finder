import { useBrowserNotifications } from '../../hooks/useBrowserNotifications'

export default function NotificationListener() {
  useBrowserNotifications()
  return null
}