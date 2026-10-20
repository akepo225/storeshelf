// StoreShelf service worker - offline-capable PWA.
const VERSION = 'v1'
const CORE = ['./', './index.html', './app.html', './pricing.html', './faq.html', './docs.html', './manifest.webmanifest', './favicon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('core-' + VERSION)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open('pages-' + VERSION).then((c) => c.put(req, copy))
          return res
        })
        .catch(() => caches.match(req).then((m) => m || caches.match('./')))
    )
    return
  }
  e.respondWith(
    caches.match(req).then(
      (m) =>
        m ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open('assets-' + VERSION).then((c) => c.put(req, copy))
          }
          return res
        })
    )
  )
})
