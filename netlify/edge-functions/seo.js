import seoWorker from '../../worker/index.js';

const PRODUCTION_ORIGIN = 'https://streamnexus.fun';

const getEnvironmentVariable = (name) => {
  try {
    return globalThis.Netlify?.env?.get(name);
  } catch {
    return undefined;
  }
};

export default async function handler(request, context) {
  return seoWorker.fetch(request, {
    SITE_URL: getEnvironmentVariable('SITE_URL') || PRODUCTION_ORIGIN,
    TMDB_API_KEY: getEnvironmentVariable('TMDB_API_KEY'),
    TMDB_BEARER_TOKEN: getEnvironmentVariable('TMDB_BEARER_TOKEN'),
    ASSETS: {
      // Continue through Netlify's request chain. For application routes, the
      // SPA rewrite below resolves to /index.html without invoking this edge
      // function a second time. Real static files are served directly.
      fetch: () => context.next()
    }
  });
}
