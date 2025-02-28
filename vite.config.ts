import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import serveStatic from 'serve-static';

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
            // @ts-ignore
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
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  esbuild: {
    target: 'es2020',
  },
  // Configure TypeScript options
  css: {
    devSourcemap: true,
  },
});
