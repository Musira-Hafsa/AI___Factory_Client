import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API server runs on :4000. Proxy REST + websocket traffic to it in dev
// so the browser only ever talks to the Vite origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', ws: true, changeOrigin: true },
    },
  },
});
