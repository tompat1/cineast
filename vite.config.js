import { defineConfig } from 'vite';
import { resolve } from 'node:path';

let plugins = [];

export default defineConfig(async ({ command }) => {
  plugins = [];

  if (command !== 'build') {
    try {
      const { cloudflare } = await import('@cloudflare/vite-plugin');
      plugins = [cloudflare()];
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Cloudflare Vite plugin not available; continuing without it.');
      }
    }
  }

  return {
    plugins,
    server: {
      port: 5173,
      open: true,
      strictPort: true
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: resolve(process.cwd(), 'index.html'),
          article: resolve(process.cwd(), 'article.html')
        }
      }
    }
  };
});
