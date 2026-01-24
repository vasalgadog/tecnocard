import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
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
    })
  ]
})
