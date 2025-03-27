import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      strategies: 'generateSW',
      manifest: {
        id: '/prayer-times-app',
        name: 'Prayer Times - Islamic Prayer Times & Qibla Direction',
        short_name: 'Prayer Times',
        description: 'Accurate Islamic prayer times for your location. Get Fajr, Dhuhr, Asr, Maghrib, Isha times, Qibla direction, and Ramadan schedule.',
        theme_color: '#059669',
        background_color: '#ffffff',
        display: 'standalone',
        categories: ['religion', 'lifestyle', 'utilities'],
        dir: 'ltr',
        iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
        orientation: 'portrait-primary',
        prefer_related_applications: false,
        related_applications: [
          {
            platform: 'webapp',
            url: 'https://sholat.arkana.co.id'
          }
        ],
        scope_extensions: [
          {
            origin: 'https://sholat.arkana.co.id'
          }
        ],
        launch_handler: {
          client_mode: 'auto',
          scope: "/",
          navigators: ["browser", "webapp"]
        },
        screenshots: [
          {
            src: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=1080',
            type: 'image/jpeg',
            sizes: '1080x1920',
            form_factor: 'narrow',
            label: 'Prayer Times App - Home Screen (Mobile)'
          },
          {
            src: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=2048',
            type: 'image/jpeg',
            sizes: '2048x1536',
            form_factor: 'wide',
            label: 'Prayer Times App - Schedule View (Desktop)'
          }
        ],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'geocoding-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              backgroundSync: {
                name: 'geocoding-queue',
                options: {
                  maxRetentionTime: 24 * 60 // Retry for up to 24 hours
                }
              }
            }
          },
          {
            urlPattern: /^https:\/\/sholat\.arkana\.co.id\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              backgroundSync: {
                name: 'api-queue',
                options: {
                  maxRetentionTime: 24 * 60 // Retry for up to 24 hours
                }
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  }
});