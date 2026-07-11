import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@hybridsovereign/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api/k8s': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
