import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = 'https://streamnexus.example';
const template = await readFile(resolve('dist/index.html'), 'utf8');
const { default: worker } = await import(`../dist/server/index.js?test=${Date.now()}`);
const { default: netlifyHandler } = await import(`../netlify/edge-functions/seo.js?test=${Date.now()}`);
const { handleVercelRequest } = await import(`../api/render.js?test=${Date.now()}`);

const movieFixture = {
  id: 603,
  title: 'The Matrix',
  overview: 'A computer hacker discovers that the world he knows is a simulated reality and joins a rebellion against the machines that control it.',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  release_date: '1999-03-31',
  runtime: 136,
  original_language: 'en',
  status: 'Released',
  genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }],
  production_countries: [{ iso_3166_1: 'US', name: 'United States of America' }],
  release_dates: { results: [{ iso_3166_1: 'US', release_dates: [{ certification: 'R' }] }] },
  credits: { crew: [{ id: 9340, name: 'Lana Wachowski', job: 'Director' }], cast: [{ id: 6384, name: 'Keanu Reeves', character: 'Neo', profile_path: '/keanu.jpg' }] }
};

const listFixture = { results: [movieFixture] };
const personFixture = {
  id: 6384,
  name: 'Keanu Reeves',
  biography: 'Keanu Reeves is an actor known for film roles across action, drama, comedy, and science fiction.',
  birthday: '1964-09-02',
  place_of_birth: 'Beirut, Lebanon',
  known_for_department: 'Acting',
  profile_path: '/keanu.jpg',
  combined_credits: { cast: [{ ...movieFixture, media_type: 'movie', popularity: 100 }, { id: 245891, title: 'John Wick', overview: 'An action thriller.', media_type: 'movie', popularity: 90 }, { id: 31011, title: 'Mr. Wick', overview: 'A documentary.', media_type: 'movie', popularity: 80 }] }
};
const popularPeopleFixture = {
  results: [
    {
      id: 6384,
      name: 'Keanu Reeves',
      profile_path: '/keanu.jpg',
      known_for: [
        { id: 603, media_type: 'movie' },
        { id: 245891, media_type: 'movie' },
        { id: 31011, media_type: 'movie' }
      ]
    },
    {
      id: 2930343,
      name: 'Thin Filmography',
      profile_path: '/thin.jpg',
      known_for: [
        { id: 1, media_type: 'movie' },
        { id: 2, media_type: 'tv' }
      ]
    }
  ]
};

const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url.startsWith('https://api.themoviedb.org/3/person/6384')) return Response.json(personFixture);
  if (url.startsWith('https://api.themoviedb.org/3/person/popular')) return Response.json(popularPeopleFixture);
  if (url.startsWith('https://api.themoviedb.org/3/movie/603')) return Response.json(movieFixture);
  if (url.startsWith('https://api.themoviedb.org/3/')) return Response.json(listFixture);
  if (url === 'https://graphql.anilist.co') return Response.json({ data: { Page: { media: [] } } });
  return nativeFetch(input, init);
};

const env = {
  SITE_URL: origin,
  TMDB_API_KEY: 'server-only-test-key',
  ASSETS: {
    async fetch(request) {
      const path = new URL(request.url).pathname;
      return path === '/index.html'
        ? new Response(template, { headers: { 'Content-Type': 'text/html' } })
        : new Response('Not found', { status: 404 });
    }
  }
};

const call = path => worker.fetch(new Request(`${origin}${path}`), env);
const body = response => response.text();
const count = (value, pattern) => (value.match(pattern) || []).length;

const tunnelEnv = { ...env, SITE_URL: undefined };
const tunnelProxyResponse = await worker.fetch(new Request('http://streamnexus.fun/api/tmdb/search/tv?query=Attack%20on%20Titan&include_adult=false', {
  headers: { 'X-Forwarded-Proto': 'https' }
}), tunnelEnv);
assert.equal(tunnelProxyResponse.status, 200, 'TMDB requests behind an HTTPS tunnel must not be redirected to HTTP');
assert.equal(tunnelProxyResponse.headers.get('location'), null);
const tunnelCanonicalResponse = await worker.fetch(new Request('http://streamnexus.fun/MOVIES/', {
  headers: { 'X-Forwarded-Proto': 'https' }
}), tunnelEnv);
assert.equal(tunnelCanonicalResponse.status, 301);
assert.equal(tunnelCanonicalResponse.headers.get('location'), 'https://streamnexus.fun/movies');

const homeResponse = await call('/');
const home = await body(homeResponse);
assert.equal(homeResponse.status, 200);
assert.match(home, /<section class="hero" aria-label="Featured title">/);
assert.match(home, /<img class="hero-art"[^>]+fetchpriority="high"/);
assert.match(home, new RegExp(`<link rel="canonical" href="${origin}/">`));
assert.equal(count(home, /<h1[ >]/g), 1, 'home should have one H1');
assert.equal(count(home, /rel="canonical"/g), 1, 'home should have one canonical');
assert.match(home, /id="streamnexus-bootstrap"/, 'home should include client bootstrap data');
assert.match(home, /rel="preload" as="image"/, 'home should preload its hero image');
assert.equal(count(home, /G-L4BNT7GLBB/g), 2, 'Google Analytics should be configured exactly once');
assert.ok(!home.includes('localhost'), 'production HTML must not contain localhost');
assert.ok(!home.includes('server-only-test-key'), 'server credential must not leak into HTML');

