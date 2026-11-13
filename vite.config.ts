import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Keep substantial libraries in independent browser-cacheable chunks rather
// than shipping them as part of one 1.8 MB application file.
function vendorChunk(id: string): string | undefined {
  const normalized = id.replace(/\\/g, '/');
  if (!normalized.includes('/node_modules/')) return undefined;
  if (/\/node_modules\/(?:react|react-dom|react-is|scheduler|use-sync-external-store)\//.test(normalized)) return 'vendor-react';
  if (/\/node_modules\/(?:i18next|react-i18next)\//.test(normalized)) return 'vendor-i18n';
  if (normalized.includes('/node_modules/pinyin-pro/')) return 'vendor-pinyin';
  if (normalized.includes('/node_modules/@google/genai/')) return 'vendor-google-genai';
  if (/\/node_modules\/(?:recharts|victory-vendor)\//.test(normalized)) return 'vendor-recharts';
  if (/\/node_modules\/(?:d3(?:-[^/]+)?|internmap|delaunator|robust-predicates)\//.test(normalized)) return 'vendor-d3';
  if (normalized.includes('/node_modules/motion/')) return 'vendor-motion';
  if (normalized.includes('/node_modules/lucide-react/')) return 'vendor-icons';
  return undefined;
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
