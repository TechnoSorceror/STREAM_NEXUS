const SITE_NAME = 'StreamNexus';
const SITE_UPDATED = '2026-08-11';
const DEFAULT_DESCRIPTION = 'Discover movies, TV shows, and anime with clear story summaries, release details, genres, trailers, and viewing information.';
const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w342';
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
const ANILIST_API = 'https://graphql.anilist.co';
const INDEX_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
const NOINDEX_ROBOTS = 'noindex,follow';
const TRACKING_PARAMS = /^(utm_.+|gclid|dclid|fbclid|msclkid|ref|source)$/i;
const UPSTREAM_TIMEOUT_MS = 8_000;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

const GENRES = [
  { type: 'movie', id: 28, slug: 'action', name: 'Action', title: 'Action movies', intro: 'Browse action films built around chases, combat, rescues, and high-stakes missions. Each title links to its story summary, release details, trailer, and viewing options.' },
  { type: 'movie', id: 35, slug: 'comedy', name: 'Comedy', title: 'Comedy movies', intro: 'Find comedies across sharp satire, character-driven humor, romantic comedy, and broad crowd-pleasers. Compare release years, story summaries, and related films.' },
  { type: 'movie', id: 18, slug: 'drama', name: 'Drama', title: 'Drama movies', intro: 'Explore dramatic films centered on consequential choices, relationships, personal conflict, and social change, with concise context for choosing what to watch next.' },
  { type: 'movie', id: 27, slug: 'horror', name: 'Horror', title: 'Horror movies', intro: 'Discover supernatural, psychological, creature, and survival horror. Use the title pages to review premise, age rating when verified, runtime, and related stories.' },
  { type: 'movie', id: 10749, slug: 'romance', name: 'Romance', title: 'Romance movies', intro: 'Browse love stories ranging from intimate character pieces to romantic comedy and sweeping period drama, organized around useful title and release information.' },
  { type: 'movie', id: 878, slug: 'science-fiction', name: 'Science Fiction', title: 'Science-fiction movies', intro: 'Explore films about imagined technologies, space travel, altered societies, and first contact. Each listing leads to a factual overview and connected recommendations.' },
  { type: 'tv', id: 10759, slug: 'action-adventure', name: 'Action & Adventure', title: 'Action and adventure TV shows', intro: 'Find serialized adventures, mission-driven thrillers, and large-scale action shows, with season counts, episode navigation, and series context.' },
  { type: 'tv', id: 35, slug: 'comedy', name: 'Comedy', title: 'Comedy TV shows', intro: 'Browse sitcoms, workplace comedies, animated humor, and genre hybrids. Series pages provide premises, seasons, episodes, and similar shows.' },
  { type: 'tv', id: 80, slug: 'crime', name: 'Crime', title: 'Crime TV shows', intro: 'Explore investigations, legal dramas, organized-crime stories, and true-crime series, with clear series summaries and episode-level navigation.' },
  { type: 'tv', id: 18, slug: 'drama', name: 'Drama', title: 'Drama TV shows', intro: 'Discover character-led series and long-form stories across family, workplace, historical, and contemporary drama, organized for easy comparison.' },
  { type: 'tv', id: 9648, slug: 'mystery', name: 'Mystery', title: 'Mystery TV shows', intro: 'Browse puzzle-box series, detective stories, and slow-burn mysteries. Follow each result for series background, seasons, and episode synopses.' },
  { type: 'tv', id: 10765, slug: 'science-fiction-fantasy', name: 'Sci-Fi & Fantasy', title: 'Science-fiction and fantasy TV shows', intro: 'Explore speculative series spanning future worlds, magic, alternate histories, and the supernatural, with clear season and episode context.' }
];

const STATIC_PAGES = {
  '/': { title: 'StreamNexus — Discover Movies, TV Shows & Anime', description: 'Explore movies, TV shows, and anime with story summaries, release details, trailers, related titles, and personal watchlists.', heading: 'Discover movies, TV shows, and anime', intro: 'Explore story summaries, release details, genres, trailers, and related titles across film, television, and anime.' },
  '/movies': { title: 'Movies: Trailers & Release Details | StreamNexus', description: 'Browse current, popular, highly rated, Hindi-language, and genre-based movies with story, trailer, and release information.', heading: 'Movies', intro: 'Browse current, popular, highly rated, Hindi-language, and genre-based films.' },
  '/tv-shows': { title: 'TV Shows: Seasons, Episodes & Details | StreamNexus', description: 'Browse TV shows with series summaries, seasons, episode navigation, trailers, genres, and related recommendations.', heading: 'TV shows', intro: 'Explore series with story summaries, seasons, episodes, genres, and related recommendations.' },
  '/anime': { title: 'Anime Series & Films: Episodes and Details | StreamNexus', description: 'Browse current-season, trending, popular, and highly rated anime with story summaries, formats, episodes, studios, and related titles.', heading: 'Anime', intro: 'Browse current-season, trending, popular, and highly rated anime series and films.' },
  '/about': { title: 'About StreamNexus | StreamNexus', description: 'Learn how StreamNexus organizes movie, TV-show, and anime metadata and how viewing links and watchlists work.', heading: 'About StreamNexus', intro: 'StreamNexus is a media discovery interface for factual title information, artwork, trailers, episode guides, and related recommendations.', sections: [['Data and viewing sources', 'Movie and TV metadata and imagery are supplied by TMDB. Anime metadata is supplied by AniList. StreamNexus is not endorsed or certified by either provider. Video playback, when available, is delivered by third-party embed providers and loads only after a visitor chooses to play a title.'], ['Personal features', 'Saved titles and viewing progress are stored locally in the visitor’s browser. The current site does not provide user accounts or synchronize this information to a StreamNexus database.']] },
  '/privacy': { title: 'Privacy Policy | StreamNexus', description: 'How StreamNexus handles local watchlists, analytics, advertising, third-party media, and technical request data.', heading: 'Privacy policy', intro: 'Watchlists and viewing progress stay in browser local storage. Google Analytics measures aggregate usage, advertising loads after the main page, and players load only when opened.', sections: [['Your choices', 'You can clear local site data, decline to start embedded players, and use browser privacy controls. The site owner must add a monitored privacy contact before public launch.']] },
  '/editorial-policy': { title: 'Editorial and Metadata Policy | StreamNexus', description: 'How StreamNexus selects, labels, and corrects movie, TV, and anime information.', heading: 'Editorial and metadata policy', intro: 'StreamNexus separates factual metadata from interface labels and recommendations. It does not fabricate reviews, availability claims, ratings, credits, or release information.', sections: [['Sources and corrections', 'Movie and TV fields come from TMDB; anime fields come from AniList. Corrections should be verified against the source record, and unavailable fields are stated plainly instead of being invented.']] },
  '/contact': { title: 'Contact | StreamNexus', description: 'Contact information and request categories for StreamNexus.', heading: 'Contact', intro: 'The site owner must add a monitored contact email or form endpoint before public launch.', robots: NOINDEX_ROBOTS },
  '/terms': { title: 'Terms of Use | StreamNexus', description: 'Terms governing use of the StreamNexus media-discovery interface.', heading: 'Terms of use', intro: 'StreamNexus provides discovery features and third-party links or embeds. The operator must obtain legal review and add its identity before launch.', robots: NOINDEX_ROBOTS },
  '/copyright': { title: 'Copyright and Rights-Holder Requests | StreamNexus', description: 'How rights holders can identify content and request review of a StreamNexus page or third-party embed.', heading: 'Copyright and rights-holder requests', intro: 'The site owner must publish a monitored rights-holder contact and response workflow before public launch.', robots: NOINDEX_ROBOTS }
};

