import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    open: true,
    cors: true,
    watch: {
      usePolling: true,
      interval: 1000
    },
    hmr: {
      port: 5173,
      host: 'localhost',
      overlay: false
    }
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    cors: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  define: {
    'process.env': {
      REACT_APP_API_BASE_URL: JSON.stringify(process.env.REACT_APP_API_BASE_URL),
      REACT_APP_DEFAULT_MEETING_DURATION: JSON.stringify(process.env.REACT_APP_DEFAULT_MEETING_DURATION),
      REACT_APP_DEFAULT_ATTENDANCE_THRESHOLD: JSON.stringify(process.env.REACT_APP_DEFAULT_ATTENDANCE_THRESHOLD),
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      REACT_APP_ENV: JSON.stringify(process.env.REACT_APP_ENV)
    }
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          charts: ['chart.js', 'recharts'],
          utils: ['axios', 'papaparse', 'sweetalert2', 'framer-motion']
        },
        // Generate clean chunk names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace('.js', '') : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        }
      },
      external: (id) => {
        // Don't bundle these if they're meant to be external
        return false;
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        keep_fargs: false,
        pure_funcs: ['console.log', 'console.debug']
      }
    }
  }
})
