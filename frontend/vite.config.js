import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// In development the browser talks to Vite (port 5173) and Vite forwards /api to the backend.
// The browser then sees one site, so the login cookie just works and CORS is not needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_DEV_API ?? 'http://localhost:4000', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.js'],
    css: false,
  },
});
