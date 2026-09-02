# StreamNexus

StreamNexus is a React and TypeScript media-discovery application built with Vite. It uses TMDB for movie and TV metadata, AniList for anime metadata, browser local storage for personal lists and progress, and user-initiated third-party playback embeds.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Add either `TMDB_API_KEY` or `TMDB_BEARER_TOKEN` to `.env.local`.
3. Run `npm install`, then `npm run dev`.

The TMDB credential is consumed by the local middleware and production edge worker. It is never bundled into client JavaScript. `VITE_SITE_URL` contains only the public canonical origin and must match `SITE_URL` in production.

## Production deployment

Production is deployed on Vercel. The checked-in `vercel.json` builds `dist`, serves static crawl entry points directly, and sends application routes through `api/render.js` for server-rendered metadata and content.

In **Project Settings > Environment Variables**, add:

- `SITE_URL=https://streamnexus.fun`.
- Either `TMDB_API_KEY` or `TMDB_BEARER_TOKEN` as a server-only value.

Google Analytics measurement ID `G-L4BNT7GLBB` is included once in the shared HTML template, so it covers every client and server-rendered page without duplicate tags.

## Verification

- `npm run typecheck`
- `npm run build`
- `npm run lint`
- `npm run seo:test` after the build
- `npm audit`

The SEO check exercises edge-rendered HTML, route metadata, canonical URLs, robots directives, redirects, structured-data parsing, sitemaps, robots.txt, 404 handling, and server-secret isolation.

See [docs/SEO.md](docs/SEO.md) for the route-indexing policy and deployment checks.
