/*
 * Service worker de MoloTask.
 *
 * Écrit à la main plutôt que généré : l'application est une seule page dont
 * toutes les données vivent dans localStorage. Il n'y a donc rien à
 * synchroniser — juste une coquille à garder sous la main pour que le tableau
 * s'ouvre sans réseau.
 *
 * Changer VERSION invalide les caches précédents.
 */
const VERSION = "molotask-v1";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;

/* La page d'accueil : c'est tout ce qu'il faut pour démarrer hors ligne, le
   reste des ressources arrive par le cache d'exécution. */
const SHELL_URLS = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(SHELL_URLS))
      // Un précache qui échoue (hors ligne à l'installation) ne doit pas
      // empêcher le service worker de s'installer.
      .catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

/* La page demande l'activation immédiate quand l'utilisateur accepte la mise
   à jour proposée par le bandeau. */
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

/**
 * Navigations : réseau d'abord, cache en repli.
 *
 * L'inverse servirait une version périmée à chaque visite ; ici la seule
 * conséquence d'un réseau lent est un affichage lent, pas un tableau faux.
 */
async function handleNavigation(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(SHELL);
    cache.put("/", fresh.clone());
    return fresh;
  } catch {
    const cached = (await caches.match(request)) || (await caches.match("/"));
    if (cached) return cached;
    throw new Error("hors ligne et rien en cache");
  }
}

/** Ressources compilées : leur nom porte un hachage, le cache fait foi. */
async function handleAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh.ok) {
    const cache = await caches.open(ASSETS);
    cache.put(request, fresh.clone());
  }
  return fresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/icon.svg") {
    event.respondWith(handleAsset(request));
  }
});
