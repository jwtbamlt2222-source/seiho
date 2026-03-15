const CACHE = 'seiho-v1';

const LOCAL = [
  './seiho1_25years_study.html',
  './seiho2_25years_study.html',
  './manifest-s1.json',
  './manifest-s2.json',
  './icon-s1.png',
  './icon-s2.png',
];

const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js',
];

// インストール: ローカルファイルをキャッシュ、CDNはベストエフォート
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async cache => {
      await cache.addAll(LOCAL);
      await Promise.allSettled(
        CDN.map(url =>
          fetch(url, { mode: 'cors' })
            .then(r => r.ok ? cache.put(url, r) : null)
            .catch(() => null)
        )
      );
    })
  );
  self.skipWaiting();
});

// アクティベート: 古いキャッシュを削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// フェッチ: キャッシュ優先、なければネットワーク取得してキャッシュ
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request, { mode: 'cors' })
        .then(res => {
          if (!res || res.status !== 200) return res;
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => {
          if (e.request.destination === 'document') {
            return caches.match('./seiho1_25years_study.html');
          }
        });
    })
  );
});