const esc = (value = '') => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const xml = (value = '') => esc(value);
const stripHtml = (value = '') => String(value).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const slugify = (value = '') => stripHtml(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'title';
const cleanPath = path => path === '/' ? '/' : path.replace(/\/+$/, '');
const absolute = (origin, path) => new URL(path || '/', `${origin}/`).toString();
const mediaPath = item => `/${item.type}/${item.id}-${slugify(item.title)}`;
const personPath = person => `/person/${person.id}-${slugify(person.name)}`;

const configuredOrigin = (request, env) => {
  const candidate = String(env.SITE_URL || '').replace(/\/$/, '');
  try {
    const url = new URL(candidate);
    if (url.protocol === 'https:' && !/^(localhost|127\.0\.0\.1)$/i.test(url.hostname)) return url.origin;
  } catch { /* Fall back to the request origin when SITE_URL is absent or invalid. */ }
  const requestUrl = new URL(request.url);
  const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0].trim().toLowerCase();
  let cloudflareProtocol = '';
  try { cloudflareProtocol = JSON.parse(request.headers.get('cf-visitor') || '{}').scheme || ''; }
  catch { /* Ignore malformed proxy metadata. */ }
  if (forwardedProtocol === 'https' || cloudflareProtocol === 'https') requestUrl.protocol = 'https:';
  return requestUrl.origin;
};

const securityHeaders = (contentType = 'text/html; charset=UTF-8') => ({
  'Content-Type': contentType,
  'Referrer-Policy': 'no-referrer-when-downgrade',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' https://image.tmdb.org https://s4.anilist.co https://picsum.photos data:; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://conventionalresponse.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://api.themoviedb.org https://graphql.anilist.co https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com; frame-src 'self' https://vidsrc.icu https://vidsrc-embed.ru https://vidsrc.sbs https://vidsrc.net https://multiembed.mov https://www.youtube.com https://conventionalresponse.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'",
  'Vary': 'Accept-Encoding'
});

const response = (body, status = 200, headers = {}) => new Response(body, { status, headers: { ...securityHeaders(), ...headers } });
const textResponse = (body, contentType, headers = {}) => new Response(body, { headers: { ...securityHeaders(contentType), ...headers } });

const tmdbHeaders = env => env.TMDB_BEARER_TOKEN
  ? { Authorization: `Bearer ${env.TMDB_BEARER_TOKEN}`, Accept: 'application/json' }
  : { Accept: 'application/json' };

const wait = milliseconds => new Promise(resolve => globalThis.setTimeout(resolve, milliseconds));
const fetchUpstream = async (resource, options = {}) => {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new globalThis.AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    try {
      const result = await fetch(resource, { ...options, signal: controller.signal });
      if (attempt === 0 && RETRYABLE_STATUS.has(result.status)) {
        await wait(result.status === 429 ? 900 : 300);
        continue;
      }
      return result;
    } catch (error) {
      lastError = error;
      if (attempt === 0) { await wait(250); continue; }
    } finally {
      globalThis.clearTimeout(timeout);
    }
  }
  throw lastError || new Error('Upstream request failed');
};

const fetchTmdb = async (endpoint, params, env) => {
  if (!env.TMDB_API_KEY && !env.TMDB_BEARER_TOKEN) return null;
  const query = new URLSearchParams(params || {});
  if (env.TMDB_API_KEY) query.set('api_key', env.TMDB_API_KEY);
  try {
    const result = await fetchUpstream(`${TMDB_API}${endpoint}?${query}`, { headers: tmdbHeaders(env), cf: { cacheTtl: 3600, cacheEverything: true } });
    return result.ok ? result.json() : null;
  } catch {
    return null;
  }
};

const fetchAniList = async (query, variables) => {
  try {
    const result = await fetchUpstream(ANILIST_API, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ query, variables }) });
    return result.ok ? result.json() : null;
  } catch {
    return null;
  }
};

const animeQuery = `query ($id: Int, $perPage: Int) { Page(page: 1, perPage: $perPage) { media(id: $id, type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: false) { id title { english romaji } coverImage { extraLarge } bannerImage description averageScore startDate { year month day } genres status format episodes duration countryOfOrigin studios(isMain: true) { nodes { name } } } } }`;
const mangaQuery = `query ($id: Int) { Page(page: 1, perPage: 1) { media(id: $id, type: MANGA, isAdult: false) { id title { english romaji } coverImage { extraLarge } bannerImage description averageScore startDate { year month day } genres status format chapters countryOfOrigin } } }`;

