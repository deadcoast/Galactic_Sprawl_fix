/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import os from 'os';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom in development and node in CI for better performance
    environment: process.env.CI ? 'node' : 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setupTests.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        '**/mocks/**',
        'tools/templates/**',
        'src/types/**',
        'src/tests/fixtures/**',
        'src/tests/setup/**',
      ],
      all: true,
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
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
    // Increase timeout for slow tests
    testTimeout: 10000,
    // Retry failed tests
    retry: 1,
    // Improve error reporting
    logHeapUsage: true,

    // Performance optimizations
    // Run tests in parallel using threads
    pool: 'threads',
    poolOptions: {
      threads: {
        // Use atomics for better thread synchronization
        useAtomics: true,
        // Limit the number of threads to avoid resource contention
        // Use half of available CPUs to leave resources for other processes
        maxThreads: Math.max(1, Math.floor(os.cpus().length / 2)),
        minThreads: 1,
      },
    },
    // Improve performance by isolating tests
    isolate: true,
    // Avoid unnecessary file watching in CI environments
    watch: process.env.CI ? false : true,
    // Add benchmark support
    benchmark: {
      include: ['**/*.benchmark.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      outputFile: './benchmark-results.json',
    },
  },
  server: {
    port: 3000,
    host: true,
    open: true,
    strictPort: true,
  },
});
