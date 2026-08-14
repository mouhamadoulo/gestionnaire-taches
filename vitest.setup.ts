import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Sans nettoyage explicite, chaque rendu laisse son arbre dans le document et
// les requêtes du test suivant trouvent deux fois le même bouton.
afterEach(cleanup);
