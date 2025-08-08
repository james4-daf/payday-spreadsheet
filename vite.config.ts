import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  optimizeDeps: {
    include: ['pouchdb', 'pouchdb-adapter-idb'],
  },
  build: {
    commonjsOptions: {
      include: [/pouchdb/, /node_modules/],
    },
  },
  define: {
    global: 'globalThis',
  },
});
