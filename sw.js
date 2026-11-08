/* =========================================================================
   © جميع الحقوق محفوظة لـ مربع الخدمات ش.م.م
   Service Worker — تشغيل التطبيق دون اتصال بالإنترنت (PWA)
   الاستراتيجية: عرض النسخة المحفوظة فوراً ثم تحديثها في الخلفية،
   فتظهر التحديثات الجديدة عند الفتح التالي.
   ========================================================================= */
const CACHE = 'almasiya-fleet-v9';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './css/fonts.css', './css/style.css', './css/mobile.css',
  './js/config.js', './js/i18n.js', './js/vendor/supabase.js', './js/data.js', './js/app.js',
  './assets/logo.svg', './assets/icons/icon-192.png', './assets/icons/icon-512.png',
  './assets/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2',
  './assets/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2',
  './assets/fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2',
  './assets/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2',
  './assets/fonts/ibm-plex-sans-arabic-latin-400-normal.woff2',
  './assets/fonts/ibm-plex-sans-arabic-latin-500-normal.woff2',
  './assets/fonts/ibm-plex-sans-arabic-latin-600-normal.woff2',
  './assets/fonts/ibm-plex-sans-arabic-latin-700-normal.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      const res = await network;
      if (res) return res;
      if (req.mode === 'navigate') return cache.match('./index.html');
      return new Response('', { status: 504 });
    })
  );
});
