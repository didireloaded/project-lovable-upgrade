const CACHE_NAME = 'drivelink-v1'
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.json',
]

// Install — pre-cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET and Supabase API calls
  if (event.request.method !== 'GET') return
  if (url.hostname.includes('supabase')) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        // Cache successful responses for same-origin
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      }).catch(() => cached) // Offline: return cached version

      return cached || networkFetch
    })
  )
})

// Push notifications
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