// Knowix Service Worker
// Strategy:
//   - Static assets (_next/static, icons, fonts): Cache First
//   - Navigation (HTML pages): Network First with offline fallback
//   - API / Firestore / external: Network Only (never cache)

const CACHE_NAME = 'knowix-v1'
const OFFLINE_URL = '/offline'

const STATIC_PATTERNS = [
  /\/_next\/static\//,
  /\/icon-/,
  /\.(?:png|svg|ico|woff2?)$/,
]

const SKIP_PATTERNS = [
  /firestore\.googleapis\.com/,
  /identitytoolkit\.googleapis\.com/,
  /generativelanguage\.googleapis\.com/,
  /\/_next\/webpack-hmr/,
  /\/api\//,
]

// ── Install: cache offline page ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([OFFLINE_URL, '/'])
    ).then(() => self.skipWaiting())
  )
})

// ── Activate: remove old caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET
  if (request.method !== 'GET') return

  // Skip external/API requests — always network only
  if (SKIP_PATTERNS.some((p) => p.test(request.url))) return

  // Static assets: Cache First
  if (STATIC_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
          }
          return response
        })
      })
    )
    return
  }

  // Navigation (HTML): Network First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached ?? caches.match(OFFLINE_URL))
      )
    )
    return
  }
})
