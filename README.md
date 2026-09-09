# StreamNexus

StreamNexus is a React and TypeScript media-discovery application built with Vite. It uses TMDB for movie and TV metadata, AniList for anime metadata, browser local storage for personal lists and progress, and user-initiated third-party playback embeds.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Add either `TMDB_API_KEY` or `TMDB_BEARER_TOKEN` to `.env.local`.
3. Run `npm install`, then `npm run dev`.

The TMDB credential is consumed by the local middleware and production edge worker. It is never bundled into client JavaScript. `VITE_SITE_URL` contains only the public canonical origin and must match `SITE_URL` in production.

## Self-hosting on this PC

1. Create the private configuration: `cp .env.example .env.local`.
2. Put either your TMDB API key or API read-access token in `.env.local`.
3. Run `npm install`, `npm run build`, then `npm start`.
4. Open `http://localhost:3000` on this PC or `http://<this-pc-lan-ip>:3000` on another device on the same network.

`npm start` uses the production build, keeps the TMDB credential on the server, serves static assets, and supports the existing SEO-rendered routes. It deliberately prints a warning if the TMDB credential is missing.

To start StreamNexus automatically after boot on this Debian PC:

```bash
sudo cp deploy/streamnexus.service /etc/systemd/system/streamnexus.service
sudo systemctl daemon-reload
sudo systemctl enable --now streamnexus
sudo systemctl status streamnexus
```

If sudo is unavailable, install the per-user service instead:

```bash
mkdir -p ~/.config/systemd/user
cp deploy/streamnexus-user.service ~/.config/systemd/user/streamnexus.service
systemctl --user daemon-reload
systemctl --user enable --now streamnexus
loginctl enable-linger "$USER"
```

User lingering lets the service start at boot without waiting for an interactive login. Some systems require an administrator to enable it.

After changing application code, run `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run seo:test`. Then restart the service you installed:

- Per-user service (used on this PC): `systemctl --user restart streamnexus`. Logs: `journalctl --user -u streamnexus -f`.
- System service: `sudo systemctl restart streamnexus`. Logs: `journalctl -u streamnexus -f`.

This PC serves `https://streamnexus.fun` through Cloudflare Tunnel. Check the tunnel with `systemctl --user status cloudflared-streamnexus`; rebuilding the application does not require changing DNS or restarting the tunnel. LAN hosting alone does not make another installation public: configure an HTTPS tunnel or reverse proxy and set `SITE_URL` to its public origin.

## Alternative deployment on Vercel

The project also supports Vercel. The checked-in `vercel.json` builds `dist`, serves static crawl entry points directly, and sends application routes through `api/render.js` for server-rendered metadata and content.

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
