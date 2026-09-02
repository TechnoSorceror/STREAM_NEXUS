# StreamNexus search-indexing policy

This policy describes the routes that exist in the current application. It intentionally avoids generating language, country, year, season, episode, director, account, authentication, or admin pages until those templates have enough unique, maintainable content.

| Route class | Policy | Reason |
| --- | --- | --- |
| `/` | Index | Primary discovery page with WebSite and publisher data. |
| `/movies`, `/tv-shows`, `/anime` | Index | Canonical catalog hubs with crawlable title links and ItemList markup. |
| Whitelisted `/movies/genre/:slug` and `/tv-shows/genre/:slug` pages | Index when results exist | Each has manually written introductory copy and a curated, finite route inventory. Empty collections are noindex. |
| `/movie/:id-slug`, `/tv/:id-slug`, `/anime/:id-slug`, `/manga/:id-slug` | Index when the source provides a poster and a meaningful summary | The edge response contains factual entity data, breadcrumbs, and matching Movie, TVSeries, or CreativeWorkSeries schema. Thin records are noindex. |
| `/person/:id-slug` | Index when at least three catalog credits exist | Prevents thin person pages while supporting useful actor and creator filmographies. |
| `/about`, `/privacy`, `/editorial-policy` | Index | Trust, source, privacy, and editorial information. |
| `/contact`, `/terms`, `/copyright` | Noindex until owner details are supplied | Templates are integrated, but operator identity, monitored contact details, and legal review require a human decision. |
| `/search` and all search parameters | Noindex, follow | Internal results are visitor-generated and would create duplicate or unbounded URLs. |
| `/my-list` | Noindex, nofollow | Device-specific personal content. |
| Catalog filter, sort, rating, and year query combinations | Noindex, follow; canonical to the catalog hub | Prevents faceted-navigation index bloat. Selected genres use clean landing pages instead. |
| Player and trailer UI states | No separate URL | Heavy embeds load after interaction inside a canonical title page. |
| Season and episode UI states | No separate URL | Current episode data is navigational content within series pages; no standalone episode template exists. |
| `/api/*` | Noindex HTTP header and robots.txt disallow | Machine endpoints are not search documents and return no private credential data. |
| Missing or invalid routes | HTTP 404 and noindex | Prevents soft-404 indexing. |

## Canonical and redirect policy

- `https://streamnexus.fun` is the authoritative HTTPS origin. `https://streamnexusru.netlify.app/*` permanently redirects to the matching path on that origin.
- Netlify must list `streamnexus.fun` as the primary production domain. `SITE_URL` (Functions scope) and `VITE_SITE_URL` (Builds scope) must both use the authoritative origin.
- Non-root trailing slashes, uppercase paths, tracking parameters, numeric-only entity URLs, and incorrect slugs permanently redirect to one clean URL.
- Content filter parameters remain usable but are noindex and canonicalize to the unfiltered hub.
- Media slugs include the stable source ID, so same-name titles remain distinct.

## Sitemap policy

`/sitemap.xml` is a static, always-available index for static, movie, TV, anime, and person sitemaps. Only canonical indexable routes are included. Static pages use the date they were actually revised; dynamic records omit `lastmod` because the external APIs do not expose a trustworthy page-modification timestamp. Dynamic entries are de-duplicated by canonical path. A total upstream failure returns HTTP 503 instead of an empty cached sitemap.

## Deployment checks

1. Keep `streamnexus.fun` as the Vercel production domain and redirect `www` to the apex host.
2. Configure `SITE_URL=https://streamnexus.fun` and one server-only TMDB credential in Vercel.
3. Confirm `/robots.txt`, `/sitemap.xml`, every child sitemap, a catalog page, a title page, and a deliberate 404 from the public host.
4. Confirm the shared Google tag appears once and sends the `G-L4BNT7GLBB` measurement ID.
5. Validate representative JSON-LD with Schema.org Validator and Google Rich Results Test.
6. Submit `https://streamnexus.fun/sitemap.xml` in Google Search Console and Bing Webmaster Tools. Register the custom-domain property, not a hosting subdomain.
