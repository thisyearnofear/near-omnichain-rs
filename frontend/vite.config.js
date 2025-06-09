import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [wasm()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    target: 'esnext'
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util'
    }
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
    exclude: ['@vite/client', '@vite/env']
  }
});