import path from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/vidsrc-api': {
            target: 'https://vidsrc-embed.ru',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/vidsrc-api/, '')
          }
        }
      },
      plugins: [
        react(),
        tailwindcss(),
        {
          name: 'streamnexus-sites-worker',
          closeBundle() {
            mkdirSync(path.resolve(__dirname, 'dist/server'), { recursive: true });
            writeFileSync(
              path.resolve(__dirname, 'dist/server/index.js'),
              `const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!env.ASSETS) return new Response('Static asset binding unavailable', { status: 503 });
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || /\\.[a-z0-9]+$/i.test(url.pathname)) return response;
    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
  }
};
export default worker;
`
            );
          }
        }
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
