import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'http://localhost:3001',
          ws: true,
        }
      }
    },
    plugins: [react(), tailwindcss(), viteCompression({ algorithm: 'brotliCompress', threshold: 1024 })],
    build: {
      target: 'es2017',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/zustand')) return 'vendor';
            if (id.includes('node_modules/lucide-react')) return 'icons';
            if (id.includes('node_modules/@tanstack/react-virtual')) return 'virtual';
            if (id.includes('meal/constants/dishLibrary') || id.includes('meal/constants/dishStyles') || id.includes('meal/constants/generatedIngredients')) return 'dishes';
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
