const CACHE = 'stilberater-v21'
const CDN_CACHE = 'stilberater-cdn-v1'
// Determine base path from the SW's own location (e.g. /Stilberater/)
const BASE = self.registration.scope

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll([BASE, BASE + 'index.html']))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== CDN_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)

  // Cache AI model files from CDN indefinitely — files are content-addressed
  // by hash so they never change. After first download: instant local load.
  if (url.hostname === 'staticimgly.com') {
    e.respondWith(
      caches.open(CDN_CACHE).then(async cache => {
        const cached = await cache.match(e.request)
        if (cached) return cached
        const response = await fetch(e.request)
        if (response.ok) cache.put(e.request, response.clone())
        return response
      })
    )
    return
  }

  if (url.origin !== location.origin) return

  // For HTML navigation: network first, fall back to cached index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => r.ok ? r : caches.match(BASE + 'index.html').then(cached => cached || r))
        .catch(() => caches.match(BASE + 'index.html').then(r => r || caches.match(BASE)))
    )
    return
  }

  // For all other assets: cache-first with network fallback
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request)
      const networkFetch = fetch(e.request).then(resp => {
        if (resp.ok) cache.put(e.request, resp.clone())
        return resp
      }).catch(() => cached)
      return cached || networkFetch
    })
  )
})

self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  self.registration.showNotification(data.title || 'Stilberater', {
    body: data.body || 'Dein Outfit des Tages wartet!',
    icon: BASE + 'icon-192.png',
    badge: BASE + 'icon-192.png',
  })
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  clients.openWindow(BASE)
})
