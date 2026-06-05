const CACHE_NAME = "neon-arena-web-v2";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/assets/maps/ion-rooftop.svg",
  "/assets/maps/foundry-overpass.svg",
  "/assets/maps/skyline-garden.svg",
  "/assets/maps/dockyard-sprawl.svg",
  "/assets/maps/market-crossfire.svg",
  "/assets/environment/wall-ion.svg",
  "/assets/environment/wall-foundry.svg",
  "/assets/environment/wall-garden.svg",
  "/assets/environment/wall-market.svg",
  "/assets/characters/fighter-cyan.svg",
  "/assets/characters/fighter-magenta.svg",
  "/assets/characters/fighter-yellow.svg",
  "/assets/characters/fighter-violet.svg",
  "/assets/weapons/energy-blade.svg",
  "/assets/weapons/shock-hammer.svg",
  "/assets/weapons/pulse-rifle.svg",
  "/assets/weapons/laser-carbine.svg",
  "/assets/fx/projectile.svg",
  "/assets/fx/melee-arc.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request);
    })
  );
});
