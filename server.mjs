import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Readable } from 'node:stream';
import seoWorker from './worker/index.js';

const DIST_DIRECTORY = path.resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const DIST_PREFIX = `${DIST_DIRECTORY}${path.sep}`;
const DEFAULT_PORT = 3000;
const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=UTF-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=UTF-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=UTF-8'],
  ['.json', 'application/json; charset=UTF-8'],
  ['.map', 'application/json; charset=UTF-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=UTF-8'],
  ['.webmanifest', 'application/manifest+json; charset=UTF-8'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2']
]);

const configuredPort = Number(process.env.PORT || DEFAULT_PORT);
if (!Number.isInteger(configuredPort) || configuredPort < 1 || configuredPort > 65_535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const host = process.env.HOST || '0.0.0.0';
const DIRECT_ASSETS = new Set([
  '/favicon.svg',
  '/og-seo.jpg',
  '/og.png',
  '/site.webmanifest'
]);

const assetFetch = async request => {
  const url = new URL(request.url);
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(DIST_DIRECTORY, relativePath);
  if (filePath !== DIST_DIRECTORY && !filePath.startsWith(DIST_PREFIX)) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const details = await stat(filePath);
    if (!details.isFile()) return new Response('Not found', { status: 404 });
    const extension = path.extname(filePath).toLowerCase();
    const cacheControl = relativePath.startsWith('assets/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=300';
    return new Response(await readFile(filePath), {
      headers: {
        'Cache-Control': cacheControl,
        'Content-Type': MIME_TYPES.get(extension) || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') {
      return new Response('Not found', { status: 404 });
    }
    throw error;
  }
};

const environment = {
  SITE_URL: process.env.SITE_URL,
  TMDB_API_KEY: process.env.TMDB_API_KEY,
  TMDB_BEARER_TOKEN: process.env.TMDB_BEARER_TOKEN,
  ASSETS: { fetch: assetFetch }
};

const requestOrigin = request => {
  if (process.env.SITE_URL) {
    try {
      return new URL(process.env.SITE_URL).origin;
    } catch {
      throw new Error('SITE_URL must be an absolute URL');
    }
  }
  const authority = request.headers.host || `localhost:${configuredPort}`;
  return `http://${authority}`;
};

const server = createServer(async (incoming, outgoing) => {
  try {
    if (incoming.method !== 'GET' && incoming.method !== 'HEAD') {
      outgoing.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=UTF-8' });
      outgoing.end('Method not allowed');
      return;
    }

    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) {
      if (Array.isArray(value)) value.forEach(item => headers.append(name, item));
      else if (value !== undefined) headers.set(name, value);
    }
    const request = new Request(new URL(incoming.url || '/', requestOrigin(incoming)), {
      method: incoming.method,
      headers
    });
    const pathname = new URL(request.url).pathname;
    const result = pathname.startsWith('/assets/') || DIRECT_ASSETS.has(pathname)
      ? await assetFetch(request)
      : await seoWorker.fetch(request, environment);

    outgoing.statusCode = result.status;
    result.headers.forEach((value, name) => outgoing.setHeader(name, value));
    if (incoming.method === 'HEAD' || !result.body) {
      outgoing.end();
      return;
    }
    Readable.fromWeb(result.body).pipe(outgoing);
  } catch (error) {
    console.error('Request failed:', error instanceof Error ? error.message : error);
    if (!outgoing.headersSent) {
      outgoing.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
    }
    outgoing.end('Internal server error');
  }
});

server.listen(configuredPort, host, () => {
  const credentialStatus = environment.TMDB_API_KEY || environment.TMDB_BEARER_TOKEN
    ? 'configured'
    : 'MISSING — TMDB pages will return HTTP 503';
  console.log(`StreamNexus listening on http://${host}:${configuredPort}`);
  console.log(`TMDB credential: ${credentialStatus}`);
});
