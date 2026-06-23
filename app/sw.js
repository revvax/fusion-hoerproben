/* Fusion Hörproben – Service Worker für Offline-Nutzung.
 * App-Shell (HTML + Icons + Manifest) wird gecacht; SoundCloud/YouTube/Fonts
 * brauchen Netz und schlagen offline einfach fehl (Wertungen + Timetable
 * liegen lokal und funktionieren ohne Netz). */
var CACHE = "fusion-hp-v6";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./MassimoGrafiaPlain-Regular.woff2",
  "./MassimoGrafiaPlain-Medium.woff2"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // SoundCloud/YouTube/Fonts: Netz, nicht cachen
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        // Offline-Fallback für Navigationen: die App-Shell ausliefern
        if (req.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});
