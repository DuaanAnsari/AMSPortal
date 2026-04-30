import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// ----------------------------------------------------------------------

export default defineConfig({
  // `.env` is under `src/` — Vite default is repo root; without this, live build misses VITE_* vars
  envDir: path.join(process.cwd(), 'src'),
  /** Expose `REACT_APP_API_BASE_URL` and `VITE_API_BASE_URL` to the client bundle. */
  envPrefix: ['VITE_', 'REACT_APP_'],
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^~(.+)/,
        replacement: path.join(process.cwd(), 'node_modules/$1'),
      },
      {
        find: /^src(.+)/,
        replacement: path.join(process.cwd(), 'src/$1'),
      },
    ],
  },
  server: {
    port: 3030,
    proxy: {
      '/api': {
        target: 'http://192.168.18.13',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3030, // build ke baad bhi isi port pe chalega
  },
});
