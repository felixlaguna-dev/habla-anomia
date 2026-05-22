import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';

const basePath = process.env.BASE_PATH || '';

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
    __APP_VERSION__: JSON.stringify(gitHash)
  },
  plugins: [
    sveltekit(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      manifestFilename: 'manifest.json',
      includeAssets: [
        'favicon.svg',
        'icons/*.png',
        'images/words/*.webp'
      ],
      workbox: {
        navigateFallback: '200.html',
        globPatterns: [
          '**/*.{js,css,html,svg,png,webp,woff2,ico,json}'
        ],
        runtimeCaching: [
          {
            urlPattern: /\/images\/words\/.*\.webp$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'word-images',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365 }
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
