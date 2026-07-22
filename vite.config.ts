import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const basePath = process.env.BASE_PATH || '';

// App version — single source of truth is package.json
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Bake git commit hash at build time (fallback to env var for Docker builds)
let gitHash = process.env.GIT_HASH || 'dev';
if (gitHash === 'dev') {
  try {
    gitHash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    // Not in a git repo (e.g. Docker build without .git)
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_GIT_HASH__: JSON.stringify(gitHash)
  },
  plugins: [
    sveltekit(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      manifestFilename: 'manifest.json',
      includeAssets: [
        'favicon.svg',
        'icons/*.png'
      ],
      workbox: {
        navigateFallback: '200.html',
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024, // 2 MiB — only app-shell assets are precached
        globPatterns: [
          '**/*.{js,css,html,svg,ico,json,woff2}'
        ],
        runtimeCaching: [
          {
            // Word images cache lazily as the patient encounters them (they are
            // NOT precached). Soft LRU cap sized above the word bank, so every
            // encountered image stays cached without a rotting hard-coded count.
            urlPattern: /\/images\/words\/.*\.webp$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'word-images',
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /\.(?:js|css|woff2)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ]
});
