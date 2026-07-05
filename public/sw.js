// public/sw.js
//
// ══════════════════════════════════════════════════════════════
// Service Worker بسيط لمِداد:
//  - Cache-first للأصول الثابتة (أيقونات، خطوط، CSS)
//  - Network-first لكل شيء آخر (صفحات + API) — يضمن دائماً أحدث
//    محتوى من الخادم، مع سقوط احتياطي للتخزين المؤقت عند انقطاع الشبكة
// ══════════════════════════════════════════════════════════════

const CACHE_NAME = 'midad-cache-v1'

const STATIC_ASSETS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/logo-midad.png',
]

// ── التثبيت: تخزين الأصول الثابتة الأساسية مسبقاً ────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ── التفعيل: حذف أي نسخ تخزين مؤقت قديمة ────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── الجلب: استراتيجية مختلطة ──────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // لا نتدخل في طلبات غير GET (مثل POST لتوليد الاختبارات)
  if (request.method !== 'GET') return

  // الصور والأيقونات: cache-first (نادراً ما تتغيّر)
  if (
    request.destination === 'image' ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
      })
    )
    return
  }

  // كل شيء آخر (صفحات، API): network-first مع سقوط احتياطي للكاش
  event.respondWith(
    fetch(request)
      .then((response) => {
        // لا نخزّن استجابات API مؤقتاً لتفادي بيانات قديمة حساسة
        if (!url.pathname.startsWith('/api/')) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})