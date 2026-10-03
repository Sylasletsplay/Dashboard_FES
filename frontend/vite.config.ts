import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Dashboard_FES/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
});
