import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward every request that starts with /api to the Express server.
    // The browser thinks it's talking to localhost:5173 only, so the
    // login cookie works and the backend doesn't need CORS settings.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
