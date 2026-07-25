import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bookmark, ChevronLeft, ChevronRight, Info, Pause, Play, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { tmdbService } from '../services/tmdb';
import { vidsrcService } from '../services/vidsrc';
import { MediaItem } from '../types';
import Row from '../components/Row';
import Loader from '../components/Loader';
import { getWatchProgressList, removeWatchProgress } from '../lib/watchProgress';
import { mcuData } from '../src/data/mcu';
import { addToMyList, isInMyList, removeFromMyList } from '../lib/myList';

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HomeData>(emptyData);
  const [heroItems, setHeroItems] = useState<MediaItem[]>([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
  const [heroPaused, setHeroPaused] = useState(false);
  const [heroSaved, setHeroSaved] = useState(false);

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
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [latestMovies, latestTv, trendingMovies, trendingTv, topRatedMovies, popularTv, actionMovies, scifiMovies, dramaMovies] = await Promise.all([
          vidsrcService.getLatestMovies(1), vidsrcService.getLatestTvShows(1),
          tmdbService.getTrending('movie'), tmdbService.getTrending('tv'),
          tmdbService.getTopRated('movie'), tmdbService.getPopular('tv'),
          tmdbService.getByGenre('movie', 28), tmdbService.getByGenre('movie', 878),
          tmdbService.getByGenre('movie', 18)
        ]);
        if (!active) return;
        const next = { latestMovies, latestTv, trendingMovies, trendingTv, topRatedMovies, popularTv, actionMovies, scifiMovies, dramaMovies };
        setData(next);
        setHeroItems([...trendingMovies.slice(0, 4), ...trendingTv.slice(0, 2)]);
      } catch (error) {
        console.error('Home fetch error', error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (heroItems.length < 2 || heroPaused) return;
    const timer = window.setInterval(() => setActiveHeroIndex(i => (i + 1) % heroItems.length), 9000);
    return () => window.clearInterval(timer);
  }, [heroItems.length, heroPaused]);

  const hero = heroItems[activeHeroIndex];
  const heroPath = useMemo(() => hero ? `/${hero.type}/${hero.id}` : '/', [hero]);
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

  if (loading) return <Loader page label="Calibrating your feed" />;

  return (
    <div className="page-home">
      {hero && (
        <section className="hero" aria-label="Featured title">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${hero.type}-${hero.id}`}
              className="hero-art"
              initial={{ opacity: 0, scale: 1.025 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: .75, ease: [0.16, 1, 0.3, 1] }}
              style={{ backgroundImage: `url(${hero.banner || hero.poster})` }}
            />
          </AnimatePresence>
          <div className="hero-scrim" />
          <div className="shell hero-layout">
            <motion.div
              key={`copy-${hero.id}`}
              className="hero-copy"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .65, delay: .12, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="eyebrow"><Sparkles size={13} /> Tonight's spotlight</div>
              <h1>{hero.title}</h1>
              <div className="hero-facts">
                <strong>{hero.rating ? `${Math.round(hero.rating * 10)}% match` : 'New'}</strong>
                <span>{hero.releaseDate?.slice(0, 4)}</span>
                <span>{hero.type === 'tv' ? 'Series' : 'Film'}</span>
              </div>
              <p>{hero.description}</p>
              <div className="hero-actions">
                <button className="button button-primary" onClick={() => navigate(heroPath)}><Play size={17} fill="currentColor" /> Watch now</button>
                <button className="button button-quiet" onClick={() => navigate(heroPath)}><Info size={17} /> Details</button>
                <button className={`button button-icon ${heroSaved ? 'is-saved' : ''}`} onClick={toggleHeroSaved} aria-label={heroSaved ? 'Remove from my list' : 'Add to my list'}><Bookmark size={18} fill={heroSaved ? 'currentColor' : 'none'} /></button>
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
                <button onClick={() => setHeroPaused(paused => !paused)} aria-label={heroPaused ? 'Resume spotlight rotation' : 'Pause spotlight rotation'}>{heroPaused ? <Play size={15} fill="currentColor" /> : <Pause size={15} fill="currentColor" />}</button>
                <button onClick={() => stepHero(1)} aria-label="Next spotlight"><ChevronRight size={17} /></button>
              </div>
            </div>
          </div>
          <div className="hero-scrollcue">Scroll to browse <ArrowRight size={14} /></div>
        </section>
      )}

      <div className="catalog-flow">
        <section className="vibe-section shell">
          <header><div className="eyebrow">Choose your energy</div><h2>What are you in the mood for?</h2></header>
          <div className="vibe-grid">
            <button onClick={() => navigate('/movies?genre=28')}><span>01</span><div><b>Adrenaline</b><small>Action · Thrillers · High stakes</small></div><ArrowRight size={18} /></button>
            <button onClick={() => navigate('/movies?genre=878')}><span>02</span><div><b>Other worlds</b><small>Sci-fi · Fantasy · Wonder</small></div><ArrowRight size={18} /></button>
            <button onClick={() => navigate('/movies?genre=18')}><span>03</span><div><b>Feel something</b><small>Drama · Romance · True stories</small></div><ArrowRight size={18} /></button>
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
        <Row title="Series worth the commitment" kicker="Long-form stories" items={data.latestTv.length ? data.latestTv : data.trendingTv} explorePath="/tv-shows" />
        <Row title="Critics' circle" kicker="High scores, low risk" items={data.topRatedMovies} explorePath="/movies?rating=8" />
        <Row title="Action without filler" kicker="Maximum velocity" items={data.actionMovies} explorePath="/movies?genre=28" />
        <Row title="Other worlds" kicker="Science fiction" items={data.scifiMovies} explorePath="/movies?genre=878" />
        <Row title="The human condition" kicker="Drama" items={data.dramaMovies} explorePath="/movies?genre=18" />
      </div>
    </div>
  );
};

export default Home;