const searchResponse = await call('/search?q=matrix');
const search = await body(searchResponse);
assert.equal(searchResponse.status, 200);
assert.match(search, /name="robots" content="noindex,follow"/);
assert.match(searchResponse.headers.get('x-robots-tag') || '', /noindex/);

const filterResponse = await call('/movies?genre=28');
const filter = await body(filterResponse);
assert.match(filter, /name="robots" content="noindex,follow"/);
assert.match(filter, new RegExp(`<link rel="canonical" href="${origin}/movies">`));

const legacyDetail = await call('/movie/603');
assert.equal(legacyDetail.status, 301);
assert.equal(legacyDetail.headers.get('location'), `${origin}/movie/603-the-matrix`);

const detailResponse = await call('/movie/603-the-matrix');
const detail = await body(detailResponse);
assert.equal(detailResponse.status, 200);
assert.match(detail, /<h1>The Matrix<\/h1>/);
assert.match(detail, /"@type":"Movie"/);
assert.match(detail, /\/person\/9340-lana-wachowski/);
assert.ok(!detail.includes('class="cast-block"'), 'detail pages must not render cast cards');
assert.match(detail, new RegExp(`<link rel="canonical" href="${origin}/movie/603-the-matrix">`));
assert.equal(count(detail, /<h1[ >]/g), 1, 'detail should have one H1');

for (const match of detail.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);

const stableFixtureFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url === 'https://graphql.anilist.co') throw new Error('Simulated AniList timeout');
  return stableFixtureFetch(input, init);
};
const unavailableAnimeResponse = await call('/anime/101922-demon-slayer-kimetsu-no-yaiba');
assert.equal(unavailableAnimeResponse.status, 503, 'an upstream AniList failure must be retryable, not a false 404');
assert.equal(unavailableAnimeResponse.headers.get('retry-after'), '300');
globalThis.fetch = stableFixtureFetch;

