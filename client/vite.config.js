import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.VITE_PORT) || 5173,
    // Point at a different API port with VITE_API_PORT when 5000 is taken.
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${Number(process.env.VITE_API_PORT) || 5000}`,
        changeOrigin: true,
      },
    },
  },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900 },
});
