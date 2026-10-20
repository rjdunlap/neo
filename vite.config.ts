/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // `scripts/snapshot-serve.sh` serves a copy of the tree beside the real dev server; it needs its own dep cache.
  cacheDir: (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.VITE_CACHE_DIR || 'node_modules/.vite',
  // Relative paths so the build works from any static host or sub-folder (e.g. GitHub Pages).
  base: './',
  // Two pages: the root is the creature-world rework (`src/rework.ts`), `classic/` the island game (`src/main.ts`).
  build: { chunkSizeWarningLimit: 1500, rollupOptions: { input: { main: 'index.html', classic: 'classic/index.html' } } },
  plugins: [
    VitePWA({
      // Let a new build take over after the current play session closes. Auto-update
      // reloads every open client as soon as its cache is ready, which can send a child
      // from the place screen back to Start a few seconds after their first tap.
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Puddle Island',
        short_name: 'Puddle Island',
        description: 'Little learning games, made at home.',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#FFF4E3',
        theme_color: '#FFF4E3',
        start_url: './',
        // `classic/` (the island game) links its own copy, public/classic/manifest.webmanifest, which starts there.
        scope: './',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // The first worker still takes control at once, so the very first visit already works offline;
      // an update waits (no skipWaiting) until every open copy of the app has closed.
      // The code-drawn game catalog's main bundle is just over 2 MiB; cache it offline with an explicit 3 MiB per-file bound.
      workbox: { maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'], clientsClaim: true },
    }),
  ],
  // `scripts/creature-art/*.test.mjs` checks the sprite preparation tool's pixel rules on synthetic images.
  test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'] },
});