const mapTmdbList = (item, type) => ({ id: item.id, tmdbId: item.id, type, title: item.title || item.name || 'Untitled', description: item.overview || '', poster: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : '', banner: item.backdrop_path ? `${TMDB_BACKDROP}${item.backdrop_path}` : '', releaseDate: item.release_date || item.first_air_date || '', rating: Number(item.vote_average) || 0, genres: [] });
const mapAnime = (item, type = 'anime') => ({ id: item.id, type, title: item.title?.english || item.title?.romaji || 'Untitled', description: stripHtml(item.description), poster: item.coverImage?.extraLarge || '', banner: item.bannerImage || item.coverImage?.extraLarge || '', releaseDate: item.startDate?.year ? `${item.startDate.year}-${String(item.startDate.month || 1).padStart(2, '0')}-${String(item.startDate.day || 1).padStart(2, '0')}` : '', genres: item.genres || [], status: item.status, format: item.format, episodes: item.episodes, chapters: item.chapters, runtime: item.duration, country: item.countryOfOrigin, studios: item.studios?.nodes?.map(studio => studio.name) || [] });
const tmdbImageAt = (url, size) => String(url || '').replace(/^(https:\/\/image\.tmdb\.org\/t\/p\/)(?:w\d+|original)(\/.*)$/i, `$1${size}$2`);
const backdropSet = url => [tmdbImageAt(url, 'w780'), tmdbImageAt(url, 'w1280'), tmdbImageAt(url, 'original')].map((item, index) => `${item} ${[780, 1280, 1920][index]}w`).join(', ');
const posterSet = url => [tmdbImageAt(url, 'w185'), tmdbImageAt(url, 'w342'), tmdbImageAt(url, 'w500')].map((item, index) => `${item} ${[185, 342, 500][index]}w`).join(', ');

const nav = origin => `<a class="skip-link" href="#main-content">Skip to main content</a><header class="site-nav is-scrolled"><nav class="shell nav-inner" aria-label="Primary navigation"><a class="brand" href="${origin}/"><b>Stream<span>Nexus</span></b></a><div class="desktop-links"><a href="${origin}/">Discover</a><a href="${origin}/movies">Movies</a><a href="${origin}/tv-shows">Series</a><a href="${origin}/anime">Anime</a></div></nav></header>`;
const footer = origin => `<footer class="site-footer"><div class="shell footer-grid"><div class="footer-brand"><strong>StreamNexus</strong></div><p>Movie, TV-show, and anime discovery with factual source attribution.</p></div><div class="shell footer-bottom"><nav aria-label="Site information"><a href="${origin}/about">About</a><a href="${origin}/editorial-policy">Editorial policy</a><a href="${origin}/contact">Contact</a><a href="${origin}/privacy">Privacy</a><a href="${origin}/terms">Terms</a><a href="${origin}/copyright">Copyright</a></nav></div></footer>`;
const breadcrumbs = (origin, items) => `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${items.map((item, index) => `<li>${item.path && index < items.length - 1 ? `<a href="${absolute(origin, item.path)}">${esc(item.name)}</a>` : `<span${index === items.length - 1 ? ' aria-current="page"' : ''}>${esc(item.name)}</span>`}</li>`).join('')}</ol></nav>`;
const shell = (origin, main) => `<div class="app-shell seo-rendered">${nav(origin)}<main id="main-content">${main}</main>${footer(origin)}</div>`;

const cards = (origin, items) => `<div class="media-grid seo-card-grid">${items.map(item => `<article class="media-card"><a href="${absolute(origin, mediaPath(item))}">${item.poster ? `<div class="poster-wrap"><img src="${esc(item.poster)}"${item.poster.includes('image.tmdb.org') ? ` srcset="${esc(posterSet(item.poster))}" sizes="(max-width: 640px) 42vw, (max-width: 1100px) 24vw, 210px"` : ''} width="342" height="513" alt="Poster for ${esc(item.title)}${item.releaseDate?.slice(0, 4) ? ` (${esc(item.releaseDate.slice(0, 4))})` : ''}" loading="lazy" decoding="async"></div>` : ''}<div class="card-copy"><h3>${esc(item.title)}</h3>${item.releaseDate ? `<p>${esc(item.releaseDate.slice(0, 4))}</p>` : ''}</div></a></article>`).join('')}</div>`;

const homeHero = (origin, item) => {
  const artwork = item.banner || item.poster;
  const year = item.releaseDate?.slice(0, 4);
  return `<section class="hero" aria-label="Featured title">${artwork ? `<img class="hero-art" src="${esc(tmdbImageAt(artwork, 'w780'))}" srcset="${esc(backdropSet(artwork))}" sizes="100vw" alt="" aria-hidden="true" width="1280" height="720" fetchpriority="high" decoding="async">` : ''}<div class="hero-scrim"></div><div class="shell hero-layout"><div class="hero-copy"><div class="eyebrow">Tonight's spotlight</div><h1>${esc(item.title)}</h1><div class="hero-facts">${item.rating ? `<strong>${Math.round(item.rating * 10)}% match</strong>` : '<strong>New</strong>'}${year ? `<span>${esc(year)}</span>` : ''}<span>${item.type === 'tv' ? 'Series' : 'Film'}</span></div><p>${esc(item.description || 'Explore release and story information for this featured title.')}</p><div class="hero-actions"><a class="button button-primary" href="${absolute(origin, mediaPath(item))}">View title</a><a class="button button-quiet" href="${absolute(origin, mediaPath(item))}">Details</a></div></div></div></section>`;
};

const pageSchema = (origin, path, page, items = []) => ({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': path === '/' ? 'WebSite' : 'CollectionPage', name: page.heading, url: absolute(origin, path), description: page.description, isPartOf: path === '/' ? undefined : { '@type': 'WebSite', name: SITE_NAME, url: absolute(origin, '/') } },
    ...(path === '/' ? [{ '@type': 'Organization', name: SITE_NAME, url: absolute(origin, '/'), publishingPrinciples: absolute(origin, '/editorial-policy') }] : []),
    ...(items.length ? [{ '@type': 'ItemList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.title, url: absolute(origin, mediaPath(item)) })) }] : [])
  ].map(item => Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined)))
});

