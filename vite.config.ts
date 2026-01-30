import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/tecnocard/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      manifest: {
        name: 'Tecnocard Loyalty',
        short_name: 'Tecnocard',
        description: 'Tarjeta de fidelización digital',
        theme_color: '#cd853f',
        icons: [
          {
            src: 'img/logo.png', // We moved logo here
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['react-qr-code', 'html5-qrcode'],
        },
      },
    },
  },
})
