import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/backup/*.test.ts'],
    testTimeout: 60000,
    hookTimeout: 10000,
  },
});
