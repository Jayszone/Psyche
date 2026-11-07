import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1200 },
  // Lets `npm start` serve on a hosting platform (any hostname, any port).
  preview: { host: true },
})
