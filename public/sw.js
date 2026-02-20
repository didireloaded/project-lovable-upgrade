// DriveLink Service Worker — push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'DriveLink', {
      body:    data.body,
      icon:    data.icon ?? '/favicon.ico',
      badge:   '/favicon.ico',
      vibrate: [200, 100, 200],
      data:    data.data,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
