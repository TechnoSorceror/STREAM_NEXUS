import React, { useEffect } from 'react';

export const SITE_NAME = 'StreamNexus';
export const DEFAULT_DESCRIPTION = 'Discover movies, TV shows, and anime with clear story summaries, release details, genres, trailers, and viewing information.';

export interface SeoProps {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'video.movie' | 'video.tv_show' | 'profile';
  robots?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const configuredOrigin = String(import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');

export const toAbsoluteSiteUrl = (path = '/') => {
  const browserOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const origin = configuredOrigin && !configuredOrigin.includes('localhost') ? configuredOrigin : browserOrigin;
  return absoluteUrl(path, origin);
};

const absoluteUrl = (value: string, origin: string) => {
  try { return new URL(value, `${origin}/`).toString(); }
  catch { return `${origin}${value.startsWith('/') ? value : `/${value}`}`; }
};

const upsertMeta = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value));
};

const upsertLink = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value));
};

const Seo: React.FC<SeoProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = '/og-seo.jpg',
  type = 'website',
  robots = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
  jsonLd
}) => {
  useEffect(() => {
    const browserOrigin = window.location.origin;
    const origin = configuredOrigin && !configuredOrigin.includes('localhost') ? configuredOrigin : browserOrigin;
    const cleanPath = (path || window.location.pathname).replace(/\/$/, '') || '/';
    const canonical = absoluteUrl(cleanPath, origin);
    const socialImage = absoluteUrl(image, origin);

    document.title = title;
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: socialImage });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: socialImage });
    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonical });
    upsertLink('link[rel="alternate"][hreflang="en"]', { rel: 'alternate', hreflang: 'en', href: canonical });
    upsertLink('link[rel="alternate"][hreflang="x-default"]', { rel: 'alternate', hreflang: 'x-default', href: canonical });

    const existing = document.head.querySelector<HTMLScriptElement>('script[data-streamnexus-jsonld]');
    if (!jsonLd) {
      existing?.remove();
      return;
    }
    const script = existing || document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.streamnexusJsonld = 'true';
    script.textContent = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
    if (!existing) document.head.appendChild(script);
  }, [description, image, jsonLd, path, robots, title, type]);

  return null;
};

export default Seo;
