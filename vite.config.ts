import path from 'path';
import { copyFileSync, mkdirSync } from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0'
      },
      plugins: [
        react(),
        tailwindcss(),
        {
          name: 'streamnexus-sites-worker',
          configureServer(server) {
            server.middlewares.use('/api/tmdb', async (request, response) => {
              const apiKey = env.TMDB_API_KEY;
              const bearer = env.TMDB_BEARER_TOKEN;
              if (!apiKey && !bearer) {
                response.statusCode = 503;
                response.setHeader('Content-Type', 'application/json');
                response.end(JSON.stringify({ error: 'TMDB server credential is not configured' }));
                return;
              }
              try {
                const incoming = new URL(request.url || '/', 'http://localhost');
                incoming.searchParams.delete('api_key');
                if (apiKey) incoming.searchParams.set('api_key', apiKey);
                const upstream = await fetch(`https://api.themoviedb.org/3${incoming.pathname}?${incoming.searchParams}`, {
                  headers: bearer ? { Authorization: `Bearer ${bearer}`, Accept: 'application/json' } : { Accept: 'application/json' },
                  signal: AbortSignal.timeout(8_000)
                });
                response.statusCode = upstream.status;
                response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
                response.setHeader('X-Robots-Tag', 'noindex, nofollow');
                response.end(Buffer.from(await upstream.arrayBuffer()));
              } catch {
                response.statusCode = 502;
                response.end(JSON.stringify({ error: 'TMDB request failed' }));
              }
            });
          },
          closeBundle() {
            mkdirSync(path.resolve(__dirname, 'dist/server'), { recursive: true });
            copyFileSync(path.resolve(__dirname, 'worker/index.js'), path.resolve(__dirname, 'dist/server/index.js'));
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
