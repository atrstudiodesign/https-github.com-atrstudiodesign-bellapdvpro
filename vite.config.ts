import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'Bella PDV - Sistema ERP & PDV Inteligente',
          short_name: 'Bella PDV',
          description: 'Sistema de gestão comercial completo com PDV, Frente de Caixa, IA e Controle de Vendas.',
          theme_color: '#05070F',
          background_color: '#05070F',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globIgnores: ['**/assets/aistudio/**'],
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },
        { find: /^react$/, replacement: path.resolve(__dirname, 'node_modules/react') },
        { find: /^react-dom$/, replacement: path.resolve(__dirname, 'node_modules/react-dom') },
      ],
      dedupe: [
        'react',
        'react-dom',
        'react-router',
        'react-router-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'firebase',
        '@firebase/app',
      ],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-router',
        'react-router-dom',
        'motion',
        'motion/react',
        'lucide-react',
        'sonner',
        'zustand',
        'clsx',
        'tailwind-merge',
        'date-fns',
        'date-fns/locale',
        'driver.js',
        'qrcode',
        'jszip',
        'recharts',
        '@vercel/analytics/react',
        '@vercel/speed-insights/react',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/database',
        'firebase/analytics',
        'firebase/app-check',
        '@firebase/app',
      ],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Code-splitting das dependências pesadas do Firebase
              if (
                id.includes('@firebase/firestore') || 
                id.includes('firebase/firestore') || 
                id.includes('@firebase/webchannel-wrapper')
              ) {
                return 'firebase-firestore';
              }
              if (
                id.includes('@firebase/auth') || 
                id.includes('firebase/auth')
              ) {
                return 'firebase-auth';
              }
              if (
                id.includes('@firebase/database') || 
                id.includes('firebase/database')
              ) {
                return 'firebase-database';
              }
              if (
                id.includes('firebase') || 
                id.includes('@firebase')
              ) {
                return 'firebase-core';
              }
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: false,
    },
  };
});
