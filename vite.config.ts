import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['peterlingo-icon.svg', 'peterlingo-192.png', 'peterlingo-512.png'],
      manifest: {
        name: 'PeterLingo',
        short_name: 'PeterLingo',
        description: 'Fem færdigheder. Én daglig læringsrytme.',
        lang: 'da',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f7f3eb',
        theme_color: '#172f29',
        icons: [
          {
            src: '/peterlingo-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/peterlingo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/peterlingo-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: { reporter: ['text', 'html'] },
  },
});
