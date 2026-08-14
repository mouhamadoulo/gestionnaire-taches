"use client";

import { useEffect, useState } from "react";

/**
 * Enregistre le service worker et propose la mise à jour quand une nouvelle
 * version attend.
 *
 * **En production seulement** : en développement, le worker resservirait des
 * fragments compilés périmés et la page paraîtrait figée après chaque
 * modification.
 */
export function ServiceWorker() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const watch = (r: ServiceWorkerRegistration) => {
      if (r.waiting) setWaiting(r.waiting);
      r.addEventListener("updatefound", () => {
        const next = r.installing;
        if (!next) return;
        next.addEventListener("statechange", () => {
          // Une première installation n'a rien à annoncer : il n'y a pas de
          // version précédente à remplacer.
          if (next.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(next);
          }
        });
      });
    };

    navigator.serviceWorker.register("/sw.js").then(watch).catch(() => undefined);

    /* Le nouveau worker a pris la main : on recharge une fois pour servir la
       version fraîche partout. */
    let reloading = false;
    const onChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onChange);
  }, []);

  if (!waiting) return null;

  return (
    <div className="fixed bottom-[18px] left-1/2 -translate-x-1/2 z-[95] max-w-[calc(100vw-16px)]">
      <div className="panel-hi flex flex-wrap justify-center items-center gap-x-[10px] gap-y-[6px] rounded-[12px] px-[14px] py-[10px] shadow-glass">
        <span className="text-[12px] text-t2">Une nouvelle version de MoloTask est prête.</span>
        <button
          type="button"
          onClick={() => waiting.postMessage("skip-waiting")}
          className="btn-primary px-[13px] py-[6px] rounded-[9px] text-[11.5px] font-semibold"
        >
          Recharger
        </button>
        <button
          type="button"
          onClick={() => setWaiting(null)}
          aria-label="Plus tard"
          title="Plus tard"
          className="btn-ghost w-[26px] h-[26px] rounded-[8px] text-[11px] leading-none flex items-center justify-center"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
