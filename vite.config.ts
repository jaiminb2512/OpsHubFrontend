import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            'babel-plugin-styled-components',
            {
              displayName: true,
              fileName: true,
            },
          ],
        ],
      },
    }),
  ],
  server: {
    port: 5001,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['styled-components'],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Do not bundle all @mui/icons-material into one chunk (breaks tree-shaking)
          if (id.includes('@mui/x-')) return 'mui-x';
          if (id.includes('@mui/')) return 'mui-core';
          if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
          if (id.includes('/react/') || id.endsWith('react/index.js')) return 'react-vendor';
          if (id.includes('@reduxjs') || id.includes('redux')) return 'redux';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('react-slick') || id.includes('slick-carousel')) return 'carousel';
          if (id.includes('axios')) return 'http';
          if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) return 'dates';

          return 'vendor';
        },
      },
    },
  },
})
