import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Calendar, MapPin, UserRound } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import Loader from '../components/Loader';
import MediaCard from '../components/MediaCard';
import Advertisement from '../components/Advertisement';
import Seo, { SITE_NAME, toAbsoluteSiteUrl } from '../components/Seo';
import { mediaPath, parseEntityId, personPath } from '../lib/routes';
import { tmdbService } from '../services/tmdb';
import { PersonDetails } from '../types';
import { posterSrc, posterSrcSet } from '../lib/images';

const PersonPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const id = parseEntityId(identifier);
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    tmdbService.getPersonDetails(id).then(result => {
      if (!active) return;
      setPerson(result);
      if (result) {
        const canonicalPath = personPath(result.id, result.name);
        if (window.location.pathname !== canonicalPath) navigate(canonicalPath, { replace: true });
      }
    }).catch(() => { if (active) setPerson(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, navigate]);

  const description = person?.biography
    ? person.biography.replace(/\s+/g, ' ').trim().slice(0, 155)
    : person ? `Explore ${person.name}'s movies and TV shows, known roles, and career information.` : '';
  const path = person ? personPath(person.id, person.name) : `/person/${identifier || ''}`;
  const indexable = Boolean(person && person.credits.length >= 3);
  const jsonLd = useMemo(() => person ? ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${toAbsoluteSiteUrl(path)}#person`,
        name: person.name,
        url: toAbsoluteSiteUrl(path),
        ...(person.profile ? { image: person.profile } : {}),
        ...(person.birthday ? { birthDate: person.birthday } : {}),
        ...(person.deathday ? { deathDate: person.deathday } : {}),
        ...(person.placeOfBirth ? { birthPlace: { '@type': 'Place', name: person.placeOfBirth } } : {})
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: toAbsoluteSiteUrl('/') },
          { '@type': 'ListItem', position: 2, name: person.name, item: toAbsoluteSiteUrl(path) }
        ]
      }
    ]
  }) : undefined, [path, person]);

  if (loading) return <Loader page label="Loading person" />;
  if (!person) return <div className="empty-state detail-missing"><Seo title={`Person not found | ${SITE_NAME}`} robots="noindex,follow" /><h1>Person not found</h1><p>No usable public profile was returned.</p><Link to="/movies">Browse movies</Link></div>;

  return (
    <div className="person-page shell">
      <Seo title={`${person.name} Movies & TV Shows | ${SITE_NAME}`} description={description} path={path} image={person.profile || '/og-seo.jpg'} type="profile" robots={indexable ? undefined : 'noindex,follow'} jsonLd={jsonLd} />
      <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: person.name }]} />
      <header className="person-header">
        {person.profile ? <img src={posterSrc(person.profile)} srcSet={posterSrcSet(person.profile)} sizes="(max-width: 640px) 64vw, 260px" width="342" height="513" alt={`Portrait of ${person.name}`} fetchPriority="high" /> : <div className="person-placeholder"><UserRound size={48} aria-hidden="true" /></div>}
        <div>
          <div className="eyebrow"><UserRound size={13} /> {person.knownFor || 'Film and television'}</div>
          <h1>{person.name}</h1>
          <div className="person-facts">
            {person.birthday && <span><Calendar size={14} /> Born {person.birthday}</span>}
            {person.placeOfBirth && <span><MapPin size={14} /> {person.placeOfBirth}</span>}
          </div>
          {person.biography ? <p>{person.biography}</p> : <p>A public biography is not available. The filmography below is ordered by current catalog relevance.</p>}
        </div>
      </header>
      <Advertisement />
      <section aria-labelledby="filmography-heading">
        <div className="section-heading"><div><div className="eyebrow">Selected credits</div><h2 id="filmography-heading">Movies and TV shows</h2></div></div>
        {person.credits.length ? <div className="media-grid">{person.credits.map((item, index) => <MediaCard key={`${item.type}-${item.id}`} item={item} index={index} />)}</div> : <div className="empty-state"><h2>No catalog credits</h2><p>No matching movie or TV records are available.</p></div>}
      </section>
      {person.credits.length > 0 && <p className="source-note">Profile and credit metadata is supplied by TMDB. <Link to={mediaPath(person.credits[0])}>Explore {person.credits[0].title}</Link>.</p>}
    </div>
  );
};

export default PersonPage;
