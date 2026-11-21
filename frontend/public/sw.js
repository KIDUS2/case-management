/* Keeps the app openable when the internet is down. Pages and files are fetched from the network first (so updates
 * always arrive), and the last copy is used when the network is missing or too slow. Data calls (/api) are never cached here. */
const CACHE = 'casedesk-shell-v1'
const SLOW_MS = 4000

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
))

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return
  e.respondWith(networkFirst(req, req.mode === 'navigate'))
})

async function networkFirst(req, isPage) {
  const cache = await caches.open(CACHE)
  const key = isPage ? '/' : req
  try {
    const res = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(() => no(new Error('slow')), SLOW_MS))])
    if (res && res.ok) cache.put(key, res.clone())
    return res
  } catch {
    const hit = await cache.match(key)
    if (hit) return hit
    // a slow network may still answer, so give it the rest of the time when nothing is saved
    return fetch(req)
  }
}
