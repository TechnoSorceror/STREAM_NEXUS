import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Calendar, Check, ChevronDown, ExternalLink, Layers, Play, Share2, SkipBack, SkipForward, Star, Video } from 'lucide-react';
import { MediaItem, PlaybackState, EpisodeInfo, WatchStatus } from '../types';
import { tmdbService } from '../services/tmdb';
import { anilistService } from '../services/anilist';
import { generateEmbedUrl } from '../services/embed';
import { addToMyList, getMyListStatus, isInMyList, removeFromMyList } from '../lib/myList';
import { getWatchProgress, saveWatchProgress } from '../lib/watchProgress';
import Row from '../components/Row';
import Advertisement from '../components/Advertisement';
import Loader from '../components/Loader';
import Breadcrumbs from '../components/Breadcrumbs';
import Seo, { SITE_NAME, toAbsoluteSiteUrl } from '../components/Seo';
import { getGenreLandingByName } from '../lib/catalog';
import { mediaPath, parseEntityId, personPath } from '../lib/routes';
import { backdropSrc, backdropSrcSet, posterSrc, posterSrcSet } from '../lib/images';

const statuses: { value: WatchStatus; label: string }[] = [
  { value: 'watching', label: 'Watching' }, { value: 'plan_to_watch', label: 'Plan to watch' },
  { value: 'completed', label: 'Completed' }, { value: 'on_hold', label: 'On hold' }, { value: 'dropped', label: 'Dropped' }
];