const inject = (template, meta, content, schema) => {
  const title = esc(meta.title || SITE_NAME);
  const description = esc((meta.description || DEFAULT_DESCRIPTION).slice(0, 320));
  const image = esc(meta.image);
  const canonical = esc(meta.canonical);
  const bootstrap = meta.bootstrap ? `<script id="streamnexus-bootstrap" type="application/json">${JSON.stringify(meta.bootstrap).replace(/</g, '\\u003c')}</script>` : '';
  const preload = meta.preloadImage ? `<link rel="preload" as="image" href="${esc(meta.preloadImage)}" imagesrcset="${esc(backdropSet(meta.preloadImage))}" imagesizes="100vw" fetchpriority="high">` : '';
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${description}">`)
    .replace(/<meta name="robots"[^>]*>/i, `<meta name="robots" content="${esc(meta.robots || INDEX_ROBOTS)}">`)
    .replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${description}">`)
    .replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${image}">`)
    .replace(/<meta property="og:type"[^>]*>/i, `<meta property="og:type" content="${esc(meta.type || 'website')}">`)
    .replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${title}">`)
    .replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${description}">`)
    .replace(/<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${image}">`)
    .replace('</head>', `${preload}${bootstrap}<link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="en" href="${canonical}"><link rel="alternate" hreflang="x-default" href="${canonical}"><meta property="og:url" content="${canonical}">${schema ? `<script type="application/ld+json" data-streamnexus-jsonld="true">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>` : ''}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${content}</div>`);
  return html;
};

const assetTemplate = async (request, env) => {
  if (!env.ASSETS) return null;
  const asset = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
  return asset.ok ? asset.text() : null;
};

const htmlResponse = async (request, env, meta, main, schema, status = 200) => {
  const origin = configuredOrigin(request, env);
  const template = await assetTemplate(request, env);
  if (!template) return response('Static asset binding unavailable', 503, { 'X-Robots-Tag': 'noindex, nofollow' });
  const html = inject(template, { ...meta, image: meta.image || absolute(origin, '/og-seo.jpg'), canonical: meta.canonical || absolute(origin, new URL(request.url).pathname) }, shell(origin, main), schema);
  const robots = meta.robots || INDEX_ROBOTS;
  return response(html, status, { 'Cache-Control': status === 200 ? 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' : 'no-store', 'X-Robots-Tag': robots.startsWith('noindex') ? 'noindex, follow' : INDEX_ROBOTS });
};

const listingFor = async (path, env) => {
  if (path === '/anime') {
    const data = await fetchAniList(animeQuery, { perPage: 20 });
    return (data?.data?.Page?.media || []).map(item => mapAnime(item));
  }
  const type = path === '/movies' || path === '/' ? 'movie' : 'tv';
  const endpoint = path === '/' ? `/trending/${type}/day` : `/${type}/popular`;
  const data = await fetchTmdb(endpoint, {}, env);
  return (data?.results || []).slice(0, 20).map(item => mapTmdbList(item, type));
};

const renderStatic = async (request, env, path) => {
  const origin = configuredOrigin(request, env);
  const page = STATIC_PAGES[path];
  const items = ['/', '/movies', '/tv-shows', '/anime'].includes(path) ? await listingFor(path, env) : [];
  const sections = (page.sections || []).map(([heading, copy]) => `<section><h2>${esc(heading)}</h2><p>${esc(copy)}</p></section>`).join('');
  const primaryLinks = path === '/' ? `<nav class="seo-primary-links" aria-label="Browse the catalog"><a href="${origin}/movies">Browse movies</a><a href="${origin}/tv-shows">Browse TV shows</a><a href="${origin}/anime">Browse anime</a></nav>` : '';
  const crumb = path === '/' ? '' : breadcrumbs(origin, [{ name: 'Home', path: '/' }, { name: page.heading }]);
  const main = path === '/' && items.length
    ? `${homeHero(origin, items[0])}<article class="browse-page shell seo-page">${primaryLinks}<section aria-labelledby="popular-heading"><h2 id="popular-heading">Popular titles</h2>${cards(origin, items)}</section></article>`
    : `<article class="browse-page shell seo-page">${crumb}<header class="browse-header"><div><div class="eyebrow">StreamNexus catalog</div><h1>${esc(page.heading)}</h1><p>${esc(page.intro)}</p></div></header>${primaryLinks}${sections}${items.length ? `<section aria-labelledby="popular-heading"><h2 id="popular-heading">Popular ${esc(page.heading.toLowerCase())}</h2>${cards(origin, items)}</section>` : ''}</article>`;
  const filtered = new URL(request.url).searchParams.size > 0;
  const robots = page.robots || (filtered ? NOINDEX_ROBOTS : INDEX_ROBOTS);
  const bootstrap = path === '/' && items.length ? { home: { trendingMovies: items } } : undefined;
  const preloadImage = path === '/' ? items.find(item => item.banner)?.banner : undefined;
  return htmlResponse(request, env, { ...page, robots, canonical: absolute(origin, path), bootstrap, preloadImage }, main, robots.startsWith('noindex') ? undefined : pageSchema(origin, path, page, items));
};

const renderGenre = async (request, env, type, slug) => {
  const origin = configuredOrigin(request, env);
  const genre = GENRES.find(item => item.type === type && item.slug === slug);
  if (!genre) return renderNotFound(request, env);
  const data = await fetchTmdb(`/discover/${type}`, { with_genres: String(genre.id), sort_by: 'popularity.desc', include_adult: 'false' }, env);
  const items = (data?.results || []).slice(0, 20).map(item => mapTmdbList(item, type));
  const path = `/${type === 'movie' ? 'movies' : 'tv-shows'}/genre/${slug}`;
  const parent = type === 'movie' ? 'Movies' : 'TV shows';
  const main = `<article class="browse-page shell seo-page">${breadcrumbs(origin, [{ name: 'Home', path: '/' }, { name: parent, path: type === 'movie' ? '/movies' : '/tv-shows' }, { name: genre.name }])}<header class="browse-header"><div><div class="eyebrow">Curated by genre</div><h1>${esc(genre.title)}</h1><p>${esc(genre.intro)}</p></div></header>${items.length ? `<section aria-labelledby="genre-results"><h2 id="genre-results">Popular ${esc(genre.name.toLowerCase())} titles</h2>${cards(origin, items)}</section>` : '<p>Catalog results are temporarily unavailable.</p>'}</article>`;
  const robots = items.length ? INDEX_ROBOTS : NOINDEX_ROBOTS;
  const schema = items.length ? { '@context': 'https://schema.org', '@graph': [{ '@type': 'CollectionPage', name: genre.title, description: genre.intro, url: absolute(origin, path) }, { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: absolute(origin, '/') }, { '@type': 'ListItem', position: 2, name: parent, item: absolute(origin, type === 'movie' ? '/movies' : '/tv-shows') }, { '@type': 'ListItem', position: 3, name: genre.name, item: absolute(origin, path) }] }, { '@type': 'ItemList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.title, url: absolute(origin, mediaPath(item)) })) }] } : undefined;
  return htmlResponse(request, env, { title: `${genre.title}: Stories & Details | ${SITE_NAME}`, description: genre.intro, robots, canonical: absolute(origin, path) }, main, schema);
};

const tmdbDetail = async (id, type, env) => {
  const data = await fetchTmdb(`/${type}/${id}`, { append_to_response: 'external_ids,videos,credits,release_dates,content_ratings' }, env);
  if (!data?.id) return null;
  const base = mapTmdbList(data, type);
  const people = type === 'movie' ? (data.credits?.crew || []).filter(person => person.job === 'Director').slice(0, 5) : (data.created_by || []);
  const usRelease = data.release_dates?.results?.find(entry => entry.iso_3166_1 === 'US');
  return { ...base, genres: (data.genres || []).map(genre => genre.name), status: data.status, runtime: type === 'movie' ? data.runtime : data.episode_run_time?.[0], seasons: data.number_of_seasons, episodes: data.number_of_episodes, language: data.original_language, countries: (data.production_countries?.length ? data.production_countries : data.origin_country || []).map(country => typeof country === 'string' ? country : country.name || country.iso_3166_1), ageRating: type === 'movie' ? usRelease?.release_dates?.find(entry => entry.certification)?.certification : data.content_ratings?.results?.find(entry => entry.iso_3166_1 === 'US')?.rating, people: people.map(person => ({ id: person.id, name: person.name })) };
};

const renderDetail = async (request, env, routeType, id) => {
  const origin = configuredOrigin(request, env);
  let item;
  if (routeType === 'movie' || routeType === 'tv') item = await tmdbDetail(id, routeType, env);
  else {
    const data = await fetchAniList(routeType === 'anime' ? animeQuery : mangaQuery, { id, perPage: 1 });
    if (!data) return renderServiceUnavailable(request, env, 'Title data is temporarily unavailable');
    const raw = data?.data?.Page?.media?.[0];
    item = raw ? mapAnime(raw, routeType) : null;
  }
  if (!item) return renderNotFound(request, env, 'Title unavailable');
  const canonicalPath = mediaPath(item);
  const url = new URL(request.url);
  if (url.origin !== origin || cleanPath(url.pathname) !== canonicalPath) return Response.redirect(`${origin}${canonicalPath}`, 301);
  const year = item.releaseDate?.slice(0, 4);
  const isMovie = item.type === 'movie' || (item.type === 'anime' && item.format === 'MOVIE');
  const isSeries = item.type === 'tv' || (item.type === 'anime' && item.format !== 'MOVIE');
  const title = isMovie ? `${item.title}${year ? ` (${year})` : ''}: Story & Details | ${SITE_NAME}` : `${item.title}: ${isSeries ? 'Seasons, Episodes & Details' : 'Story & Details'} | ${SITE_NAME}`;
  const description = (item.description || `Explore release details, genres, and related information for ${item.title}.`).slice(0, 160);
  const browsePath = item.type === 'movie' ? '/movies' : item.type === 'tv' ? '/tv-shows' : '/anime';
  const browseName = item.type === 'movie' ? 'Movies' : item.type === 'tv' ? 'TV shows' : item.type === 'anime' ? 'Anime' : 'Manga';
  const facts = [[item.type === 'tv' ? 'First aired' : 'Release date', item.releaseDate], ['Runtime', item.runtime ? `${item.runtime} minutes` : ''], ['Original language', item.language || item.country], ['Country of origin', item.countries?.join(', ')], ['US age rating', item.ageRating], ['Status', item.status], ['Seasons', item.seasons], ['Episodes', item.episodes]].filter(([, value]) => value);
  const genreLinks = (item.genres || []).map(name => { const genre = GENRES.find(entry => entry.type === (item.type === 'movie' ? 'movie' : 'tv') && entry.name.toLowerCase() === name.toLowerCase()); return genre ? `<a href="${origin}/${item.type === 'movie' ? 'movies' : 'tv-shows'}/genre/${genre.slug}">${esc(name)}</a>` : `<span>${esc(name)}</span>`; }).join('');
  const people = (item.people || []).map(person => `<a href="${absolute(origin, personPath(person))}">${esc(person.name)}</a>`).join('');
  const main = `<article class="detail-page seo-detail"><div class="shell detail-breadcrumbs">${breadcrumbs(origin, [{ name: 'Home', path: '/' }, { name: browseName, path: browsePath }, { name: item.title }])}</div><section class="detail-hero">${item.banner ? `<img class="detail-backdrop" src="${esc(item.banner)}" width="1920" height="1080" alt="" fetchpriority="high">` : ''}<div class="detail-shade"></div><div class="shell detail-layout">${item.poster ? `<img class="detail-poster" src="${esc(item.poster)}" width="500" height="750" alt="Poster for ${esc(item.title)}${year ? ` (${esc(year)})` : ''}">` : ''}<div class="detail-copy"><div class="eyebrow">${esc(browseName)} / ${esc(item.status || 'Catalog record')}</div><h1>${esc(item.title)}</h1>${year ? `<p class="detail-year">${esc(year)}</p>` : ''}<p>${esc(item.description || 'A story summary is not available.')}</p></div></div></section><div class="shell detail-content"><section class="detail-summary"><h2>About ${esc(item.title)}</h2>${facts.length ? `<dl class="fact-grid">${facts.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>` : ''}${genreLinks ? `<div class="entity-links"><h3>Genres</h3><div>${genreLinks}</div></div>` : ''}${people ? `<div class="entity-links"><h3>${item.type === 'movie' ? 'Directed by' : 'Created by'}</h3><div>${people}</div></div>` : ''}<div class="availability-note"><h3>Viewing information</h3><p>Player availability is checked only after it is opened. StreamNexus does not currently verify subscription requirements, licensing, or territory availability.</p></div><p class="source-note">Metadata is supplied by ${item.type === 'anime' || item.type === 'manga' ? 'AniList' : 'TMDB'}.</p></section></div></article>`;
  const schemaType = isMovie ? 'Movie' : item.type === 'manga' ? 'CreativeWorkSeries' : 'TVSeries';
  const entity = { '@type': schemaType, '@id': `${absolute(origin, canonicalPath)}#title`, name: item.title, url: absolute(origin, canonicalPath), mainEntityOfPage: absolute(origin, canonicalPath), description: item.description || undefined, image: item.poster || undefined, datePublished: item.releaseDate || undefined, genre: item.genres?.length ? item.genres : undefined, duration: item.runtime ? `PT${item.runtime}M` : undefined, inLanguage: item.language || undefined, contentRating: item.ageRating || undefined, countryOfOrigin: item.countries?.map(name => ({ '@type': 'Country', name })), [item.type === 'movie' ? 'director' : 'creator']: item.people?.map(person => ({ '@type': 'Person', name: person.name, url: absolute(origin, personPath(person)) })) };
  Object.keys(entity).forEach(key => entity[key] === undefined && delete entity[key]);
  const schema = { '@context': 'https://schema.org', '@graph': [entity, { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: absolute(origin, '/') }, { '@type': 'ListItem', position: 2, name: browseName, item: absolute(origin, browsePath) }, { '@type': 'ListItem', position: 3, name: item.title, item: absolute(origin, canonicalPath) }] }] };
  const robots = item.description?.length >= 60 && item.poster ? INDEX_ROBOTS : NOINDEX_ROBOTS;
  return htmlResponse(request, env, { title, description, image: item.banner || item.poster || absolute(origin, '/og-seo.jpg'), type: isMovie ? 'video.movie' : isSeries ? 'video.tv_show' : 'website', robots, canonical: absolute(origin, canonicalPath) }, main, schema);
};

const renderPerson = async (request, env, id) => {
  const origin = configuredOrigin(request, env);
  const data = await fetchTmdb(`/person/${id}`, { append_to_response: 'combined_credits' }, env);
  if (!data?.id) return renderNotFound(request, env, 'Person unavailable');
  const path = personPath(data);
  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== origin || cleanPath(requestUrl.pathname) !== path) return Response.redirect(`${origin}${path}`, 301);
  const credits = (data.combined_credits?.cast || []).filter(item => item.media_type === 'movie' || item.media_type === 'tv').sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).filter((item, index, list) => list.findIndex(other => other.id === item.id && other.media_type === item.media_type) === index).slice(0, 30).map(item => mapTmdbList(item, item.media_type));
  const profile = data.profile_path ? `${TMDB_IMAGE}${data.profile_path}` : '';
  const description = stripHtml(data.biography).slice(0, 155) || `Explore ${data.name}'s movies and TV shows, known roles, and career information.`;
  const main = `<article class="person-page shell">${breadcrumbs(origin, [{ name: 'Home', path: '/' }, { name: data.name }])}<header class="person-header">${profile ? `<img src="${profile}" width="500" height="750" alt="Portrait of ${esc(data.name)}" fetchpriority="high">` : ''}<div><div class="eyebrow">${esc(data.known_for_department || 'Film and television')}</div><h1>${esc(data.name)}</h1>${data.birthday ? `<p>Born ${esc(data.birthday)}${data.place_of_birth ? ` in ${esc(data.place_of_birth)}` : ''}</p>` : ''}<p>${esc(data.biography || 'A public biography is not available. The filmography is ordered by current catalog relevance.')}</p></div></header><section><h2>Movies and TV shows</h2>${credits.length ? cards(origin, credits) : '<p>No matching catalog credits are available.</p>'}</section></article>`;
  const schema = { '@context': 'https://schema.org', '@graph': [{ '@type': 'Person', '@id': `${absolute(origin, path)}#person`, name: data.name, url: absolute(origin, path), image: profile || undefined, birthDate: data.birthday || undefined, deathDate: data.deathday || undefined, birthPlace: data.place_of_birth ? { '@type': 'Place', name: data.place_of_birth } : undefined }, { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: absolute(origin, '/') }, { '@type': 'ListItem', position: 2, name: data.name, item: absolute(origin, path) }] }] };
  const robots = credits.length >= 3 ? INDEX_ROBOTS : NOINDEX_ROBOTS;
  return htmlResponse(request, env, { title: `${data.name} Movies & TV Shows | ${SITE_NAME}`, description, image: profile || absolute(origin, '/og-seo.jpg'), type: 'profile', robots, canonical: absolute(origin, path) }, main, schema);
};

