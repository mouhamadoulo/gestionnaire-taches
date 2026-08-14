import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = dirname(fileURLToPath(import.meta.url));

// Fuseau figé : fmtDate, isOverdue et shiftDate raisonnent sur des dates, une
// machine en UTC-5 ne doit pas donner un autre résultat que la CI.
const env = { TZ: 'UTC' };

export default defineConfig({
  // Les composants importent « @/lib/… » comme dans l'application.
  resolve: { alias: { '@': root } },
  // tsconfig.json laisse le JSX à Next (« preserve ») : hors build Next, il
  // faut dire à esbuild de le transformer lui-même.
  esbuild: { jsx: 'automatic' },
  test: {
    projects: [
      {
        // Logique pure : pas de DOM à charger, donc pas de jsdom.
        resolve: { alias: { '@': root } },
        test: { name: 'lib', environment: 'node', include: ['lib/**/*.test.ts'], env },
      },
      {
        resolve: { alias: { '@': root } },
        esbuild: { jsx: 'automatic' },
        test: {
          name: 'ui',
          environment: 'jsdom',
          include: ['{components,lib}/**/*.test.tsx'],
          setupFiles: ['./vitest.setup.ts'],
          env,
        },
      },
    ],
  },
});
