import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import Loader from '../components/Loader';
import MediaCard from '../components/MediaCard';
import Seo, { SITE_NAME, toAbsoluteSiteUrl } from '../components/Seo';
import { getGenreLanding } from '../lib/catalog';
import { mediaPath } from '../lib/routes';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';

const GenreLanding: React.FC<{ type: 'movie' | 'tv' }> = ({ type }) => {
  const { slug } = useParams<{ slug: string }>();
  const definition = getGenreLanding(type, slug);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!definition) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    setFailed(false);
    tmdbService.getByGenre(type, definition.id)
      .then(results => { if (active) setItems(results); })
      .catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [definition, type]);

  const path = `/${type === 'movie' ? 'movies' : 'tv-shows'}/genre/${definition?.slug || slug || ''}`;
  const jsonLd = useMemo(() => definition ? ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${toAbsoluteSiteUrl(path)}#page`,
        name: definition.title,
        description: definition.intro,
        url: toAbsoluteSiteUrl(path),
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: toAbsoluteSiteUrl('/') }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: toAbsoluteSiteUrl('/') },
          { '@type': 'ListItem', position: 2, name: type === 'movie' ? 'Movies' : 'TV shows', item: toAbsoluteSiteUrl(type === 'movie' ? '/movies' : '/tv-shows') },
          { '@type': 'ListItem', position: 3, name: definition.name, item: toAbsoluteSiteUrl(path) }
        ]
      },
      ...(items.length ? [{
        '@type': 'ItemList',
        itemListElement: items.slice(0, 20).map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.title, url: toAbsoluteSiteUrl(mediaPath(item)) }))
      }] : [])
    ]
  }) : undefined, [definition, items, path, type]);

  if (!definition) return <div className="empty-state detail-missing"><Seo title={`Genre not found | ${SITE_NAME}`} robots="noindex,follow" /><h1>Genre not found</h1><p>This collection is not available.</p><Link to={type === 'movie' ? '/movies' : '/tv-shows'}>Browse all {type === 'movie' ? 'movies' : 'TV shows'}</Link></div>;

  return (
    <div className="browse-page shell collection-page">
      <Seo title={`${definition.title}: Stories & Cast | ${SITE_NAME}`} description={definition.intro} path={path} jsonLd={jsonLd} />
      <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: type === 'movie' ? 'Movies' : 'TV shows', path: type === 'movie' ? '/movies' : '/tv-shows' }, { label: definition.name }]} />
      <header className="browse-header">
        <div><div className="eyebrow"><Compass size={13} /> Curated by genre</div><h1>{definition.title}</h1><p>{definition.intro}</p></div>
      </header>
      {loading ? <Loader label="Loading titles" /> : items.length ? <section aria-labelledby="genre-results"><h2 id="genre-results" className="visually-hidden">Popular {definition.name.toLowerCase()} titles</h2><div className="media-grid">{items.map((item, index) => <MediaCard key={`${item.type}-${item.id}`} item={item} index={index} />)}</div></section> : <div className="empty-state"><h2>{failed ? 'Catalog temporarily unavailable' : 'No titles available'}</h2><p>{failed ? 'The source could not be reached. Refresh this page to try again.' : 'This collection has no usable results right now.'}</p></div>}
    </div>
  );
};

export default GenreLanding;
