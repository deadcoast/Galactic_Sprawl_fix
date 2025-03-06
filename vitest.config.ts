/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts', './src/tests/setup/testingLibrary.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/tests/tools/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    environmentOptions: {
      jsdom: {
        // Add Node.js globals for tools tests
        resources: 'usable',
      },
    },
    // Add alias for tools directory
    alias: {
      tools: './tools',
    },
  },
  server: {
    port: 3000,
    host: true,
    open: true,
    strictPort: true,
  },
});
