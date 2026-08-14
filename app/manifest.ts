import type { MetadataRoute } from "next";

/**
 * Manifeste d'installation.
 *
 * L'icône est le SVG déjà servi par `app/icon.svg` : `sizes: "any"` évite de
 * fabriquer et de maintenir une série de PNG pour une image vectorielle.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MoloTask — Gestionnaire de tâches",
    short_name: "MoloTask",
    description:
      "Tableau kanban pour gérer tous types de tâches : travail, perso, projets, études.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0a0b12",
    theme_color: "#0a0b12",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
    ],
  };
}
