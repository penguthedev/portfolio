import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // Lets the client call /api/* in development without any CORS setup.
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },

  build: {
    target: 'es2020',
    cssMinify: 'lightningcss',
    // Hidden source maps: debuggable in production without shipping them to visitors.
    sourcemap: 'hidden',
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // React changes far less often than the portfolio content, so giving it
        // its own chunk means editing a project description does not invalidate
        // the framework in returning visitors' caches.
        // Vite 8 runs on Rolldown, which expects a function here.
        manualChunks(id) {
          if (id.includes('/node_modules/react') || id.includes('/node_modules/scheduler')) {
            return 'react';
          }
        },
      },
    },
  },
});
