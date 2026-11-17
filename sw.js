/* 우리 가족 기록장 — 오프라인 캐시 서비스 워커
   · 새 버전이 배포되면 폰에서도 바로 반영되도록 '네트워크 우선 → 캐시 폴백' 방식으로 동작해요.
   · CACHE 이름을 올리면 예전 캐시는 자동으로 지워집니다. */
const CACHE = 'family-dashboard-v5';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 날씨 API·유튜브는 브라우저가 직접

  // 네트워크 우선: 새 버전이 있으면 즉시 받아오고, 캐시에도 저장
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => undefined);
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => {
        if (hit) return hit;
        if (req.mode === 'navigate') {
          return caches.match('index.html').then(r => r || caches.match('./'));
        }
        return Response.error();
      }))
  );
});
