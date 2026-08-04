import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://localhost:3108',
        changeOrigin: true,
        // sant-api serves under /api/v1, so /api/x -> /api/v1/x.
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
      },
    },
  },
});
