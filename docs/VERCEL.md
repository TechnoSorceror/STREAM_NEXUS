# Deploying StreamNexus on Vercel

Vercel must deploy the project root, not only the `dist` folder. The root contains the Vite source, `vercel.json`, the `api` function, and the shared SEO worker.

## Project settings

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install` (the default)

The checked-in `vercel.json` supplies these settings and sends the homepage plus non-file routes through `api/render.js`. The explicit homepage rule must stay before the filesystem handler so `/` receives server-rendered metadata and content instead of the empty Vite shell. `robots.txt`, the sitemap index, the static sitemap, icons, and hashed assets are served directly from `dist`.

## Environment variables

In Vercel, open **Project → Settings → Environment Variables** and add the same server-side TMDB credential used on Netlify:

- `TMDB_API_KEY`, or
- `TMDB_BEARER_TOKEN`

It is fine to add both. Do not prefix either name with `VITE_`, and never paste a credential into source code.

For the first Vercel test, leave `SITE_URL` unset so the temporary `*.vercel.app` address works. After `streamnexus.fun` has been attached to the Vercel project, set:

```text
SITE_URL=https://streamnexus.fun
```

Environment-variable changes apply only to a new deployment.

## Verification URLs

After deploying, verify these URLs on the Vercel deployment domain before moving DNS:

- `/api/tmdb/movie/popular` returns JSON with HTTP 200.
- `/anime` returns the application and anime catalog data.
- `/robots.txt` returns HTTP 200 and references `https://streamnexus.fun/sitemap.xml`.
- `/sitemap.xml` returns the static XML sitemap index even if an upstream metadata API is unavailable.
- Dynamic child sitemaps return unique canonical URLs, or HTTP 503 on a total upstream failure rather than a cached empty sitemap.
- `/movie/603-the-matrix` returns crawlable HTML.
- A made-up route returns HTTP 404 rather than the homepage with HTTP 200.

## Domain cutover

Only move `streamnexus.fun` after the temporary Vercel deployment passes the checks above. Add the domain under **Project → Settings → Domains**, apply the DNS records Vercel displays, then set `SITE_URL` and perform one final production deployment.

Configure `www.streamnexus.fun` as a permanent domain redirect to `streamnexus.fun` in Vercel. This keeps the apex domain consistent with `SITE_URL`, canonical tags, internal links, and sitemap URLs.