const renderNoindex = async (request, env, path) => {
  const origin = configuredOrigin(request, env);
  const isList = path === '/my-list';
  const heading = isList ? 'My list' : 'Search the catalog';
  const main = `<article class="browse-page shell seo-page">${breadcrumbs(origin, [{ name: 'Home', path: '/' }, { name: heading }])}<header class="browse-header"><div><h1>${heading}</h1><p>${isList ? 'Your saved titles are stored locally on this device.' : 'Search results are generated for visitors and are not included in the public search index.'}</p></div></header></article>`;
  return htmlResponse(request, env, { title: `${heading} | ${SITE_NAME}`, description: isList ? 'Your device-local StreamNexus watchlist.' : 'Search the StreamNexus movie, TV-show, and anime catalog.', robots: isList ? 'noindex,nofollow' : NOINDEX_ROBOTS, canonical: absolute(origin, path) }, main, undefined);
};

async function renderNotFound(request, env, heading = 'Page not found') {
  const origin = configuredOrigin(request, env);
  const main = `<article class="empty-state detail-missing"><h1>${esc(heading)}</h1><p>The requested address does not have a usable catalog page.</p><a href="${origin}/">Return to StreamNexus</a></article>`;
  return htmlResponse(request, env, { title: `${heading} | ${SITE_NAME}`, description: 'The requested StreamNexus page could not be found.', robots: NOINDEX_ROBOTS, canonical: absolute(origin, new URL(request.url).pathname) }, main, undefined, 404);
}

