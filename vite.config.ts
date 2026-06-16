/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Disguises the Umami script as a local file
        '/vibe-check.js': {
          target: 'https://cloud.umami.is',
          changeOrigin: true,
          rewrite: () => '/script.js',
        },
        // Disguises the data collection as a local folder
        '/vibe-telemetry': {
          target: 'https://cloud.umami.is',
          changeOrigin: true,
          rewrite: () => '/api/send',
        },
      },
    },
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          // Vite 8 uses Rolldown, which requires manualChunks to be a function
          // (the object form is no longer accepted).
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'vendor';
            if (
              id.includes('node_modules/lucide-react/') ||
              id.includes('node_modules/react-markdown/') ||
              id.includes('node_modules/react-syntax-highlighter/') ||
              id.includes('node_modules/katex/')
            ) return 'utils';
          }
        }
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary'],
        reportOnFailure: true,
      }
    }
  };
});
