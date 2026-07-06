import { defineConfig } from 'vite';

let plugins = [];

try {
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  plugins = [cloudflare()];
} catch (error) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Cloudflare Vite plugin not available; continuing without it.');
  }
}

export default defineConfig({
  plugins,
  server: {
    port: 5173,
    open: true,
    strictPort: true
  },
  build: {
    outDir: 'dist'
  }
});
