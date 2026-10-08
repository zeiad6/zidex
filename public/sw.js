// ZeidexSoft service worker — an installable, offline-capable PWA.
//
// Policy (deliberately lean; every rule has a reason):
//   • never touch /tg/, /api/ or /admin/ — webhook traffic and admin auth must
//     always hit the network, and none of it belongs in a browser cache;
//   • navigations: network-first. A deploy is visible the moment the visitor is
//     online; offline, the last copy of that page; no copy at all → /offline.html;
//   • /assets/* (content-hashed) and the Google Fonts files: cache-first — they
//     are immutable, so a second visit renders the whole app even offline;
//   • other same-origin GETs (the shop catalogue, images): network-first with the
//     last copy as fallback — fresh whenever online, never invented when not.
// Bump CACHE_VERSION to retire every stored copy at once.
const CACHE_VERSION = 'v1'
const CACHE = `zeidex-${CACHE_VERSION}`
const OFFLINE_URL = '/offline.html'
const NEVER_CACHE = [/^\/tg\//, /^\/api\//, /^\/admin\//]
const FONT_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com'])

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

/** Cache only complete same-origin answers — a 206 partial would poison the entry. */
const storable = (response) => response && response.ok && response.status === 200 && response.type === 'basic'

async function networkFirst(request, fallbackOffline = false) {
  const cache = await caches.open(CACHE)
  try {
    const fresh = await fetch(request)
    if (storable(fresh)) cache.put(request, fresh.clone())
    return fresh
  } catch {
    // Offline: the last copy of this exact URL; navigations may fall back to the
    // offline page — anything else must fail as itself, not as HTML.
    const cached = await cache.match(request)
    if (cached) return cached
    if (fallbackOffline) {
      const offline = await cache.match(OFFLINE_URL)
      if (offline) return offline
    }
    return Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const fresh = await fetch(request)
  if (storable(fresh) || new URL(request.url).hostname !== self.location.hostname) cache.put(request, fresh.clone())
  return fresh
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  const sameOrigin = url.origin === self.location.origin
  // Only the two font hosts are cached cross-origin; TikTok embeds and anything
  // else stay pure network.
  if (!sameOrigin && !FONT_HOSTS.has(url.hostname)) return
  if (sameOrigin && NEVER_CACHE.some((re) => re.test(url.pathname))) return
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, true))
    return
  }
  // Hashed bundles and font files are immutable → cache-first.
  if (url.pathname.startsWith('/assets/') || !sameOrigin) {
    event.respondWith(cacheFirst(request))
    return
  }
  // Catalogue JSON, images, everything else: fresh while online, last copy offline.
  event.respondWith(networkFirst(request))
})