async function renderServiceUnavailable(request, env, heading = 'Service temporarily unavailable') {
  const origin = configuredOrigin(request, env);
  const main = `<article class="empty-state detail-missing"><h1>${esc(heading)}</h1><p>The upstream catalog did not respond in time. Please try this page again shortly.</p><a href="${origin}/">Return to StreamNexus</a></article>`;
  const result = await htmlResponse(request, env, { title: `${heading} | ${SITE_NAME}`, description: 'The requested StreamNexus catalog data is temporarily unavailable.', robots: NOINDEX_ROBOTS, canonical: absolute(origin, new URL(request.url).pathname) }, main, undefined, 503);
  result.headers.set('Retry-After', '300');
  return result;
}

const robotsTxt = origin => `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`;
const sitemapIndex = origin => `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['static', 'movies', 'tv', 'anime', 'people'].map(name => `<sitemap><loc>${xml(`${origin}/sitemap-${name}.xml`)}</loc></sitemap>`).join('')}</sitemapindex>`;
const sitemapUrlset = (origin, entries) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${entries.map(entry => `<url><loc>${xml(absolute(origin, entry.path))}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}${entry.image ? `<image:image><image:loc>${xml(entry.image)}</image:loc>${entry.title ? `<image:title>${xml(`Poster for ${entry.title}`)}</image:title>` : ''}</image:image>` : ''}</url>`).join('')}</urlset>`;
const dedupeSitemapEntries = entries => {
  const seen = new Set();
  return entries.filter(entry => {
    if (!entry?.path || seen.has(entry.path)) return false;
    seen.add(entry.path);
    return true;
  });
};

const dynamicSitemap = async (kind, origin, env) => {
  if (kind === 'anime') {
    const data = await fetchAniList(animeQuery, { perPage: 50 });
    if (!data) return null;
    return dedupeSitemapEntries((data.data?.Page?.media || []).map(raw => mapAnime(raw)).filter(item => item.poster && item.description.length >= 60).map(item => ({ path: mediaPath(item), image: item.poster, title: item.title })));
  }
  const endpointType = kind === 'movies' ? 'movie' : kind === 'tv' ? 'tv' : 'person';
  const pages = await Promise.all([1, 2, 3, 4, 5].map(page => fetchTmdb(endpointType === 'person' ? '/person/popular' : `/${endpointType}/popular`, { page: String(page) }, env)));
  if (pages.every(page => !page)) return null;
  const raw = pages.flatMap(page => page?.results || []);
  if (endpointType === 'person') {
    const seen = new Set();
    return raw.filter(item => {
      if (!item?.id || !item.name || seen.has(item.id)) return false;
      seen.add(item.id);
      const knownCredits = (item.known_for || [])
        .filter(credit => credit.media_type === 'movie' || credit.media_type === 'tv')
        .filter((credit, index, list) => list.findIndex(other => other.id === credit.id && other.media_type === credit.media_type) === index);
      // Person pages require at least three catalog credits to be indexable.
      // `known_for` is a conservative sitemap filter; omitted people remain
      // discoverable through the people sitemap and creator links.
      return knownCredits.length >= 3;
    }).map(item => ({ path: personPath(item), image: item.profile_path ? `${TMDB_IMAGE}${item.profile_path}` : '', title: item.name }));
  }
  return dedupeSitemapEntries(raw.map(rawItem => mapTmdbList(rawItem, endpointType)).filter(item => item.poster && item.description.length >= 60).map(item => ({ path: mediaPath(item), image: item.poster, title: item.title })));
};

const serveSitemap = async (request, env, name) => {
  const origin = configuredOrigin(request, env);
  if (!name) return textResponse(sitemapIndex(origin), 'application/xml; charset=UTF-8', { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' });
  if (name === 'static') {
    const entries = ['/', '/movies', '/tv-shows', '/anime', '/about', '/privacy', '/editorial-policy'].map(path => ({ path, lastmod: SITE_UPDATED }));
    if (env.TMDB_API_KEY || env.TMDB_BEARER_TOKEN) GENRES.forEach(genre => entries.push({ path: `/${genre.type === 'movie' ? 'movies' : 'tv-shows'}/genre/${genre.slug}`, lastmod: SITE_UPDATED }));
    return textResponse(sitemapUrlset(origin, entries), 'application/xml; charset=UTF-8', { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' });
  }
  const entries = await dynamicSitemap(name, origin, env);
  if (entries === null) return response('Sitemap source is temporarily unavailable', 503, { 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': 'no-store', 'Retry-After': '300', 'X-Robots-Tag': 'noindex, nofollow' });
  return textResponse(sitemapUrlset(origin, entries), 'application/xml; charset=UTF-8', { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' });
};

const TMDB_ENDPOINT_RULES = [
  /^\/genre\/(movie|tv)\/list$/,
  /^\/trending\/(movie|tv)\/day$/,
  /^\/(movie|tv)\/(popular|top_rated)$/,
  /^\/discover\/(movie|tv)$/,
  /^\/(movie|tv)\/\d+$/,
  /^\/tv\/\d+\/season\/\d+$/,
  /^\/collection\/\d+$/,
  /^\/(movie|tv)\/\d+\/recommendations$/,
  /^\/search\/(multi|movie|tv)$/,
  /^\/person\/\d+$/
];
const DISCOVER_PARAMS = new Set(['with_genres', 'sort_by', 'primary_release_year', 'first_air_date_year', 'vote_average.gte', 'vote_count.gte', 'with_original_language', 'page']);
const SEARCH_PARAMS = new Set(['query', 'include_adult', 'page']);
const DETAIL_PARAMS = new Set(['append_to_response']);
const PAGE_PARAMS = new Set(['page']);
const ALLOWED_APPEND = new Set(['external_ids', 'videos', 'credits', 'release_dates', 'content_ratings', 'combined_credits']);

const validateTmdbRequest = (endpoint, params) => {
  if (endpoint.length > 120 || !TMDB_ENDPOINT_RULES.some(rule => rule.test(endpoint)) || [...params.keys()].length > 10) return false;
  let allowed = PAGE_PARAMS;
  if (endpoint.startsWith('/discover/')) allowed = DISCOVER_PARAMS;
  else if (endpoint.startsWith('/search/')) allowed = SEARCH_PARAMS;
  else if (/^\/(movie|tv|person)\/\d+$/.test(endpoint)) allowed = DETAIL_PARAMS;
  else if (/^\/(genre|collection|tv\/\d+\/season)/.test(endpoint)) allowed = new Set();
  if ([...params.keys()].some(key => !allowed.has(key))) return false;
  const page = params.get('page');
  if (page && (!/^\d+$/.test(page) || Number(page) < 1 || Number(page) > 10)) return false;
  const query = params.get('query');
  if (query && (!query.trim() || query.length > 100)) return false;
  if (params.has('include_adult') && params.get('include_adult') !== 'false') return false;
  for (const key of ['primary_release_year', 'first_air_date_year']) {
    const value = params.get(key);
    if (value && (!/^\d{4}$/.test(value) || Number(value) < 1880 || Number(value) > new Date().getFullYear() + 5)) return false;
  }
  const genre = params.get('with_genres');
  if (genre && !/^\d{1,6}$/.test(genre)) return false;
  const language = params.get('with_original_language');
  if (language && !/^[a-z]{2,3}$/i.test(language)) return false;
  const sort = params.get('sort_by');
  if (sort && !['popularity.desc', 'vote_average.desc', 'release_date.desc', 'first_air_date.desc'].includes(sort)) return false;
  const rating = params.get('vote_average.gte');
  if (rating && (!/^\d(?:\.\d)?$|^10(?:\.0)?$/.test(rating) || Number(rating) < 0 || Number(rating) > 10)) return false;
  const votes = params.get('vote_count.gte');
  if (votes && (!/^\d+$/.test(votes) || Number(votes) > 100_000)) return false;
  const append = params.get('append_to_response');
  if (append && append.split(',').some(value => !ALLOWED_APPEND.has(value))) return false;
  return true;
};

const proxyTmdb = async (request, env) => {
  if (request.method !== 'GET') return response('Method not allowed', 405, { Allow: 'GET', 'X-Robots-Tag': 'noindex, nofollow' });
  if (!env.TMDB_API_KEY && !env.TMDB_BEARER_TOKEN) return response('TMDB server credential is not configured', 503, { 'X-Robots-Tag': 'noindex, nofollow' });
  const url = new URL(request.url);
  const endpoint = url.pathname.replace(/^\/api\/tmdb/, '');
  if (url.toString().length > 1_200) return response('Request too large', 414, { 'X-Robots-Tag': 'noindex, nofollow' });
  url.searchParams.delete('api_key');
  if (!validateTmdbRequest(endpoint, url.searchParams)) return response('Unsupported TMDB request', 400, { 'X-Robots-Tag': 'noindex, nofollow' });
  if (env.TMDB_API_KEY) url.searchParams.set('api_key', env.TMDB_API_KEY);
  try {
    const upstream = await fetchUpstream(`${TMDB_API}${endpoint}?${url.searchParams}`, { headers: tmdbHeaders(env), cf: { cacheTtl: 3600, cacheEverything: true } });
    const cacheTtl = endpoint.startsWith('/search/') ? 900 : 3600;
    return new Response(upstream.body, { status: upstream.status, headers: { 'Content-Type': upstream.headers.get('Content-Type') || 'application/json; charset=UTF-8', 'Cache-Control': upstream.ok ? `public, max-age=120, s-maxage=${cacheTtl}, stale-while-revalidate=86400` : 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' } });
  } catch {
    return response('TMDB upstream timed out', 504, { 'Content-Type': 'application/json; charset=UTF-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
  }
};

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = configuredOrigin(request, env);
    if (url.pathname.startsWith('/api/tmdb/')) return proxyTmdb(request, env);

    const normalizedPath = cleanPath(url.pathname.toLowerCase());
    const normalizedParams = new URLSearchParams(url.search);
    [...normalizedParams.keys()].forEach(key => { if (TRACKING_PARAMS.test(key)) normalizedParams.delete(key); });
    const normalizedUrl = `${origin}${normalizedPath}${normalizedParams.size ? `?${normalizedParams}` : ''}`;
    if (normalizedUrl !== `${url.origin}${url.pathname}${url.search}`) {
      const entityCandidate = normalizedPath.match(/^\/(movie|tv|anime|manga)\/(\d+)(?:-[a-z0-9-]+)?$/);
      if (entityCandidate) return renderDetail(request, env, entityCandidate[1], Number(entityCandidate[2]));
      const personCandidate = normalizedPath.match(/^\/person\/(\d+)(?:-[a-z0-9-]+)?$/);
      if (personCandidate) return renderPerson(request, env, Number(personCandidate[1]));
      return Response.redirect(normalizedUrl, 301);
    }

    if (url.pathname === '/robots.txt') return textResponse(robotsTxt(origin), 'text/plain; charset=UTF-8', { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' });
    if (url.pathname === '/sitemap.xml') return serveSitemap(request, env);
    const sitemap = url.pathname.match(/^\/sitemap-(static|movies|tv|anime|people)\.xml$/);
    if (sitemap) return serveSitemap(request, env, sitemap[1]);
    const path = cleanPath(url.pathname);
    if (STATIC_PAGES[path]) return renderStatic(request, env, path);
    if (path === '/search' || path === '/my-list') return renderNoindex(request, env, path);
    const genre = path.match(/^\/(movies|tv-shows)\/genre\/([a-z0-9-]+)$/);
    if (genre) return renderGenre(request, env, genre[1] === 'movies' ? 'movie' : 'tv', genre[2]);
    const detail = path.match(/^\/(movie|tv|anime|manga)\/(\d+)(?:-[a-z0-9-]+)?$/);
    if (detail) return renderDetail(request, env, detail[1], Number(detail[2]));
    const person = path.match(/^\/person\/(\d+)(?:-[a-z0-9-]+)?$/);
    if (person) return renderPerson(request, env, Number(person[1]));

    if (/\.[a-z0-9]+$/i.test(path) && env.ASSETS) {
      const asset = await env.ASSETS.fetch(request);
      return new Response(asset.body, { status: asset.status, headers: asset.headers });
    }
    return renderNotFound(request, env);
  }
};

export default worker;
