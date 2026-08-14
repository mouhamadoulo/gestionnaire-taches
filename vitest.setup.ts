import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Sans nettoyage explicite, chaque rendu laisse son arbre dans le document et
// les requêtes du test suivant trouvent deux fois le même bouton.
afterEach(cleanup);

// jsdom ne connaît pas la mise en page, donc pas `scrollIntoView`. Sans ce
// bouchon, tout composant qui ramène un élément dans la vue échoue pour une
// raison qui ne le concerne pas.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
