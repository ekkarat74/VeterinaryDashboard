import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', 'socket.io-client']
  },

  build: {
    chunkSizeWarningLimit: 1600,
    
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
  }
})