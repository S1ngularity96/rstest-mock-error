import { defineConfig } from '@rstest/core';

// Docs: https://rstest.rs/config/
export default defineConfig({
  testEnvironment: 'node',
  setupFiles: ['./tests/rstest.setup.ts'],
});
