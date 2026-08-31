import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API server runs on :4000. Proxy REST + websocket traffic to it in dev
// so the browser only ever talks to the Vite origin.
export default defineConfig({
  plugins: [react()],
  // Vite only exposes VITE_* vars to the client by default; allow BACKEND_* too
  // so import.meta.env.BACKEND_API_URL is available in the bundle.
  envPrefix: ['VITE_', 'BACKEND_'],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', ws: true, changeOrigin: true },
    },
  },
});
