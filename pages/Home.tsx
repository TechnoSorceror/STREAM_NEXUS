import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Bookmark, ChevronLeft, ChevronRight, Info, Pause, Play, RefreshCcw, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';
import Row from '../components/Row';
import Advertisement from '../components/Advertisement';
import { getWatchProgressList, removeWatchProgress } from '../lib/watchProgress';
import { mcuData } from '../src/data/mcu';
import { addToMyList, isInMyList, removeFromMyList } from '../lib/myList';
import Seo, { SITE_NAME, toAbsoluteSiteUrl } from '../components/Seo';
import { mediaPath } from '../lib/routes';
import { getBootstrapData } from '../lib/bootstrap';
import { backdropSrc, backdropSrcSet } from '../lib/images';

interface HomeData {
  latestMovies: MediaItem[];
  latestTv: MediaItem[];
  trendingMovies: MediaItem[];
  trendingTv: MediaItem[];
  topRatedMovies: MediaItem[];
  popularTv: MediaItem[];
  actionMovies: MediaItem[];
  scifiMovies: MediaItem[];
  dramaMovies: MediaItem[];
}

const emptyData: HomeData = {
  latestMovies: [], latestTv: [], trendingMovies: [], trendingTv: [],
  topRatedMovies: [], popularTv: [], actionMovies: [], scifiMovies: [], dramaMovies: []
};

