import { readFile } from 'node:fs/promises';
import seoWorker from '../worker/index.js';

const INTERNAL_PATH_PARAM = '__path';
const TEMPLATE_PATH = new URL('../dist/index.html', import.meta.url);
let templatePromise;

const errorResponse = (message, status = 500) => new Response(message, {
  status,
  headers: {
    'Content-Type': 'text/plain; charset=UTF-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow'
  }
});

const publicRequestFromRewrite = request => {
  const functionUrl = new URL(request.url);
  const originalPath = functionUrl.searchParams.get(INTERNAL_PATH_PARAM);

  if (!originalPath) return null;
  if (!originalPath.startsWith('/') || originalPath.startsWith('//') || originalPath.includes('\\')) return false;

  functionUrl.searchParams.delete(INTERNAL_PATH_PARAM);
  const publicUrl = new URL(originalPath, functionUrl.origin);
  publicUrl.search = functionUrl.searchParams.toString();
  return new Request(publicUrl, request);
};

const readStaticTemplate = () => {
  if (!templatePromise) {
    templatePromise = readFile(TEMPLATE_PATH, 'utf8').catch(error => {
      templatePromise = undefined;
      throw error;
    });
  }

  return templatePromise;
};

const staticTemplateFetcher = async assetRequest => {
  const requestedAsset = new URL(assetRequest.url);
  if (requestedAsset.pathname !== '/index.html') return new Response('Not found', { status: 404 });

  return new Response(await readStaticTemplate(), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' }
  });
};

export const handleVercelRequest = async (request, options = {}) => {
  const publicRequest = publicRequestFromRewrite(request);
  if (publicRequest === null) return errorResponse('Not found', 404);
  if (publicRequest === false) return errorResponse('Invalid route', 400);

  const environment = options.environment || process.env;
  const assetFetch = options.assetFetch || staticTemplateFetcher;

  try {
    return await seoWorker.fetch(publicRequest, {
      SITE_URL: environment.SITE_URL,
      TMDB_API_KEY: environment.TMDB_API_KEY,
      TMDB_BEARER_TOKEN: environment.TMDB_BEARER_TOKEN,
      ASSETS: { fetch: assetFetch }
    });
  } catch (error) {
    console.error('StreamNexus Vercel function failed', error instanceof Error ? error.message : 'Unknown error');
    return errorResponse('The site service is temporarily unavailable', 503);
  }
};

export default {
  fetch(request) {
    return handleVercelRequest(request);
  }
};
