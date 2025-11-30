import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, 
    environment: 'node', 
    include: ['src/game/tests/**/*.{test,spec}.{js,mjs,ts}'],
  },
});