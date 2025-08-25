import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Suppress Node.js module warnings in browser
    'process.env': {},
  },
  optimizeDeps: {
    exclude: ['os', 'fs', 'path'],
  },
  server: {
    // No proxy needed - Supabase functions are called directly
  },
});