import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, ChevronLeft, ChevronRight, Pause, Play, RefreshCcw, RotateCcw, Sparkles, Star } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { anilistService } from '../services/anilist';
import { MediaItem } from '../types';
import Loader from '../components/Loader';
import MediaCard from '../components/MediaCard';
import Row from '../components/Row';
import Advertisement from '../components/Advertisement';
import Seo, { SITE_NAME, toAbsoluteSiteUrl } from '../components/Seo';
import { mediaPath } from '../lib/routes';
import { backdropSrc, backdropSrcSet } from '../lib/images';
import { filterScore, filterYear, useQueryFilters } from '../lib/useCatalogFilters';

const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mahou Shoujo', 'Mecha', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'];

const formatNames: Record<string, string> = {
  TV: 'TV series', TV_SHORT: 'Short series', MOVIE: 'Movie', OVA: 'OVA', ONA: 'ONA', SPECIAL: 'Special', MUSIC: 'Music'
};

const Anime: React.FC = () => {
  const { params: searchParams, updateFilters } = useQueryFilters();
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [data, setData] = useState<Record<string, MediaItem[]>>({});
  const [filtered, setFiltered] = useState<MediaItem[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const genre = genres.includes(searchParams.get('genre') || '') ? searchParams.get('genre')! : '';
  const format = Object.hasOwn(formatNames, searchParams.get('format') || '') ? searchParams.get('format')! : '';
  const status = ['RELEASING', 'FINISHED', 'NOT_YET_RELEASED'].includes(searchParams.get('status') || '') ? searchParams.get('status')! : '';
  const year = filterYear(searchParams.get('year') || '');
  const score = filterScore(searchParams.get('score'), [60, 70, 80, 90]);
  const setGenre = (value: string) => updateFilters({ genre: value });
  const setFormat = (value: string) => updateFilters({ format: value });
  const setStatus = (value: string) => updateFilters({ status: value });
  const setYear = (value: string) => updateFilters({ year: filterYear(value) });
  const setScore = (value: number) => updateFilters({ score: value ? String(value) : null });
  const [heroPaused, setHeroPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || document.visibilityState === 'visible');
  const [catalogWarning, setCatalogWarning] = useState('');
  const [filterWarning, setFilterWarning] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const reduceMotion = useReducedMotion();

  const hasFilters = Boolean(genre || format || status || year || score);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setCatalogWarning('');
      try {
        const landing = await anilistService.getAnimeLanding();
        if (active) setData(landing);
      } catch (error) {
        console.error('Anime catalog error', error);
        if (active) setCatalogWarning('AniList is temporarily unavailable. Try refreshing the catalog in a moment.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [retryKey]);

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    setFiltered([]);
    setFilterWarning('');
    setFiltering(hasFilters);
    if (!hasFilters) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const items = await anilistService.browseAnime({
          genre: genre || undefined,
          format: format || undefined,
          status: status || undefined,
          year: year ? Number(year) : undefined,
          minScore: score || undefined,
          sort: ['POPULARITY_DESC', 'SCORE_DESC'],
          perPage: 50
        });
        if (active) setFiltered(items);
      } catch {
        if (active) setFilterWarning('The filtered anime catalog could not be loaded. Please try again.');
      } finally {
        if (active) setFiltering(false);
      }
    }, 280);
    return () => { active = false; window.clearTimeout(timer); };
  }, [genre, format, status, year, score, hasFilters, retryKey]);

  const heroItems = useMemo(() => (data.trending || []).filter(item => item.banner).slice(0, 5), [data.trending]);
  const hero = heroItems[heroIndex] || data.trending?.[0];
  const schema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: 'Anime', url: toAbsoluteSiteUrl('/anime'), description: 'Browse current-season, trending, popular, and highly rated anime series and films.' },
      ...(data.trending?.length ? [{ '@type': 'ItemList', itemListElement: data.trending.slice(0, 20).map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.title, url: toAbsoluteSiteUrl(mediaPath(item)) })) }] : [])
    ]
  }), [data.trending]);

  useEffect(() => {
    if (heroItems.length < 2 || heroPaused || reduceMotion || !pageVisible) return;
    const timer = window.setInterval(() => setHeroIndex(index => (index + 1) % heroItems.length), 8500);
    return () => window.clearInterval(timer);
  }, [heroItems.length, heroPaused, pageVisible, reduceMotion]);

  const stepHero = (direction: number) => {
    if (!heroItems.length) return;
    setHeroIndex(index => (index + direction + heroItems.length) % heroItems.length);
    setHeroPaused(true);
  };

  const clearFilters = () => {
    updateFilters({ genre: null, format: null, status: null, year: null, score: null });
  };
  const warning = hasFilters ? filterWarning : catalogWarning;

  const hasCatalogData = Object.keys(data).some(key => (data[key]?.length || 0) > 0);
  if (loading && !hasCatalogData) {
    return (
      <div className="anime-page">
        <Seo title={`Anime Series & Films: Episodes and Details | ${SITE_NAME}`} description="Browse current-season, trending, popular, and highly rated anime with story summaries, formats, episodes, studios, and related titles." path="/anime" robots={hasFilters ? 'noindex,follow' : undefined} jsonLd={hasFilters ? undefined : schema} />
        <Loader page label="Loading anime catalog from AniList" />
      </div>
    );
  }

  return (
    <div className="anime-page">
      <Seo title={`Anime Series & Films: Episodes and Details | ${SITE_NAME}`} description="Browse current-season, trending, popular, and highly rated anime with story summaries, formats, episodes, studios, and related titles." path="/anime" robots={hasFilters ? 'noindex,follow' : undefined} jsonLd={hasFilters ? undefined : schema} />
      {hero ? (
        <section className="anime-hero" aria-label="Featured anime">
          <img key={hero.id} className="anime-hero-art" src={backdropSrc(hero.banner || hero.poster)} srcSet={backdropSrcSet(hero.banner || hero.poster)} sizes="100vw" alt="" aria-hidden="true" width="1280" height="720" fetchPriority="high" decoding="async" />
          <div className="anime-hero-scrim" />
          <div className="shell anime-hero-layout">
            <motion.div key={`copy-${hero.id}`} className="anime-hero-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
              <div className="eyebrow"><Sparkles size={13} /> AniList spotlight</div>
              <h1>{hero.title}</h1>
              <div className="anime-hero-facts">
                <strong><Star size={12} fill="currentColor" /> {hero.rating ? hero.rating.toFixed(1) : 'New'}</strong>
                <span>{formatNames[hero.format || ''] || 'Anime'}</span>
                <span>{hero.season ? `${hero.season} ${hero.seasonYear || ''}` : hero.releaseDate?.slice(0, 4)}</span>
                {hero.episodes ? <span>{hero.episodes} episodes</span> : null}
              </div>
              <p>{hero.description}</p>
              <div className="hero-actions">
                <Link className="button button-primary" to={mediaPath(hero)}><Play size={17} fill="currentColor" /> View title</Link>
                <button className="button button-quiet" onClick={() => document.querySelector('.anime-discovery')?.scrollIntoView({ behavior: 'smooth' })}>Explore anime <ArrowRight size={16} /></button>
              </div>
            </motion.div>
            <div className="anime-hero-controls">
              <button onClick={() => stepHero(-1)} aria-label="Previous featured anime"><ChevronLeft size={18} /></button>
              <span>{String(heroIndex + 1).padStart(2, '0')} / {String(heroItems.length || 1).padStart(2, '0')}</span>
              <button onClick={() => setHeroPaused(paused => !paused)} aria-pressed={heroPaused} aria-label={heroPaused ? 'Resume featured anime rotation' : 'Pause featured anime rotation'}>{heroPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}</button>
              <button onClick={() => stepHero(1)} aria-label="Next featured anime"><ChevronRight size={18} /></button>
            </div>
          </div>
        </section>
      ) : (
        <section className="anime-hero hero-fallback" aria-labelledby="anime-heading">
          <div className="anime-hero-scrim" />
          <div className="shell anime-hero-layout"><div className="anime-hero-copy"><div className="eyebrow"><Sparkles size={13} /> Anime catalog</div><h1 id="anime-heading">Discover anime series and films</h1><p>Explore current-season titles, story summaries, formats, studios, episodes, and related recommendations.</p>{loading && <span className="loading-note" role="status">Loading current anime highlights…</span>}</div></div>
        </section>
      )}

      {warning && <div className="catalog-warning shell" role="status"><AlertCircle size={17} /><span>{warning}</span><button onClick={() => setRetryKey(key => key + 1)}><RefreshCcw size={14} /> Retry</button></div>}

      <section className="anime-discovery shell">
        <Advertisement />
        <header className="anime-section-heading">
          <div><div className="eyebrow">Shape your queue</div><h2>Find your next world.</h2><p>Filter the AniList catalog by mood, format, release status, year, and score.</p></div>
          <div className="archive-count">ANILIST POWERED</div>
        </header>

        <div className="anime-filter-panel">
          <div className="anime-genre-strip" role="group" aria-label="Anime genres">
            <button aria-pressed={!genre} className={!genre ? 'active' : ''} onClick={() => setGenre('')}>All genres</button>
            {genres.map(item => <button key={item} aria-pressed={genre === item} className={genre === item ? 'active' : ''} onClick={() => setGenre(item)}>{item}</button>)}
          </div>
          <div className="anime-filter-fields">
            <label><span>Format</span><select value={format} onChange={event => setFormat(event.target.value)}><option value="">Every format</option><option value="TV">TV series</option><option value="MOVIE">Movies</option><option value="ONA">ONA</option><option value="OVA">OVA</option><option value="SPECIAL">Specials</option></select></label>
            <label><span>Release status</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="">Any status</option><option value="RELEASING">Airing now</option><option value="FINISHED">Completed</option><option value="NOT_YET_RELEASED">Upcoming</option></select></label>
            <label><span>Release year</span><input value={year} inputMode="numeric" placeholder="Any year" maxLength={4} onChange={event => setYear(event.target.value.replace(/\D/g, '').slice(0, 4))} /></label>
            <label><span>Minimum score</span><select value={score} onChange={event => setScore(Number(event.target.value))}><option value={0}>Any score</option><option value={60}>6.0+</option><option value={70}>7.0+</option><option value={80}>8.0+</option><option value={90}>9.0+</option></select></label>
            {hasFilters && <button className="anime-clear" onClick={clearFilters}><RotateCcw size={14} /> Reset</button>}
          </div>
        </div>
      </section>

      {hasFilters ? (
        <section className="anime-results shell">
          <div className="anime-results-heading"><div><div className="eyebrow">Filtered collection</div><h2>{genre || (format ? formatNames[format] : 'Selected anime')}</h2></div><span>{filtered.length} matches</span></div>
          {filtering ? <Loader label="Refining the anime catalog" /> : filtered.length ? <div className="media-grid">{filtered.map((item, index) => <MediaCard key={`anime-${item.id}`} item={item} index={index} />)}</div> : !filterWarning && <div className="empty-state"><h2>No anime matched every filter.</h2><p>Try clearing the year or lowering the minimum score.</p></div>}
        </section>
      ) : (
        <div className="anime-rows">
          <Row title="This season's standouts" kicker="Airing now" items={data.currentSeason} featured />
          <Row title="Latest episodes" kicker="Freshly updated" items={data.latest} />
          <Row title="Anime movies" kicker="Feature-length worlds" items={data.movies} explorePath="/anime?format=MOVIE" />
          <Advertisement />
          <Row title="Trending across AniList" kicker="The global conversation" items={data.trending} />
          <Row title="All-time favorites" kicker="Most popular" items={data.popular} />
          <Row title="Highest rated" kicker="Community essentials" items={data.topRated} />
          <Advertisement />
          <Row title="Action" items={data.action} onExplore={() => setGenre('Action')} />
          <Row title="Romance" items={data.romance} onExplore={() => setGenre('Romance')} />
          <Row title="Fantasy" items={data.fantasy} onExplore={() => setGenre('Fantasy')} />
        </div>
      )}
    </div>
  );
};

export default Anime;
