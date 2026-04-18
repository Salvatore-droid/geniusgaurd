import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Build configuration for React
export default defineConfig({
  plugins: [react()],
  root: './client',  // Your index.html is here
  build: {
    outDir: '../dist',  // Build output to dist folder at root
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
});

// Keep your test config separately if needed
export const testConfig = {
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/*.test.ts', 'client/src/**/*.test.ts'],
    testTimeout: 30000,
  },
};