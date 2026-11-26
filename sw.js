/* Onebike – service worker: snabb start och grundläggande offline-stöd.
   HTML hämtas alltid från nätet först (nya versioner syns direkt), data och filer cachas försiktigt.
   Videor och bilder från andra domäner cachas inte (stora filer, byte-intervall). */
const V = 'ob-v4';
const SHELL = ['./', 'index.html', 'offline.html', 'assets/css/site.css', 'assets/css/home.css', 'assets/js/site.js', 'assets/js/features.js',
  'assets/lv/onebike-original-logo.svg', 'assets/img/favicon.svg', 'assets/img/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const put = (req, res) => { if (res && res.ok && res.type === 'basic') { const c = res.clone(); caches.open(V).then(ca => ca.put(req, c)); } return res; };

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                 // produktbilder, typsnitt m.m. hanteras av webbläsaren
  if (url.pathname.includes('/assets/vid/') || req.headers.has('range')) return;  // videor: aldrig via cache
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => put(req, r)).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('offline.html'))));
    return;
  }
  if (url.pathname.includes('/data/')) {                       // data: visa sparat direkt, uppdatera i bakgrunden
    e.respondWith(caches.match(req).then(hit => { const net = fetch(req).then(r => put(req, r)).catch(() => hit); return hit || net; }));
    return;
  }
  e.respondWith(fetch(req).then(r => put(req, r)).catch(() => caches.match(req)));  // css, js, bilder: nätet först
});