const Details: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const entityId = parseEntityId(id);
  const type = location.pathname.split('/')[1] as 'movie' | 'tv' | 'anime' | 'manga';
  const playerRef = useRef<HTMLDivElement>(null);
  const trailerDialogRef = useRef<HTMLDivElement>(null);
  const trailerCloseRef = useRef<HTMLButtonElement>(null);
  const trailerPreviousFocus = useRef<HTMLElement | null>(null);
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [collection, setCollection] = useState<MediaItem[]>([]);
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [saved, setSaved] = useState(false);
  const [watchStatus, setWatchStatus] = useState<WatchStatus>('plan_to_watch');
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [playState, setPlayState] = useState<PlaybackState>({ isPlaying: false, season: 1, episode: 1, chapter: 1, isDub: false });

  useEffect(() => {
    if (!trailerOpen) return;
    trailerPreviousFocus.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => trailerCloseRef.current?.focus(), 30);
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setTrailerOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      trailerPreviousFocus.current?.focus();
    };
  }, [trailerOpen]);

  useEffect(() => {
    if (!entityId) { setLoading(false); return; }
    let active = true;
    (async () => {
      setLoading(true); setCollection([]); setRecommendations([]);
      try {
        let result: MediaItem | null = null;
        if (type === 'movie' || type === 'tv') result = await tmdbService.getDetails(entityId, type);
        else if (type === 'anime') {
          const anime = await anilistService.getDetails(entityId, 'anime');
          result = anime ? (await tmdbService.resolveAnime(anime)) || anime : null;
        } else result = await anilistService.getDetails(entityId, 'manga');
        if (!active) return;
        setMedia(result);
        if (!result) return;
        const canonicalPath = mediaPath(result);
        if (window.location.pathname !== canonicalPath) navigate(canonicalPath, { replace: true });
        setSaved(isInMyList(result.id, result.type));
        setWatchStatus((getMyListStatus(result.id, result.type) as WatchStatus) || 'plan_to_watch');
        const progress = getWatchProgress(result.id, result.type);
        setPlayState({ isPlaying: false, season: progress?.season ?? result.tmdbSeason ?? 1, episode: progress?.episode ?? 1, chapter: progress?.chapter ?? 1, isDub: false });
        if ((type === 'movie' || type === 'tv') && result.id) setRecommendations(await tmdbService.getRecommendations(Number(result.id), type));
        if (type === 'anime' && result.tmdbId && result.tmdbMediaType) setRecommendations(await tmdbService.getRecommendations(result.tmdbId, result.tmdbMediaType));
        if (type === 'movie' && result.collectionId) setCollection((await tmdbService.getCollection(result.collectionId)).filter(item => item.id !== result!.id));
      } catch (error) { console.error('Details fetch error', error); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [entityId, navigate, type]);

  useEffect(() => {
    if (!media || !media.tmdbId || (media.type !== 'tv' && !(media.type === 'anime' && media.tmdbMediaType === 'tv'))) return;
    let active = true;
    setLoadingEpisodes(true);
    tmdbService.getSeason(media.tmdbId, playState.season).then(data => { if (active) setEpisodes(data.episodes || []); }).finally(() => { if (active) setLoadingEpisodes(false); });
    return () => { active = false; };
  }, [media, playState.season]);

  useEffect(() => {
    if (media && playState.isPlaying) saveWatchProgress(media, { season: playState.season, episode: playState.episode, chapter: playState.chapter });
  }, [media, playState.isPlaying, playState.season, playState.episode, playState.chapter]);

  const embedUrl = useMemo(() => media ? generateEmbedUrl(media, playState) : '', [media, playState]);
  const canonicalPath = media ? mediaPath(media) : location.pathname;
  const mediaSchema = useMemo(() => {
    if (!media) return undefined;
    const schemaType = media.type === 'movie' || (media.type === 'anime' && media.format === 'MOVIE')
      ? 'Movie'
      : media.type === 'manga' ? 'CreativeWorkSeries' : 'TVSeries';
    const people = media.type === 'movie' ? media.directors : media.creators;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': schemaType,
          '@id': `${toAbsoluteSiteUrl(canonicalPath)}#title`,
          name: media.title,
          url: toAbsoluteSiteUrl(canonicalPath),
          mainEntityOfPage: toAbsoluteSiteUrl(canonicalPath),
          ...(media.description ? { description: media.description } : {}),
          ...(media.poster ? { image: media.poster } : {}),
          ...(media.releaseDate && media.releaseDate !== 'N/A' ? { datePublished: media.releaseDate } : {}),
          ...(media.genres?.length ? { genre: media.genres } : {}),
          ...(media.runtime ? { duration: `PT${media.runtime}M` } : {}),
          ...(media.originalLanguage ? { inLanguage: media.originalLanguage } : {}),
          ...(media.ageRating ? { contentRating: media.ageRating } : {}),
          ...(media.originCountries?.length ? { countryOfOrigin: media.originCountries.map(name => ({ '@type': 'Country', name })) } : {}),
          ...(people?.length ? { [media.type === 'movie' ? 'director' : 'creator']: people.map(person => ({ '@type': 'Person', name: person.name, url: toAbsoluteSiteUrl(personPath(person.id, person.name)) })) } : {}),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: toAbsoluteSiteUrl('/') },
            { '@type': 'ListItem', position: 2, name: media.type === 'movie' ? 'Movies' : media.type === 'tv' ? 'TV shows' : media.type === 'anime' ? 'Anime' : 'Manga', item: toAbsoluteSiteUrl(media.type === 'movie' ? '/movies' : media.type === 'tv' ? '/tv-shows' : '/anime') },
            { '@type': 'ListItem', position: 3, name: media.title, item: toAbsoluteSiteUrl(canonicalPath) }
          ]
        }
      ]
    };
  }, [canonicalPath, media]);
  const start = () => { setPlayState(state => ({ ...state, isPlaying: true })); window.setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80); };
  const selectEpisode = (episode: number) => { setPlayState(state => ({ ...state, episode, isPlaying: true })); window.setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth' }), 80); };
  const nextEpisode = () => {
    const index = episodes.findIndex(ep => ep.episode_number === playState.episode);
    if (index >= 0 && index < episodes.length - 1) selectEpisode(episodes[index + 1].episode_number);
    else if (index < 0 && media?.type === 'anime' && (!media.episodes || playState.episode < media.episodes)) selectEpisode(playState.episode + 1);
    else if ((media?.seasons || 0) > playState.season) setPlayState(s => ({ ...s, season: s.season + 1, episode: 1 }));
  };
  const previousEpisode = () => {
    const index = episodes.findIndex(ep => ep.episode_number === playState.episode);
    if (index > 0) selectEpisode(episodes[index - 1].episode_number);
    else if (index < 0 && media?.type === 'anime' && playState.episode > 1) selectEpisode(playState.episode - 1);
  };
  const share = async () => {
    const data = { title: media?.title || 'StreamNexus', text: `Explore ${media?.title || 'this title'} on StreamNexus`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      // Dismissed share dialogs need no visible error.
    }
  };
  const trapTrailerFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = [...(trailerDialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])') || [])];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  if (loading) return <Loader page label="Loading title" />;
  if (!media) return <div className="empty-state detail-missing"><Seo title={`Title not found | ${SITE_NAME}`} description="The requested title could not be found." robots="noindex,follow" /><h1>Title unavailable</h1><p>The source returned no usable metadata.</p><Link to="/">Return home</Link></div>;

  const isSeries = media.type === 'tv' || (media.type === 'anime' && media.format !== 'MOVIE' && media.format !== 'MUSIC');
  const hasPlaybackSource = Boolean(embedUrl);
  const year = media.releaseDate?.slice(0, 4);
  const kindLabel = media.type === 'movie' ? 'Movie' : media.type === 'tv' ? 'TV Show' : media.type === 'anime' ? 'Anime' : 'Manga';
  const seoTitle = media.type === 'movie'
    ? `${media.title}${year ? ` (${year})` : ''}: Story & Details | ${SITE_NAME}`
    : `${media.title}: ${isSeries ? 'Seasons, Episodes & Details' : 'Story & Details'} | ${SITE_NAME}`;
  const seoDescription = (media.description || `Explore release details, genres, and related titles for ${media.title}.`).replace(/\s+/g, ' ').trim().slice(0, 160);
  const indexable = Boolean(media.title && media.poster && media.description?.trim().length >= 60);
  const browsePath = media.type === 'movie' ? '/movies' : media.type === 'tv' ? '/tv-shows' : '/anime';
  const knownSeasonChoices = media.seasonOptions?.filter(season => season.episodeCount > 0 && (media.type === 'anime' || season.seasonNumber > 0))
    .sort((left, right) => left.seasonNumber - right.seasonNumber)
    .map(season => ({ number: season.seasonNumber, label: season.name }))
    || [];
  const seasonChoices = knownSeasonChoices.length
    ? knownSeasonChoices
    : Array.from({ length: media.seasons || 0 }, (_, index) => ({ number: index + 1, label: `Season ${index + 1}` }));
  return (
    <div className="detail-page">
      <Seo title={seoTitle} description={seoDescription} path={canonicalPath} image={media.banner || media.poster} type={media.type === 'movie' ? 'video.movie' : isSeries ? 'video.tv_show' : 'website'} robots={indexable ? undefined : 'noindex,follow'} jsonLd={mediaSchema} />
      <div className="shell detail-breadcrumbs"><Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: media.type === 'movie' ? 'Movies' : media.type === 'tv' ? 'TV shows' : 'Anime', path: browsePath }, { label: media.title }]} /></div>
      <section className="detail-hero">
        <img className="detail-backdrop" src={backdropSrc(media.banner || media.poster)} srcSet={backdropSrcSet(media.banner || media.poster)} sizes="100vw" width="1280" height="720" alt="" aria-hidden="true" fetchPriority="high" decoding="async" />
        <div className="detail-shade" />
        <div className="shell detail-layout">
          <img className="detail-poster" src={posterSrc(media.poster)} srcSet={posterSrcSet(media.poster)} sizes="190px" width="342" height="513" alt={`Poster for ${media.title}${year ? ` (${year})` : ''}`} decoding="async" />
          <div className="detail-copy">
            <div className="eyebrow">{kindLabel} / {media.status || 'Catalog record'}</div>
            <h1>{media.title}</h1>
            <div className="detail-facts"><strong><Star size={14} fill="currentColor" /> {media.rating?.toFixed(1) || 'NR'}</strong><span><Calendar size={14} /> {media.releaseDate?.slice(0, 4)}</span><span>{media.genres?.slice(0, 3).join(' / ')}</span></div>
            <p>{media.description}</p>
            <div className="hero-actions">
              {media.type !== 'manga' && <button className="button button-primary" onClick={start} disabled={!hasPlaybackSource}><Play size={17} fill="currentColor" />{hasPlaybackSource ? 'Open player' : 'Playback match unavailable'}</button>}
              <button className={`button button-quiet ${saved ? 'is-saved' : ''}`} onClick={() => { if (saved) { removeFromMyList(media.id, media.type); setSaved(false); } else { addToMyList(media, watchStatus); setSaved(true); } }}>{saved ? <Check size={17} /> : '+'}{saved ? 'Saved' : 'My list'}</button>
              {media.trailerUrl && <button className="button button-quiet" onClick={() => setTrailerOpen(true)}><Video size={17} /> Trailer</button>}
              <button className="button button-icon" onClick={share} aria-label="Share this title">{shared ? <Check size={17} /> : <Share2 size={17} />}</button>
            </div>
            {media.type === 'anime' && !media.tmdbId && <p className="anime-match-note">TMDB episode details are unavailable for this title. The player uses its AniList ID.</p>}
            {saved && <label className="status-select"><span>Status</span><select value={watchStatus} onChange={event => { const value = event.target.value as WatchStatus; setWatchStatus(value); addToMyList(media, value); }}>{statuses.map(status => <option value={status.value} key={status.value}>{status.label}</option>)}</select><ChevronDown size={15} /></label>}
          </div>
        </div>
      </section>

      <div className="shell detail-content">
        <Advertisement />
        <div className="detail-facts-with-ad">
        <section className="detail-summary" aria-labelledby="about-title-heading">
          <div className="section-heading"><div><div className="eyebrow">Title facts</div><h2 id="about-title-heading">About {media.title}</h2></div></div>
          <dl className="fact-grid">
            {media.releaseDate && media.releaseDate !== 'N/A' && <div><dt>{media.type === 'tv' ? 'First aired' : 'Release date'}</dt><dd>{media.releaseDate}</dd></div>}
            {media.runtime && <div><dt>{isSeries ? 'Episode runtime' : 'Runtime'}</dt><dd>{media.runtime} minutes</dd></div>}
            {media.originalLanguage && <div><dt>Original language</dt><dd>{media.originalLanguage.toUpperCase()}</dd></div>}
            {media.originCountries?.length && <div><dt>Country of origin</dt><dd>{media.originCountries.join(', ')}</dd></div>}
            {media.ageRating && <div><dt>US age rating</dt><dd>{media.ageRating}</dd></div>}
            {media.status && <div><dt>Status</dt><dd>{media.status}</dd></div>}
            {media.seasons && <div><dt>Seasons</dt><dd>{media.seasons}</dd></div>}
            {media.episodes && <div><dt>Episodes</dt><dd>{media.episodes}</dd></div>}
          </dl>
          {media.genres?.length > 0 && <div className="entity-links"><h3>Genres</h3><div>{media.genres.map(genre => { const landing = getGenreLandingByName(media.type === 'movie' ? 'movie' : 'tv', genre); return landing ? <Link key={genre} to={`/${media.type === 'movie' ? 'movies' : 'tv-shows'}/genre/${landing.slug}`}>{genre}</Link> : <span key={genre}>{genre}</span>; })}</div></div>}
          {(media.directors?.length || media.creators?.length) && <div className="entity-links"><h3>{media.type === 'movie' ? 'Directed by' : 'Created by'}</h3><div>{(media.type === 'movie' ? media.directors : media.creators)?.map(person => <Link key={person.id} to={personPath(person.id, person.name)}>{person.name}</Link>)}</div></div>}
          <div className="availability-note"><h3>Viewing information</h3><p>Player availability is checked only after you choose to open it. StreamNexus does not currently verify subscription requirements, licensing, or territory availability.</p></div>
          <p className="source-note">Title metadata is supplied by {media.type === 'anime' || media.type === 'manga' ? 'AniList and, when matched, TMDB' : 'TMDB'}. Playback availability is checked only when you open the player.</p>
        </section>
        <Advertisement format="tower" />
        </div>
        {playState.isPlaying && (
          <section className="player-block" ref={playerRef}>
            <div className="player-toolbar"><div><span className="live-dot" />{!isSeries ? 'Now playing' : `${playState.season === 0 ? 'Specials' : `Season ${playState.season}`}, episode ${playState.episode}`}</div><div className="player-controls">{isSeries && <><button onClick={previousEpisode} aria-label="Previous episode"><SkipBack size={16} /></button><button onClick={nextEpisode} aria-label="Next episode"><SkipForward size={16} /></button></>}{embedUrl && <button onClick={() => window.open(embedUrl, '_blank', 'noopener,noreferrer')}><ExternalLink size={15} /> New tab</button>}</div></div>
            <div className="player-frame">{embedUrl ? <iframe key={embedUrl} src={embedUrl} title={`${media.title} player`} loading="lazy" referrerPolicy="no-referrer" allowFullScreen allow="autoplay; fullscreen; picture-in-picture; encrypted-media" /> : <div className="empty-state"><Video size={28} /><h2>Source unavailable.</h2></div>}</div>
            <Advertisement />
          </section>
        )}

        {isSeries && seasonChoices.length > 0 && <section className="episodes-section"><div className="section-heading"><div><div className="eyebrow"><Layers size={13} /> Episode guide</div><h2>Choose an episode</h2></div><select aria-label="Season" value={playState.season} onChange={e => setPlayState(s => ({ ...s, season: Number(e.target.value), episode: 1 }))}>{seasonChoices.map(season => <option key={season.number} value={season.number}>{season.label}</option>)}</select></div>{loadingEpisodes ? <Loader label="Loading episodes" /> : <div className="episode-list">{episodes.map(ep => <button key={ep.id} onClick={() => selectEpisode(ep.episode_number)} className={playState.episode === ep.episode_number ? 'active' : ''}><span className="episode-number">{String(ep.episode_number).padStart(2, '0')}</span>{ep.still_path ? <img src={ep.still_path} width="500" height="281" alt="" loading="lazy" decoding="async" /> : <span className="episode-placeholder" aria-hidden="true" />}<span><b>{ep.name}</b><small>{ep.air_date ? `${ep.air_date}. ` : ''}{ep.overview || 'No synopsis available.'}</small></span><Play size={16} /></button>)}</div>}</section>}
        {media.type === 'manga' && (media.chapters || 0) > 0 && <section className="chapters-section"><div className="section-heading"><div><div className="eyebrow"><BookOpen size={13} /> Chapter index</div><h2>Published chapters</h2><p className="source-note">Reader links are not available. This chapter count is metadata supplied by AniList.</p></div></div><div className="chapter-grid">{Array.from({ length: Math.min(media.chapters || 0, 500) }, (_, i) => i + 1).map(chapter => <span key={chapter}>{String(chapter).padStart(3, '0')}</span>)}</div></section>}
        {collection.length > 0 && <Row title={`More in ${media.collectionName}`} kicker="Complete the collection" items={collection} featured />}
        {recommendations.length > 0 && <Row title="You may also like" kicker="Signal matched" items={recommendations} />}
      </div>

      {trailerOpen && media.trailerUrl && <div className="trailer-overlay" role="dialog" aria-modal="true" aria-labelledby="trailer-title" onKeyDown={trapTrailerFocus} onClick={event => { if (event.target === event.currentTarget) setTrailerOpen(false); }}><div ref={trailerDialogRef} onClick={event => event.stopPropagation()}><h2 id="trailer-title" className="visually-hidden">Trailer for {media.title}</h2><button ref={trailerCloseRef} onClick={() => setTrailerOpen(false)} aria-label="Close trailer">×</button><iframe src={media.trailerUrl} title={`${media.title} trailer`} loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups" allowFullScreen allow="autoplay; encrypted-media; picture-in-picture" /></div></div>}
    </div>
  );
};
export default Details;
