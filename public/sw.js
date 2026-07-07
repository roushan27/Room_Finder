self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  self.registration.showNotification(data.title || 'Room Finder', {
    body: data.body || 'You have a new update',
    icon: '/icon.png',
    badge: '/icon.png',
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'))
})