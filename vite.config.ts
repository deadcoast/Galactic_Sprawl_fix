import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import serveStatic from 'serve-static';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-server',
      configureServer(server) {
        // Serve files from .pixelArtAssets directory
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/.pixelArtAssets/')) {
            req.url = req.url.replace('/.pixelArtAssets/', '/');
            res.setHeader('Content-Type', 'image/png');
            // @ts-expect-error TS2345
            return serveStatic(resolve(__dirname, '.pixelArtAssets'))(req, res, next);
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3000,
    host: true,
    open: true,
    strictPort: true,
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.aseprite'],
  // Copy both asset directories to public
  publicDir: resolve(__dirname, 'assets'),
  build: {
    // Configure tree shaking options
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.warn and console.error
        pure_funcs: ['console.log'], // Remove console.log only
        passes: 2, // Extra pass for better optimization
        // Remove unused code and dead code
        dead_code: true,
        unused: true,
        ecma: 2020,
      },
      mangle: {
        properties: false, // Do not mangle property names - safer for dynamic access
      },
      format: {
        comments: false, // Remove comments from builds
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        // Configure manualChunks for better code splitting
        manualChunks: {
          // Group React and related libraries in vendor chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Group UI libraries
          'vendor-ui': [
            'framer-motion',
            'lucide-react',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
          ],
          // Group 3D and visualization libraries
          'vendor-3d': ['three', '@react-three/fiber', '@react-three/drei', 'pixi.js', 'd3'],
          // Group state management libraries
          'vendor-state': ['rxjs', 'xstate'],
        },
        // Customize chunk filenames to include contenthash for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        // Add comments to indicate chunk names in dev tools
        experimentalMinChunkSize: 10000, // 10kb - combine small chunks
      },
      // Enable tree shaking at the rollup level
      treeshake: {
        // Enable more aggressive tree shaking
        moduleSideEffects: false, // Assume modules have no side effects
        propertyReadSideEffects: false, // Assume property reads have no side effects
        tryCatchDeoptimization: false, // More aggressive optimizations
        unknownGlobalSideEffects: false, // Assume unknown globals don't have side effects
      },
    },
    // Enable source maps for production debugging
    sourcemap: true,
    // Optimize CSS and split into separate files
    cssCodeSplit: true,
    // Set chunk size warnings threshold
    chunkSizeWarningLimit: 1000, // 1MB
  },
  esbuild: {
    target: 'es2020',
    // Pure annotations help tree-shaking by marking functions as having no side effects
    pure: ['console.log'],
    // Drop unused code in development builds
    treeShaking: true,
    // Keep named exports to avoid issues with re-exports
    keepNames: true,
  },
  // Configure TypeScript options
  css: {
    devSourcemap: true,
  },
});
