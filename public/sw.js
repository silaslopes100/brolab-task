/* BROLABTASK Service Worker - v1.0
   Estratégias:
   - Precache da shell (/, manifest, ícones)
   - _next/static*: cache-first (arquivos hasheados, imutáveis)
   - Navegação: network-first com fallback para shell (offline básico)
   - /api/*: apenas rede
   - push + notificationclick
*/
const VERSION = "brolabtask-v1"

const SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icon.svg",
  "/icon-light-32x32.png",
  "/icon-dark-32x32.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

function isSameOrigin(url) {
  return url.origin === self.location.origin
}

function isHashedStatic(url) {
  return url.pathname.startsWith("/_next/static/")
}

function isApi(url) {
  return url.pathname.startsWith("/api/")
}

function isNavigate(request) {
  return request.mode === "navigate"
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (!isSameOrigin(url)) return

  // API: nunca cachear (dados dinâmicos)
  if (isApi(url)) return

  // Assets hasheados (chunks, CSS, fontes): cache-first
  if (isHashedStatic(url)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit
        return fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(VERSION).then((cache) => cache.put(request, copy))
          }
          return res
        })
      })
    )
    return
  }

  // Navegação: network-first, fallback para a shell (offline básico)
  if (isNavigate(request)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(VERSION).then((cache) => cache.put(request, copy))
          }
          return res
        })
        .catch(() => caches.match("/").then((shell) => shell || caches.match(request)))
    )
    return
  }

  // Outros assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((hit) => {
      const fresh = fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(VERSION).then((cache) => cache.put(request, copy))
        }
        return res
      })
      return hit || fresh
    })
  )
})

// ---------- PUSH ----------
self.addEventListener("push", (event) => {
  let data = {}
  try {
    if (event.data) data = event.data.json()
  } catch (err) {
    // payload não-JSON: usa texto
    data = { body: event.data ? event.data.text() : "" }
  }

  const title = data.title || "BROLABTASK"
  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/" },
    tag: data.tag || "brolabtask",
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.focus()
          client.navigate(target)
          return
        }
      }
      return clients.openWindow(target)
    })
  )
})