import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tout ce qui est testé ici est de la logique pure (lib/) : pas de DOM,
    // donc pas de jsdom à charger.
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    // Fuseau et locale figés : fmtDate / isOverdue / shiftDate raisonnent sur
    // des dates, une machine en UTC-5 ne doit pas donner un autre résultat.
    env: { TZ: 'UTC' },
  },
});