const robotsResponse = await call('/robots.txt');
const robots = await body(robotsResponse);
assert.match(robots, /Allow: \//);
assert.match(robots, new RegExp(`Sitemap: ${origin}/sitemap.xml`));

const sitemapIndexResponse = await call('/sitemap.xml');
assert.match(await body(sitemapIndexResponse), /sitemap-static\.xml/);
const staticSitemap = await body(await call('/sitemap-static.xml'));
assert.match(staticSitemap, /\/movies\/genre\/action/);
assert.ok(!staticSitemap.includes('/search'));
assert.ok(!staticSitemap.includes('/my-list'));
assert.ok(!staticSitemap.includes('/contact'));
const peopleSitemap = await body(await call('/sitemap-people.xml'));
assert.match(peopleSitemap, /\/person\/6384-keanu-reeves/);
assert.ok(!peopleSitemap.includes('/person/2930343-thin-filmography'), 'noindex person pages must stay out of the sitemap');
assert.equal(count(peopleSitemap, /\/person\/6384-keanu-reeves/g), 1, 'people sitemap should de-duplicate person IDs');
const movieSitemap = await body(await call('/sitemap-movies.xml'));
assert.equal(count(movieSitemap, /\/movie\/603-the-matrix/g), 1, 'movie sitemap should de-duplicate repeated upstream IDs');
const unavailableSitemapResponse = await worker.fetch(new Request(`${origin}/sitemap-movies.xml`), { SITE_URL: origin, ASSETS: env.ASSETS });
assert.equal(unavailableSitemapResponse.status, 503, 'a total upstream failure must not emit an empty cached sitemap');

const missingResponse = await call('/not-a-real-page');
const missing = await body(missingResponse);
assert.equal(missingResponse.status, 404);
assert.match(missing, /name="robots" content="noindex,follow"/);

const trailing = await call('/movies/');
assert.equal(trailing.status, 301);
assert.equal(trailing.headers.get('location'), `${origin}/movies`);

const previousNetlify = globalThis.Netlify;
globalThis.Netlify = {
  env: {
    get(name) {
      return {
        SITE_URL: 'https://streamnexus.fun',
        TMDB_API_KEY: 'server-only-test-key'
      }[name];
    }
  }
};
const netlifyContext = {
  next: async () => new Response(template, { headers: { 'Content-Type': 'text/html' } })
};
const netlifyAliasResponse = await netlifyHandler(
  new Request('https://streamnexusru.netlify.app/movies'),
  netlifyContext
);
assert.equal(netlifyAliasResponse.status, 301);
assert.equal(netlifyAliasResponse.headers.get('location'), 'https://streamnexus.fun/movies');
const netlifyAliasDetailResponse = await netlifyHandler(
  new Request('https://streamnexusru.netlify.app/movie/603-the-matrix'),
  netlifyContext
);
assert.equal(netlifyAliasDetailResponse.status, 301);
assert.equal(netlifyAliasDetailResponse.headers.get('location'), 'https://streamnexus.fun/movie/603-the-matrix');
const netlifyAliasPersonResponse = await netlifyHandler(
  new Request('https://streamnexusru.netlify.app/person/6384-keanu-reeves'),
  netlifyContext
);
assert.equal(netlifyAliasPersonResponse.status, 301);
assert.equal(netlifyAliasPersonResponse.headers.get('location'), 'https://streamnexus.fun/person/6384-keanu-reeves');
const netlifyCanonicalResponse = await netlifyHandler(
  new Request('https://streamnexus.fun/'),
  netlifyContext
);
assert.equal(netlifyCanonicalResponse.status, 200);
assert.match(await body(netlifyCanonicalResponse), /<link rel="canonical" href="https:\/\/streamnexus\.fun\/">/);
globalThis.Netlify = previousNetlify;

const vercelAssetFetch = async request => new URL(request.url).pathname === '/index.html'
  ? new Response(template, { headers: { 'Content-Type': 'text/html' } })
  : new Response('Not found', { status: 404 });
const vercelEnvironment = {
  SITE_URL: origin,
  TMDB_API_KEY: 'server-only-test-key'
};
const callVercelAt = (requestOrigin, path, headers) => {
  const incoming = new URL(`${requestOrigin}/api/render`);
  const requested = new URL(`${requestOrigin}${path}`);
  incoming.searchParams.set('__path', requested.pathname);
  requested.searchParams.forEach((value, key) => incoming.searchParams.append(key, value));
  return handleVercelRequest(new Request(incoming, { headers }), {
    environment: vercelEnvironment,
    assetFetch: vercelAssetFetch
  });
};
const callVercel = (path, headers) => callVercelAt(origin, path, headers);

const vercelHomeResponse = await callVercel('/', { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' });
assert.equal(vercelHomeResponse.status, 200);
const vercelHome = await body(vercelHomeResponse);
assert.match(vercelHome, new RegExp(`<link rel="canonical" href="${origin}/">`));
assert.match(vercelHome, /<section class="hero" aria-label="Featured title">/);
assert.equal(count(vercelHome, /rel="canonical"/g), 1, 'Vercel home should have one server-rendered canonical');
assert.equal(count(vercelHome, /<h1[ >]/g), 1, 'Vercel home should have one server-rendered H1');

const vercelWwwResponse = await callVercelAt('https://www.streamnexus.example', '/movies/');
assert.equal(vercelWwwResponse.status, 301);
assert.equal(vercelWwwResponse.headers.get('location'), `${origin}/movies`);

const vercelTrackingResponse = await callVercel('/movies?utm_source=inspection');
assert.equal(vercelTrackingResponse.status, 301);
assert.equal(vercelTrackingResponse.headers.get('location'), `${origin}/movies`);

const vercelTmdbResponse = await callVercel('/api/tmdb/movie/603');
assert.equal(vercelTmdbResponse.status, 200);
assert.ok(!(await body(vercelTmdbResponse)).includes('server-only-test-key'), 'Vercel API response must not expose the TMDB credential');
const rejectedTmdbResponse = await callVercel('/api/tmdb/search/movie?query=matrix&unknown=1');
assert.equal(rejectedTmdbResponse.status, 400, 'TMDB proxy must reject unknown parameters');
const vercelRobotsResponse = await callVercel('/robots.txt', { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' });
assert.equal(vercelRobotsResponse.status, 200);
assert.match(await body(vercelRobotsResponse), new RegExp(`Sitemap: ${origin}/sitemap.xml`));
const directVercelFunctionResponse = await handleVercelRequest(new Request(`${origin}/api/render`), {
  environment: vercelEnvironment,
  assetFetch: vercelAssetFetch
});
assert.equal(directVercelFunctionResponse.status, 404);

const vercelConfig = JSON.parse(await readFile(resolve('vercel.json'), 'utf8'));
assert.equal(vercelConfig.framework, 'vite');
assert.equal(vercelConfig.outputDirectory, 'dist');
assert.ok(vercelConfig.routes.some(route => route.handle === 'filesystem'));
assert.ok(vercelConfig.routes.some(route => route.dest?.includes('/api/render')));
const vercelRootRouteIndex = vercelConfig.routes.findIndex(route => route.src === '/' && route.dest === '/api/render?__path=/');
const vercelFilesystemRouteIndex = vercelConfig.routes.findIndex(route => route.handle === 'filesystem');
assert.ok(vercelRootRouteIndex >= 0, 'Vercel must send the homepage through the SEO renderer');
assert.ok(vercelRootRouteIndex < vercelFilesystemRouteIndex, 'homepage SEO route must run before the filesystem handler');

globalThis.fetch = nativeFetch;
console.log('SEO checks passed: rendering, metadata, canonicals, noindex rules, Netlify and Vercel adapters, JSON-LD, robots, sitemaps, and secret isolation.');