const Home: React.FC = () => {
  const bootstrapTrending = useMemo(() => getBootstrapData().home?.trendingMovies || [], []);
  const [loading, setLoading] = useState(!bootstrapTrending.length);
  const [data, setData] = useState<HomeData>(() => ({ ...emptyData, trendingMovies: bootstrapTrending }));
  const [heroItems, setHeroItems] = useState<MediaItem[]>(() => bootstrapTrending.slice(0, 4));
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
  const [heroPaused, setHeroPaused] = useState(false);
  const [heroSaved, setHeroSaved] = useState(false);
  const [catalogWarning, setCatalogWarning] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || document.visibilityState === 'visible');
  const reduceMotion = useReducedMotion();

  const mcuItems = useMemo(() => {
    return mcuData;
  }, []);

  const refreshContinueWatching = useCallback(() => {
    setContinueWatching(getWatchProgressList().map(entry => ({
      ...entry.media,
      progress: { season: entry.season, episode: entry.episode, chapter: entry.chapter }
    })));
  }, []);

  useEffect(() => { refreshContinueWatching(); }, [refreshContinueWatching]);

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setCatalogWarning('');
      const currentYear = new Date().getFullYear();
      const keys = ['latestMovies', 'latestTv', 'trendingMovies', 'trendingTv', 'topRatedMovies', 'popularTv', 'actionMovies', 'scifiMovies', 'dramaMovies'] as const;
      const requests = [
        tmdbService.getByYear('movie', currentYear), tmdbService.getByYear('tv', currentYear),
        bootstrapTrending.length ? Promise.resolve(bootstrapTrending) : tmdbService.getTrending('movie'), tmdbService.getTrending('tv'),
        tmdbService.getTopRated('movie'), tmdbService.getPopular('tv'),
        tmdbService.getByGenre('movie', 28), tmdbService.getByGenre('movie', 878), tmdbService.getByGenre('movie', 18)
      ];
      const settled = await Promise.allSettled(requests);
      if (!active) return;
      const next: Partial<HomeData> = {};
      settled.forEach((result, index) => { if (result.status === 'fulfilled') next[keys[index]] = result.value; });
      setData(previous => ({ ...previous, ...next }));
      const nextTrendingMovies = next.trendingMovies || bootstrapTrending;
      const nextTrendingTv = next.trendingTv || [];
      if (nextTrendingMovies.length || nextTrendingTv.length) setHeroItems([...nextTrendingMovies.slice(0, 4), ...nextTrendingTv.slice(0, 2)]);
      const failures = settled.filter(result => result.status === 'rejected').length;
      if (failures === settled.length) setCatalogWarning('The live catalog could not be refreshed. Cached highlights remain available.');
      else if (failures) setCatalogWarning('A few catalog rows are temporarily unavailable. The rest loaded normally.');
      setLoading(false);
    })();
    return () => { active = false; };
  }, [bootstrapTrending, retryKey]);

  useEffect(() => {
    if (heroItems.length < 2 || heroPaused || reduceMotion || !pageVisible) return;
    const timer = window.setInterval(() => setActiveHeroIndex(i => (i + 1) % heroItems.length), 9000);
    return () => window.clearInterval(timer);
  }, [heroItems.length, heroPaused, pageVisible, reduceMotion]);

  const hero = heroItems[activeHeroIndex];
  const heroPath = useMemo(() => hero ? mediaPath(hero) : '/', [hero]);
  const homepageSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${toAbsoluteSiteUrl('/')}#website`, name: SITE_NAME, url: toAbsoluteSiteUrl('/'), description: 'Movie, TV-show, and anime discovery with factual title information and personal watchlists.', inLanguage: 'en' },
      { '@type': 'Organization', '@id': `${toAbsoluteSiteUrl('/')}#organization`, name: SITE_NAME, url: toAbsoluteSiteUrl('/'), publishingPrinciples: toAbsoluteSiteUrl('/editorial-policy') }
    ]
  }), []);
  useEffect(() => { if (hero) setHeroSaved(isInMyList(hero.id, hero.type)); }, [hero]);

  const stepHero = (direction: number) => {
    setActiveHeroIndex(index => (index + direction + heroItems.length) % heroItems.length);
    setHeroPaused(true);
  };

  const toggleHeroSaved = () => {
    if (!hero) return;
    if (heroSaved) removeFromMyList(hero.id, hero.type);
    else addToMyList(hero);
    setHeroSaved(!heroSaved);
  };

  return (
    <div className="page-home">
      <Seo title="StreamNexus — Discover Movies, TV Shows & Anime" description="Explore movies, TV shows, and anime with story summaries, release details, trailers, related titles, and personal watchlists." path="/" jsonLd={homepageSchema} />
      {hero ? (
        <section className="hero" aria-label="Featured title">
          <img key={`${hero.type}-${hero.id}`} className="hero-art" src={backdropSrc(hero.banner || hero.poster)} srcSet={backdropSrcSet(hero.banner || hero.poster)} sizes="100vw" alt="" aria-hidden="true" width="1280" height="720" fetchPriority="high" decoding="async" />
          <div className="hero-scrim" />
          <div className="shell hero-layout">
            <motion.div
              key={`copy-${hero.id}`}
              className="hero-copy"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .65, delay: .12, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="eyebrow"><Sparkles size={13} /> Tonight&apos;s spotlight</div>
              <h1>{hero.title}</h1>
              <div className="hero-facts">
                <strong>{hero.rating ? `${Math.round(hero.rating * 10)}% match` : 'New'}</strong>
                <span>{hero.releaseDate?.slice(0, 4)}</span>
                <span>{hero.type === 'tv' ? 'Series' : 'Film'}</span>
              </div>
              <p>{hero.description}</p>
              <div className="hero-actions">
                <Link className="button button-primary" to={heroPath}><Play size={17} fill="currentColor" /> View title</Link>
                <Link className="button button-quiet" to={heroPath}><Info size={17} /> Details</Link>
                <button className={`button button-icon ${heroSaved ? 'is-saved' : ''}`} onClick={toggleHeroSaved} aria-label={heroSaved ? 'Remove from my list' : 'Add to my list'}><Bookmark size={18} fill={heroSaved ? 'currentColor' : 'none'} /></button>
              </div>
              <div className="hero-controls hero-controls-mobile">
                <button onClick={() => stepHero(-1)} aria-label="Previous spotlight"><ChevronLeft size={17} /></button>
                <button onClick={() => setHeroPaused(paused => !paused)} aria-pressed={heroPaused} aria-label={heroPaused ? 'Resume spotlight rotation' : 'Pause spotlight rotation'}>{heroPaused ? <Play size={15} fill="currentColor" /> : <Pause size={15} fill="currentColor" />}</button>
                <button onClick={() => stepHero(1)} aria-label="Next spotlight"><ChevronRight size={17} /></button>
              </div>
            </motion.div>
            <div className="hero-side">
              <div className="hero-rail" aria-label="Featured titles">
                {heroItems.map((item, index) => (
                  <button key={`${item.type}-${item.id}`} className={index === activeHeroIndex ? 'active' : ''} onClick={() => { setActiveHeroIndex(index); setHeroPaused(true); }}>
                    <span>0{index + 1}</span><b>{item.title}</b><i />
                  </button>
                ))}
              </div>
              <div className="hero-controls">
                <button onClick={() => stepHero(-1)} aria-label="Previous spotlight"><ChevronLeft size={17} /></button>
                <button onClick={() => setHeroPaused(paused => !paused)} aria-pressed={heroPaused} aria-label={heroPaused ? 'Resume spotlight rotation' : 'Pause spotlight rotation'}>{heroPaused ? <Play size={15} fill="currentColor" /> : <Pause size={15} fill="currentColor" />}</button>
                <button onClick={() => stepHero(1)} aria-label="Next spotlight"><ChevronRight size={17} /></button>
              </div>
            </div>
          </div>
          <div className="hero-scrollcue">Scroll to browse <ArrowRight size={14} /></div>
        </section>
      ) : (
        <section className="hero hero-fallback" aria-labelledby="home-heading">
          <div className="hero-scrim" />
          <div className="shell hero-layout">
            <div className="hero-copy">
              <div className="eyebrow"><Sparkles size={13} /> Movie, TV, and anime discovery</div>
              <h1 id="home-heading">Discover your next story</h1>
              <p>Explore factual story summaries, release details, genres, trailers, and related titles.</p>
              {loading && <span className="loading-note" role="status">Loading current catalog highlights…</span>}
              <div className="hero-actions"><Link className="button button-primary" to="/movies">Browse movies <ArrowRight size={16} /></Link><Link className="button button-quiet" to="/tv-shows">Browse TV shows</Link></div>
            </div>
          </div>
        </section>
      )}

      <div className="catalog-flow">
        <Advertisement />
        {catalogWarning && <div className="catalog-warning shell" role="status"><AlertCircle size={17} /><span>{catalogWarning}</span><button onClick={() => setRetryKey(key => key + 1)}><RefreshCcw size={14} /> Retry</button></div>}
        <section className="vibe-section shell">
          <header><div className="eyebrow">Choose your energy</div><h2>What are you in the mood for?</h2></header>
          <div className="vibe-grid">
            <Link to="/movies/genre/action"><span>01</span><div><b>Adrenaline</b><small>Action · Thrillers · High stakes</small></div><ArrowRight size={18} /></Link>
            <Link to="/movies/genre/science-fiction"><span>02</span><div><b>Other worlds</b><small>Sci-fi · Fantasy · Wonder</small></div><ArrowRight size={18} /></Link>
            <Link to="/movies/genre/drama"><span>03</span><div><b>Feel something</b><small>Drama · Romance · True stories</small></div><ArrowRight size={18} /></Link>
          </div>
        </section>
        {continueWatching.length > 0 && (
          <Row title="Continue watching" kicker="Pick up where you left off" items={continueWatching} featured onRemoveItem={(item, event) => {
            event.preventDefault(); event.stopPropagation();
            removeWatchProgress(item.id, item.type); refreshContinueWatching();
          }} />
        )}
        <Row title="Most watched this week" kicker="The current conversation" items={data.latestMovies.length ? data.latestMovies : data.trendingMovies} featured explorePath="/movies" />
        <Row title="MCU Verse" kicker="Marvel Cinematic Universe timeline" items={mcuItems} featured />
        <Advertisement />
        <Row title="Series worth the commitment" kicker="Long-form stories" items={data.latestTv.length ? data.latestTv : data.trendingTv} explorePath="/tv-shows" />
        <Row title="Critics' circle" kicker="High scores, low risk" items={data.topRatedMovies} explorePath="/movies?rating=8" />
        <Row title="Action without filler" kicker="Maximum velocity" items={data.actionMovies} explorePath="/movies?genre=28" />
        <Advertisement />
        <Row title="Other worlds" kicker="Science fiction" items={data.scifiMovies} explorePath="/movies?genre=878" />
        <Row title="The human condition" kicker="Drama" items={data.dramaMovies} explorePath="/movies?genre=18" />
      </div>
    </div>
  );
};

export default Home;
