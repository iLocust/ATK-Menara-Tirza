import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.jsx', '.json']  // Tambahkan ini untuk membantu resolusi file
  },
  build: {
    rollupOptions: {
      external: [
        '@capacitor/core',
        '@capacitor/app'
      ],
      input: {
        main: path.resolve(__dirname, 'index.html') 
      }
    }
  }
});