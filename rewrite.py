import os

files = {
"App.tsx": """import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Movies from './pages/Movies';
import TVShows from './pages/TVShows';
import Details from './pages/Details';
import SearchPage from './pages/Search';
import MyList from './pages/MyList';
import OnboardingModal from './components/OnboardingModal';

const App: React.FC = () => (
  <BrowserRouter>
    <div className="app-shell">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/tv-shows" element={<TVShows />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/my-list" element={<MyList />} />
          <Route path="/movie/:id" element={<Details />} />
          <Route path="/tv/:id" element={<Details />} />
          <Route path="/anime/:id" element={<Details />} />
          <Route path="/manga/:id" element={<Details />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="shell footer-grid">
          <div><strong>STREAMNEXUS</strong><span>Independent discovery interface</span></div>
          <div className="service-status"><i />Discovery services online</div>
          <div className="footer-meta">TMDB metadata · Build 3.0</div>
        </div>
      </footer>
      <OnboardingModal />
    </div>
  </BrowserRouter>
);

export default App;
""",

"pages/Home.tsx": """import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Info, Play, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { tmdbService } from '../services/tmdb';
import { vidsrcService } from '../services/vidsrc';
import { MediaItem } from '../types';
import Row from '../components/Row';
import Loader from '../components/Loader';
import { getWatchProgressList, removeWatchProgress } from '../lib/watchProgress';

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
        setHeroItems([...trendingMovies.slice(0, 6), ...trendingTv.slice(0, 4)]);
      } catch (error) {
        console.error('Home fetch error', error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (heroItems.length < 2) return;
    const timer = window.setInterval(() => setActiveHeroIndex(i => (i + 1) % heroItems.length), 9000);
    return () => window.clearInterval(timer);
  }, [heroItems.length]);

  const hero = heroItems[activeHeroIndex];
  const heroPath = useMemo(() => hero ? `/${hero.type}/${hero.id}` : '/', [hero]);

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
              <div className="eyebrow"><Sparkles size={13} /> Spotlight selection</div>
              <h1>{hero.title}</h1>
              <div className="hero-facts">
                <strong>{hero.rating ? hero.rating.toFixed(1) : 'NR'}</strong>
                <span>{hero.releaseDate?.slice(0, 4)}</span>
                <span>{hero.type === 'tv' ? 'Series' : 'Film'}</span>
                <span>{hero.genres?.slice(0, 2).map(g => g.name).join(' / ')}</span>
              </div>
              <p>{hero.description}</p>
              <div className="hero-actions">
                <button className="button button-primary" onClick={() => navigate(heroPath)}><Play size={17} fill="currentColor" /> Watch now</button>
                <button className="button button-quiet" onClick={() => navigate(heroPath)}><Info size={17} /> Details</button>
              </div>
            </motion.div>
            <div className="hero-rail" aria-label="Featured titles">
              {heroItems.slice(0, 5).map((item, index) => (
                <button key={`${item.type}-${item.id}`} className={index === activeHeroIndex ? 'active' : ''} onClick={() => setActiveHeroIndex(index)}>
                  <span>0{index + 1}</span><b>{item.title}</b><i />
                </button>
              ))}
            </div>
          </div>
          <div className="hero-scrollcue">Scroll to browse <ArrowRight size={14} /></div>
        </section>
      )}

      <div className="catalog-flow">
        {continueWatching.length > 0 && (
          <Row title="Continue watching" kicker="Pick up where you left off" items={continueWatching} featured onRemoveItem={(item, event) => {
            event.preventDefault(); event.stopPropagation();
            removeWatchProgress(item.id, item.type); refreshContinueWatching();
          }} />
        )}
        <Row title="Most watched this week" kicker="The current conversation" items={data.latestMovies.length ? data.latestMovies : data.trendingMovies} featured />
        <Row title="Series worth the commitment" kicker="Long-form stories" items={data.latestTv.length ? data.latestTv : data.trendingTv} />
        <Row title="Critics' circle" kicker="High scores, low risk" items={data.topRatedMovies} />
        <Row title="Action without filler" kicker="Maximum velocity" items={data.actionMovies} />
        <Row title="Other worlds" kicker="Science fiction" items={data.scifiMovies} />
        <Row title="The human condition" kicker="Drama" items={data.dramaMovies} />
      </div>
    </div>
  );
};

export default Home;
""",

"pages/Movies.tsx": """import React, { useEffect, useState } from 'react';
import { Film } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';
import Row from '../components/Row';
import Loader from '../components/Loader';
import GenreFilter from '../components/GenreFilter';
import MediaCard from '../components/MediaCard';

const Movies: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState<number | null>(null);
  const [year, setYear] = useState('');
  const [rating, setRating] = useState(0);
  const [filtered, setFiltered] = useState<MediaItem[]>([]);
  const [data, setData] = useState<Record<string, MediaItem[]>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [trending, newMovies, bollywood, popular, topRated, action, comedy, horror, romance, scifi] = await Promise.all([
          tmdbService.getTrending('movie'), tmdbService.getByYear('movie', new Date().getFullYear()),
          tmdbService.getByLanguage('movie', 'hi'), tmdbService.getPopular('movie'),
          tmdbService.getTopRated('movie'), tmdbService.getByGenre('movie', 28),
          tmdbService.getByGenre('movie', 35), tmdbService.getByGenre('movie', 27),
          tmdbService.getByGenre('movie', 10749), tmdbService.getByGenre('movie', 878)
        ]);
        if (active) setData({ trending, newMovies, bollywood, popular, topRated, action, comedy, horror, romance, scifi });
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (genre === null) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const items = await tmdbService.getByGenre('movie', genre, year, rating);
        if (active) setFiltered(items);
      } finally { if (active) setLoading(false); }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [genre, year, rating]);

  if (loading && genre === null) return <Loader page label="Opening the film archive" />;

  return (
    <div className="browse-page shell">
      <header className="browse-header">
        <div><div className="eyebrow"><Film size={13} /> Film archive</div><h1>Movies</h1><p>Big releases, quiet masterpieces, and everything between.</p></div>
        <div className="archive-count">CURATED DAILY</div>
      </header>
      <GenreFilter type="movie" selectedGenreId={genre} onSelectGenre={setGenre} />
      {genre !== null ? (
        <section className="filtered-section">
          <div className="filter-bar">
            <label><span>Release year</span><input inputMode="numeric" placeholder="2026" value={year} onChange={e => setYear(e.target.value)} /></label>
            <label><span>Minimum score</span><select value={rating} onChange={e => setRating(Number(e.target.value))}><option value={0}>Any score</option><option value={6}>6.0+</option><option value={7}>7.0+</option><option value={8}>8.0+</option><option value={9}>9.0+</option></select></label>
          </div>
          {loading ? <Loader label="Refining selection" /> : filtered.length ? <div className="media-grid">{filtered.map((item, i) => <MediaCard key={`${item.type}-${item.id}`} item={item} index={i} />)}</div> : <div className="empty-state"><h2>No clean match.</h2><p>Loosen the year or score and try again.</p></div>}
        </section>
      ) : <div className="browse-rows"><Row title="Trending now" kicker="The films moving culture" items={data.trending} featured /><Row title="Fresh arrivals" kicker="New this year" items={data.newMovies} /><Row title="Hindi cinema" kicker="Bollywood and beyond" items={data.bollywood} /><Row title="Popular" kicker="Crowd magnets" items={data.popular} /><Row title="Top rated" kicker="Consensus classics" items={data.topRated} /><Row title="Action" items={data.action} /><Row title="Comedy" items={data.comedy} /><Row title="Horror" items={data.horror} /><Row title="Romance" items={data.romance} /><Row title="Science fiction" items={data.scifi} /></div>}
    </div>
  );
};
export default Movies;
""",

"pages/TVShows.tsx": """import React, { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';
import Row from '../components/Row';
import Loader from '../components/Loader';
import GenreFilter from '../components/GenreFilter';
import MediaCard from '../components/MediaCard';

const TVShows: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState<number | null>(null);
  const [year, setYear] = useState('');
  const [rating, setRating] = useState(0);
  const [filtered, setFiltered] = useState<MediaItem[]>([]);
  const [data, setData] = useState<Record<string, MediaItem[]>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [trending, newShows, hindi, popular, topRated, action, comedy, crime, drama, scifi] = await Promise.all([
          tmdbService.getTrending('tv'), tmdbService.getByYear('tv', new Date().getFullYear()),
          tmdbService.getByLanguage('tv', 'hi'), tmdbService.getPopular('tv'),
          tmdbService.getTopRated('tv'), tmdbService.getByGenre('tv', 10759),
          tmdbService.getByGenre('tv', 35), tmdbService.getByGenre('tv', 80),
          tmdbService.getByGenre('tv', 18), tmdbService.getByGenre('tv', 10765)
        ]);
        if (active) setData({ trending, newShows, hindi, popular, topRated, action, comedy, crime, drama, scifi });
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (genre === null) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try { const items = await tmdbService.getByGenre('tv', genre, year, rating); if (active) setFiltered(items); }
      finally { if (active) setLoading(false); }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [genre, year, rating]);

  if (loading && genre === null) return <Loader page label="Tuning the series signal" />;

  return (
    <div className="browse-page shell">
      <header className="browse-header"><div><div className="eyebrow"><Radio size={13} /> Series index</div><h1>TV shows</h1><p>Stories that earn the next episode.</p></div><div className="archive-count">SEASON READY</div></header>
      <GenreFilter type="tv" selectedGenreId={genre} onSelectGenre={setGenre} />
      {genre !== null ? (
        <section className="filtered-section">
          <div className="filter-bar"><label><span>First air year</span><input inputMode="numeric" placeholder="2026" value={year} onChange={e => setYear(e.target.value)} /></label><label><span>Minimum score</span><select value={rating} onChange={e => setRating(Number(e.target.value))}><option value={0}>Any score</option><option value={6}>6.0+</option><option value={7}>7.0+</option><option value={8}>8.0+</option><option value={9}>9.0+</option></select></label></div>
          {loading ? <Loader label="Refining selection" /> : filtered.length ? <div className="media-grid">{filtered.map((item, i) => <MediaCard key={`${item.type}-${item.id}`} item={item} index={i} />)}</div> : <div className="empty-state"><h2>Nothing survives those filters.</h2><p>Try a broader year or score.</p></div>}
        </section>
      ) : <div className="browse-rows"><Row title="Trending series" kicker="What everyone is binging" items={data.trending} featured /><Row title="New seasons" kicker="Freshly transmitted" items={data.newShows} /><Row title="Hindi series" kicker="Local stories, global scale" items={data.hindi} /><Row title="Popular" items={data.popular} /><Row title="Top rated" items={data.topRated} /><Row title="Action and adventure" items={data.action} /><Row title="Comedy" items={data.comedy} /><Row title="Crime" items={data.crime} /><Row title="Drama" items={data.drama} /><Row title="Science fiction and fantasy" items={data.scifi} /></div>}
    </div>
  );
};
export default TVShows;
""",

"pages/Search.tsx": """import React, { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';
import MediaCard from '../components/MediaCard';
import Loader from '../components/Loader';

const SearchPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const query = params.get('q')?.trim() || '';
  const type = params.get('t') || 'media';
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const year = params.get('y') || '';
  const rating = Number(params.get('r') || 0);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const groups: MediaItem[][] = [];
        if (type === 'media' || type === 'all' || type === 'movie') groups.push(await tmdbService.search(query, 'movie'));
        if (type === 'media' || type === 'all' || type === 'tv') groups.push(await tmdbService.search(query, 'tv'));
        if (active) setResults(groups.flat());
      } finally { if (active) setLoading(false); }
    }, 350);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, type]);

  const filtered = useMemo(() => results.filter(item => (!rating || item.rating >= rating) && (!year || item.releaseDate?.startsWith(year))), [results, rating, year]);
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); setParams(next); };

  return (
    <div className="search-page shell">
      <header className="search-heading"><div className="eyebrow"><SearchIcon size={13} /> Search archive</div><h1>{query ? <>Results for <span>“{query}”</span></> : 'Find your next obsession'}</h1><p>{loading ? 'Searching the catalog…' : `${filtered.length} ${filtered.length === 1 ? 'title' : 'titles'} found`}</p></header>
      <div className="search-tools"><div><SlidersHorizontal size={16} /><strong>Refine</strong></div><label><span>Year</span><input value={year} placeholder="Any" onChange={e => update('y', e.target.value)} /></label><label><span>Score</span><select value={rating} onChange={e => update('r', e.target.value === '0' ? '' : e.target.value)}><option value="0">Any</option><option value="6">6.0+</option><option value="7">7.0+</option><option value="8">8.0+</option><option value="9">9.0+</option></select></label></div>
      {loading ? <Loader label="Searching" /> : filtered.length ? <div className="media-grid">{filtered.map((item, i) => <MediaCard key={`${item.type}-${item.id}-${i}`} item={item} index={i} />)}</div> : <div className="empty-state"><SearchIcon size={28} /><h2>{query ? 'No convincing match.' : 'Start with a title.'}</h2><p>{query ? 'Check the spelling or clear a filter.' : 'Use the search field above to scan movies and series.'}</p></div>}
    </div>
  );
};
export default SearchPage;
""",

"pages/MyList.tsx": """import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Library } from 'lucide-react';
import { getMyList, MyListItem, removeFromMyList } from '../lib/myList';
import { WatchStatus } from '../types';
import MediaCard from '../components/MediaCard';

const filters: { value: WatchStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'watching', label: 'Watching' },
  { value: 'plan_to_watch', label: 'Up next' }, { value: 'completed', label: 'Finished' },
  { value: 'on_hold', label: 'Paused' }, { value: 'dropped', label: 'Dropped' }
];

const MyList: React.FC = () => {
  const [items, setItems] = useState<MyListItem[]>([]);
  const [filter, setFilter] = useState<WatchStatus | 'all'>('all');
  useEffect(() => setItems(getMyList()), []);
  const visible = useMemo(() => items.filter(item => filter === 'all' || item.watchStatus === filter || (!item.watchStatus && filter === 'plan_to_watch')), [items, filter]);

  return (
    <div className="list-page shell">
      <header className="browse-header"><div><div className="eyebrow"><Library size={13} /> Personal library</div><h1>My list</h1><p>{items.length ? `${items.length} saved ${items.length === 1 ? 'title' : 'titles'}, organized your way.` : 'Build a queue worth coming back to.'}</p></div></header>
      <div className="status-tabs" role="tablist" aria-label="Watch status">{filters.map(item => <button role="tab" aria-selected={filter === item.value} className={filter === item.value ? 'active' : ''} key={item.value} onClick={() => setFilter(item.value)}>{item.label}<span>{items.filter(x => item.value === 'all' || x.watchStatus === item.value).length}</span></button>)}</div>
      {visible.length ? <div className="media-grid">{visible.map((item, i) => <MediaCard key={`${item.type}-${item.id}`} item={item} index={i} onRemove={event => { event.preventDefault(); removeFromMyList(item.id, item.type); setItems(getMyList()); }} />)}</div> : <div className="empty-state"><Bookmark size={30} /><h2>Nothing here yet.</h2><p>Save a title or switch to another status.</p></div>}
    </div>
  );
};
export default MyList;
""",

"pages/Details.tsx": """import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { BookOpen, Calendar, Check, ChevronDown, ExternalLink, Layers, Play, Server, SkipBack, SkipForward, Star, Video } from 'lucide-react';
import { MediaItem, PlaybackState, EpisodeInfo, WatchStatus } from '../types';
import { tmdbService } from '../services/tmdb';
import { anilistService } from '../services/anilist';
import { generateEmbedUrl } from '../services/embed';
import { addToMyList, getMyListStatus, isInMyList, removeFromMyList } from '../lib/myList';
import { getWatchProgress, saveWatchProgress } from '../lib/watchProgress';
import Row from '../components/Row';
import Loader from '../components/Loader';

const statuses: { value: WatchStatus; label: string }[] = [
  { value: 'watching', label: 'Watching' }, { value: 'plan_to_watch', label: 'Plan to watch' },
  { value: 'completed', label: 'Completed' }, { value: 'on_hold', label: 'On hold' }, { value: 'dropped', label: 'Dropped' }
];

const Details: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const type = location.pathname.split('/')[1] as 'movie' | 'tv' | 'anime' | 'manga';
  const playerRef = useRef<HTMLDivElement>(null);
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [collection, setCollection] = useState<MediaItem[]>([]);
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [saved, setSaved] = useState(false);
  const [watchStatus, setWatchStatus] = useState<WatchStatus>('plan_to_watch');
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [playState, setPlayState] = useState<PlaybackState>({ isPlaying: false, season: 1, episode: 1, chapter: 1, isDub: false, server: 1 });

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      setLoading(true); setCollection([]); setRecommendations([]);
      try {
        let result: MediaItem | null = null;
        if (type === 'movie' || type === 'tv') result = await tmdbService.getDetails(Number(id), type);
        else result = await anilistService.getDetails(Number(id), type);
        if (!active) return;
        setMedia(result);
        if (!result) return;
        setSaved(isInMyList(result.id, result.type));
        setWatchStatus((getMyListStatus(result.id, result.type) as WatchStatus) || 'plan_to_watch');
        const progress = getWatchProgress(result.id, result.type);
        setPlayState({ isPlaying: false, season: progress?.season || 1, episode: progress?.episode || 1, chapter: progress?.chapter || 1, isDub: false, server: 1 });
        if ((type === 'movie' || type === 'tv') && result.id) setRecommendations(await tmdbService.getRecommendations(Number(result.id), type));
        if (type === 'movie' && result.collectionId) setCollection((await tmdbService.getCollection(result.collectionId)).filter(item => item.id !== result!.id));
      } catch (error) { console.error('Details fetch error', error); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [id, type]);

  useEffect(() => {
    if (!media || (media.type !== 'tv' && media.type !== 'anime') || !media.tmdbId) return;
    let active = true;
    setLoadingEpisodes(true);
    tmdbService.getSeason(media.tmdbId, playState.season).then(data => { if (active) setEpisodes(data.episodes || []); }).finally(() => { if (active) setLoadingEpisodes(false); });
    return () => { active = false; };
  }, [media, playState.season]);

  useEffect(() => {
    if (media && playState.isPlaying) saveWatchProgress(media, { season: playState.season, episode: playState.episode, chapter: playState.chapter });
  }, [media, playState.isPlaying, playState.season, playState.episode, playState.chapter]);

  const embedUrl = useMemo(() => media ? generateEmbedUrl(media, playState) : '', [media, playState]);
  const start = () => { setPlayState(state => ({ ...state, isPlaying: true })); window.setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80); };
  const selectEpisode = (episode: number) => { setPlayState(state => ({ ...state, episode, isPlaying: true })); window.setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth' }), 80); };
  const nextEpisode = () => { const index = episodes.findIndex(ep => ep.episode_number === playState.episode); if (index >= 0 && index < episodes.length - 1) selectEpisode(episodes[index + 1].episode_number); else if ((media?.seasons || 0) > playState.season) setPlayState(s => ({ ...s, season: s.season + 1, episode: 1 })); };
  const previousEpisode = () => { const index = episodes.findIndex(ep => ep.episode_number === playState.episode); if (index > 0) selectEpisode(episodes[index - 1].episode_number); };

  if (loading) return <Loader page label="Loading title" />;
  if (!media) return <div className="empty-state detail-missing"><h2>Title unavailable.</h2><p>The source returned no usable metadata.</p></div>;

  const isSeries = media.type === 'tv' || media.type === 'anime';
  return (
    <div className="detail-page">
      <section className="detail-hero">
        <img className="detail-backdrop" src={media.banner || media.poster} alt="" />
        <div className="detail-shade" />
        <div className="shell detail-layout">
          <img className="detail-poster" src={media.poster} alt={`${media.title} poster`} />
          <div className="detail-copy">
            <div className="eyebrow">{media.type} / {media.status || 'Available'}</div>
            <h1>{media.title}</h1>
            <div className="detail-facts"><strong><Star size={14} fill="currentColor" /> {media.rating?.toFixed(1) || 'NR'}</strong><span><Calendar size={14} /> {media.releaseDate?.slice(0, 4)}</span><span>{media.genres?.slice(0, 3).map(g => g.name).join(' / ')}</span></div>
            <p>{media.description}</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={start}>{media.type === 'manga' ? <BookOpen size={17} /> : <Play size={17} fill="currentColor" />}{media.type === 'manga' ? 'Start reading' : 'Watch now'}</button>
              <button className={`button button-quiet ${saved ? 'is-saved' : ''}`} onClick={() => { if (saved) { removeFromMyList(media.id, media.type); setSaved(false); } else { addToMyList(media, watchStatus); setSaved(true); } }}>{saved ? <Check size={17} /> : '+'}{saved ? 'Saved' : 'My list'}</button>
              {media.trailerUrl && <button className="button button-quiet" onClick={() => setTrailerOpen(true)}><Video size={17} /> Trailer</button>}
            </div>
            {saved && <label className="status-select"><span>Status</span><select value={watchStatus} onChange={event => { const value = event.target.value as WatchStatus; setWatchStatus(value); addToMyList(media, value); }}>{statuses.map(status => <option value={status.value} key={status.value}>{status.label}</option>)}</select><ChevronDown size={15} /></label>}
          </div>
        </div>
      </section>

      <div className="shell detail-content">
        {playState.isPlaying && (
          <section className="player-block" ref={playerRef}>
            <div className="player-toolbar"><div><span className="live-dot" />{media.type === 'movie' ? 'Now playing' : media.type === 'manga' ? `Chapter ${playState.chapter}` : `Season ${playState.season}, episode ${playState.episode}`}</div><div className="player-controls">{isSeries && <><button onClick={previousEpisode} aria-label="Previous episode"><SkipBack size={16} /></button><button onClick={nextEpisode} aria-label="Next episode"><SkipForward size={16} /></button><label className="auto-toggle"><input type="checkbox" checked={autoPlay} onChange={e => setAutoPlay(e.target.checked)} /><span />Auto next</label></>}<div className="server-toggle"><Server size={14} /><button className={playState.server === 1 ? 'active' : ''} onClick={() => setPlayState(s => ({ ...s, server: 1 }))}>A</button><button className={playState.server === 2 ? 'active' : ''} onClick={() => setPlayState(s => ({ ...s, server: 2 }))}>B</button></div>{embedUrl && <button onClick={() => window.open(embedUrl, '_blank', 'noopener,noreferrer')}><ExternalLink size={15} /> New tab</button>}</div></div>
            <div className="player-frame">{embedUrl ? <iframe key={embedUrl} src={embedUrl} title={`${media.title} player`} allowFullScreen allow="autoplay; encrypted-media; picture-in-picture" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-presentation" /> : <div className="empty-state"><Video size={28} /><h2>Source unavailable.</h2></div>}</div>
          </section>
        )}

        {isSeries && media.seasons && <section className="episodes-section"><div className="section-heading"><div><div className="eyebrow"><Layers size={13} /> Episode guide</div><h2>Choose an episode</h2></div><select value={playState.season} onChange={e => setPlayState(s => ({ ...s, season: Number(e.target.value), episode: 1 }))}>{Array.from({ length: media.seasons }, (_, i) => i + 1).map(season => <option key={season} value={season}>Season {season}</option>)}</select></div>{loadingEpisodes ? <Loader label="Loading episodes" /> : <div className="episode-list">{episodes.map(ep => <button key={ep.id} onClick={() => selectEpisode(ep.episode_number)} className={playState.episode === ep.episode_number ? 'active' : ''}><span className="episode-number">{String(ep.episode_number).padStart(2, '0')}</span>{ep.still_path ? <img src={ep.still_path} alt="" /> : <div className="episode-placeholder" />}<span><b>{ep.name}</b><small>{ep.overview || 'No synopsis available.'}</small></span><Play size={16} /></button>)}</div>}</section>}
        {media.type === 'manga' && (media.chapters || 0) > 0 && <section className="chapters-section"><div className="section-heading"><div><div className="eyebrow"><BookOpen size={13} /> Reading index</div><h2>Chapters</h2></div></div><div className="chapter-grid">{Array.from({ length: media.chapters || 0 }, (_, i) => i + 1).map(chapter => <button key={chapter} className={playState.chapter === chapter ? 'active' : ''} onClick={() => { setPlayState(s => ({ ...s, chapter, isPlaying: true })); }}>{String(chapter).padStart(3, '0')}</button>)}</div></section>}
        {collection.length > 0 && <Row title={`More in ${media.collectionName}`} kicker="Complete the collection" items={collection} featured />}
        {recommendations.length > 0 && <Row title="You may also like" kicker="Signal matched" items={recommendations} />}
      </div>

      {trailerOpen && media.trailerUrl && <div className="trailer-overlay" role="dialog" aria-modal="true" onClick={() => setTrailerOpen(false)}><div onClick={e => e.stopPropagation()}><button onClick={() => setTrailerOpen(false)} aria-label="Close trailer">×</button><iframe src={media.trailerUrl} title={`${media.title} trailer`} allowFullScreen allow="autoplay; encrypted-media; picture-in-picture" /></div></div>}
    </div>
  );
};
export default Details;
""",

"components/Navbar.tsx": """import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Bookmark, Menu, Search, Star, X } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MediaItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const searchType = () => location.pathname.startsWith('/movies') || searchParams.get('t') === 'movie' ? 'movie' : location.pathname.startsWith('/tv-shows') || searchParams.get('t') === 'tv' ? 'tv' : 'media';
  const active = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    let live = true;
    const timer = window.setTimeout(async () => {
      const type = searchType();
      const result = type === 'media' ? await tmdbService.searchMulti(query) : await tmdbService.search(query, type);
      if (live) { setSuggestions(result.slice(0, 6)); setShowSuggestions(true); }
    }, 280);
    return () => { live = false; window.clearTimeout(timer); };
  }, [query, location.pathname]);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setShowSuggestions(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!query.trim()) return; navigate(`/search?q=${encodeURIComponent(query.trim())}&t=${searchType()}`); setShowSuggestions(false); setMenuOpen(false); };
  const pick = () => { setQuery(''); setShowSuggestions(false); setMenuOpen(false); };

  return (
    <header className="site-nav">
      <nav className="shell nav-inner" aria-label="Primary navigation">
        <Link className="brand" to="/" onClick={() => setMenuOpen(false)}><span>SN</span><b>StreamNexus</b></Link>
        <div className="desktop-links"><Link className={active('/') ? 'active' : ''} to="/">Discover</Link><Link className={active('/movies') ? 'active' : ''} to="/movies">Movies</Link><Link className={active('/tv-shows') ? 'active' : ''} to="/tv-shows">Series</Link></div>
        <div className="nav-actions" ref={rootRef}>
          <form className="nav-search" onSubmit={submit}><Search size={16} /><input aria-label="Search catalog" value={query} onChange={e => setQuery(e.target.value)} onFocus={() => query && setShowSuggestions(true)} placeholder="Search titles" /></form>
          <Link to="/my-list" className={`saved-link ${active('/my-list') ? 'active' : ''}`} aria-label="My list"><Bookmark size={17} /><span>My list</span></Link>
          <button className="menu-button" onClick={() => setMenuOpen(open => !open)} aria-label="Toggle menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          {showSuggestions && suggestions.length > 0 && <div className="suggestions">{suggestions.map(item => <Link key={`${item.type}-${item.id}`} to={`/${item.type}/${item.id}`} onClick={pick}><img src={item.poster} alt="" /><span><b>{item.title}</b><small>{item.type} · {item.releaseDate?.slice(0, 4)} <i><Star size={10} fill="currentColor" /> {item.rating?.toFixed(1)}</i></small></span></Link>)}</div>}
        </div>
      </nav>
      {menuOpen && <div className="mobile-panel"><form onSubmit={submit}><Search size={17} /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search movies and series" /></form><Link to="/" onClick={pick}>Discover</Link><Link to="/movies" onClick={pick}>Movies</Link><Link to="/tv-shows" onClick={pick}>Series</Link><Link to="/my-list" onClick={pick}>My list</Link></div>}
    </header>
  );
};
export default Navbar;
""",

"components/GenreFilter.tsx": """import React, { useEffect, useState } from 'react';
import { tmdbService } from '../services/tmdb';

interface Props { type: 'movie' | 'tv'; selectedGenreId: number | null; onSelectGenre: (id: number | null) => void; }

const GenreFilter: React.FC<Props> = ({ type, selectedGenreId, onSelectGenre }) => {
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => { let active = true; tmdbService.getGenres(type).then(items => { if (active) setGenres(items); }).catch(console.error); return () => { active = false; }; }, [type]);
  if (!genres.length) return null;
  return <div className="genre-strip" role="tablist" aria-label="Genres"><button role="tab" aria-selected={selectedGenreId === null} className={selectedGenreId === null ? 'active' : ''} onClick={() => onSelectGenre(null)}>All titles</button>{genres.map(genre => <button role="tab" aria-selected={selectedGenreId === genre.id} className={selectedGenreId === genre.id ? 'active' : ''} key={genre.id} onClick={() => onSelectGenre(genre.id)}>{genre.name}</button>)}</div>;
};
export default GenreFilter;
""",

"components/Row.tsx": """import React, { useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../types';
import MediaCard from './MediaCard';

interface Props { title: string; items?: MediaItem[]; kicker?: string; featured?: boolean; isLarge?: boolean; onRemoveItem?: (item: MediaItem, event: React.MouseEvent) => void; }

const Row: React.FC<Props> = ({ title, items = [], kicker, featured = false, isLarge = false, onRemoveItem }) => {
  const rail = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  const move = (direction: number) => rail.current?.scrollBy({ left: direction * Math.min(rail.current.clientWidth * .82, 900), behavior: 'smooth' });
  return (
    <section className={`media-row shell ${featured || isLarge ? 'featured' : ''}`}>
      <header className="row-heading"><div>{kicker && <div className="eyebrow">{kicker}</div>}<h2>{title}</h2></div><div className="row-actions"><button onClick={() => move(-1)} aria-label="Scroll left"><ChevronLeft size={18} /></button><button onClick={() => move(1)} aria-label="Scroll right"><ChevronRight size={18} /></button><button className="explore">Explore <ArrowRight size={15} /></button></div></header>
      <div className="media-rail" ref={rail}>{items.map((item, index) => <MediaCard key={`${item.type}-${item.id}`} item={item} index={index} onRemove={onRemoveItem ? event => onRemoveItem(item, event) : undefined} />)}</div>
    </section>
  );
};
export default Row;
""",

"components/MediaCard.tsx": """import React from 'react';
import { Link } from 'react-router-dom';
import { Play, X } from 'lucide-react';
import { MediaItem } from '../types';

interface Props { item: MediaItem & { progress?: { season?: number; episode?: number; chapter?: number } }; index?: number; onRemove?: (event: React.MouseEvent) => void; }

const MediaCard: React.FC<Props> = ({ item, index = 0, onRemove }) => {
  const status = item.progress ? item.type === 'tv' || item.type === 'anime' ? `S${item.progress.season || 1} E${item.progress.episode || 1}` : item.type === 'manga' ? `Chapter ${item.progress.chapter || 1}` : 'Resume' : item.releaseDate?.slice(0, 4) || 'TBA';
  return (
    <Link to={`/${item.type}/${item.id}`} className="media-card" style={{ '--i': Math.min(index, 8) } as React.CSSProperties}>
      <div className="poster-wrap">
        <img src={item.poster} alt={`${item.title} poster`} loading="lazy" />
        <div className="poster-shade" />
        <span className="card-rank">{String(index + 1).padStart(2, '0')}</span>
        <span className="card-score">{item.rating ? item.rating.toFixed(1) : 'NR'}</span>
        {onRemove && <button className="remove-card" aria-label={`Remove ${item.title}`} onClick={event => { event.preventDefault(); event.stopPropagation(); onRemove(event); }}><X size={15} /></button>}
        <span className="card-play"><Play size={17} fill="currentColor" /></span>
        {item.progress && <span className="progress-track"><i /></span>}
      </div>
      <h3>{item.title}</h3>
      <div className="card-meta"><span>{status}</span><span>{item.genres?.[0]?.name || item.type}</span></div>
    </Link>
  );
};
export default MediaCard;
""",

"components/CustomButton.tsx": """import React from 'react';
interface Props { text: string; onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void; icon?: React.ReactNode; disabled?: boolean; className?: string; }
const CustomButton: React.FC<Props> = ({ text, onClick, icon, disabled, className = '' }) => <button className={`button button-primary ${className}`} onClick={onClick} disabled={disabled}>{icon}{text}</button>;
export default CustomButton;
""",

"components/Loader.tsx": """import React from 'react';
const Loader: React.FC<{ page?: boolean; label?: string }> = ({ page = false, label = 'Loading' }) => <div className={`loader ${page ? 'loader-page' : ''}`} role="status"><div className="loader-mark"><i /><i /><i /></div><span>{label}</span></div>;
export default Loader;
""",

"components/OnboardingModal.tsx": """import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ExternalLink, KeyRound } from 'lucide-react';
import { DEFAULT_TMDB_API_KEY, STORAGE_KEYS } from '../constants';

const OnboardingModal: React.FC = () => {
  const dialog = useRef<HTMLDialogElement>(null);
  const [apiKey, setApiKey] = useState('');
  useEffect(() => { if (!localStorage.getItem(STORAGE_KEYS.TMDB_API_KEY) && !DEFAULT_TMDB_API_KEY) dialog.current?.showModal(); }, []);
  const save = () => { if (!apiKey.trim()) return; localStorage.setItem(STORAGE_KEYS.TMDB_API_KEY, apiKey.trim()); dialog.current?.close(); window.location.reload(); };
  return <dialog className="onboarding" ref={dialog}><div className="onboarding-mark"><KeyRound size={22} /></div><div className="eyebrow">One-time setup</div><h2>Connect the catalog.</h2><p>StreamNexus uses TMDB for artwork, metadata, ratings, and discovery.</p><label><span>TMDB API key (v3)</span><input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Paste your key" /></label><button className="button button-primary" disabled={!apiKey.trim()} onClick={save}>Connect TMDB <ArrowRight size={16} /></button><a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">Get a free key <ExternalLink size={12} /></a><small>Stored only in this browser.</small></dialog>;
};
export default OnboardingModal;
""",

"index.tsx": """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
ReactDOM.createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
""",

"index.css": """@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap');
@import "tailwindcss";

@theme {
  --color-nexus-ink: oklch(11% .018 285);
  --color-nexus-base: oklch(15% .021 285);
  --color-nexus-raised: oklch(20% .024 285);
  --color-nexus-line: oklch(29% .025 285);
  --color-nexus-text: oklch(94% .012 95);
  --color-nexus-muted: oklch(68% .022 285);
  --color-nexus-lime: oklch(82% .16 101);
  --color-nexus-limedeep: oklch(72% .15 101);
  --color-nexus-violet: oklch(63% .14 318);
}

:root {
  color-scheme: dark;
  --ink: oklch(11% .018 285);
  --base: oklch(15% .021 285);
  --raised: oklch(20% .024 285);
  --line: oklch(29% .025 285);
  --line-soft: oklch(23% .023 285);
  --text: oklch(94% .012 95);
  --muted: oklch(68% .022 285);
  --accent: oklch(82% .16 101);
  --accent-deep: oklch(72% .15 101);
  --danger: oklch(65% .19 27);
  --font-sans: 'Manrope', system-ui, sans-serif;
  --font-mono: 'DM Mono', ui-monospace, monospace;
  --ease-out: cubic-bezier(.16,1,.3,1);
}

* { box-sizing: border-box; }
html { background: var(--ink); scroll-behavior: smooth; }
body { margin: 0; min-width: 320px; background: var(--ink); color: var(--text); font: 500 16px/1.55 var(--font-sans); letter-spacing: -.01em; font-optical-sizing: auto; }
button, input, select { font: inherit; }
button, a { -webkit-tap-highlight-color: transparent; }
button { color: inherit; }
a { color: inherit; text-decoration: none; }
img { display: block; max-width: 100%; }
h1, h2, h3, p { margin: 0; }
h1, h2, h3 { text-wrap: balance; }
p { text-wrap: pretty; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
::selection { background: var(--accent); color: var(--ink); }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--ink); }
::-webkit-scrollbar-thumb { background: var(--line); border-radius: 99px; }
.shell { width: min(100% - 32px, 1440px); margin-inline: auto; }
.app-shell { min-height: 100vh; padding-top: 72px; overflow: clip; }

.site-nav { position: fixed; inset: 0 0 auto; height: 72px; z-index: 40; background: oklch(11% .018 285 / .94); border-bottom: 1px solid var(--line-soft); backdrop-filter: blur(14px); }
.nav-inner { height: 100%; display: flex; align-items: center; gap: 44px; }
.brand { display: flex; align-items: center; gap: 11px; font-weight: 800; letter-spacing: -.045em; }
.brand span { width: 35px; height: 35px; display: grid; place-items: center; background: var(--accent); color: var(--ink); border-radius: 50%; font: 500 11px var(--font-mono); letter-spacing: 0; }
.brand b { font-size: 15px; }
.desktop-links { display: flex; align-items: center; gap: 30px; height: 100%; }
.desktop-links a { position: relative; color: var(--muted); font: 500 11px var(--font-mono); text-transform: uppercase; letter-spacing: .1em; }
.desktop-links a:hover, .desktop-links a.active { color: var(--text); }
.desktop-links a.active::after { content: ''; position: absolute; left: 0; right: 0; bottom: -25px; height: 2px; background: var(--accent); }
.nav-actions { margin-left: auto; display: flex; align-items: center; gap: 10px; position: relative; }
.nav-search { height: 40px; width: min(28vw, 300px); display: flex; align-items: center; gap: 10px; padding: 0 13px; background: var(--base); border: 1px solid var(--line-soft); border-radius: 99px; color: var(--muted); }
.nav-search:focus-within { border-color: var(--accent); color: var(--accent); }
.nav-search input { width: 100%; min-width: 0; color: var(--text); background: transparent; border: 0; outline: 0; font-size: 13px; }
.saved-link, .menu-button { height: 40px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 14px; background: transparent; border: 1px solid var(--line-soft); border-radius: 99px; color: var(--muted); font: 500 11px var(--font-mono); text-transform: uppercase; letter-spacing: .06em; cursor: pointer; }
.saved-link:hover, .saved-link.active { color: var(--text); border-color: var(--line); }
.menu-button { display: none; width: 42px; padding: 0; }
.suggestions { position: absolute; right: 0; top: 51px; width: min(380px, calc(100vw - 32px)); padding: 8px; background: var(--raised); border: 1px solid var(--line); border-radius: 15px; box-shadow: 0 24px 70px oklch(4% .01 285 / .55); }
.suggestions a { display: grid; grid-template-columns: 44px 1fr; gap: 12px; align-items: center; padding: 8px; border-radius: 10px; }
.suggestions a:hover { background: var(--base); }
.suggestions img { width: 44px; height: 62px; object-fit: cover; border-radius: 6px; background: var(--base); }
.suggestions span { min-width: 0; }
.suggestions b { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.suggestions small { display: flex; align-items: center; gap: 8px; margin-top: 5px; color: var(--muted); font: 400 10px var(--font-mono); text-transform: uppercase; }
.suggestions i { margin-left: auto; display: flex; align-items: center; gap: 3px; color: var(--accent); font-style: normal; }
.mobile-panel { display: none; }

.button { min-height: 46px; display: inline-flex; align-items: center; justify-content: center; gap: 9px; padding: 0 18px; border-radius: 99px; border: 1px solid transparent; cursor: pointer; font: 700 11px var(--font-mono); text-transform: uppercase; letter-spacing: .08em; transition: transform 220ms var(--ease-out), background-color 120ms, border-color 120ms; }
.button:hover { transform: translateY(-2px); }
.button:active { transform: translateY(0); }
.button:disabled { opacity: .45; cursor: not-allowed; transform: none; }
.button-primary { background: var(--accent); color: var(--ink); }
.button-primary:hover { background: var(--accent-deep); }
.button-quiet { background: var(--raised); border-color: var(--line); color: var(--text); }
.button-quiet:hover, .button-quiet.is-saved { border-color: var(--accent); }
.eyebrow { display: flex; align-items: center; gap: 8px; color: var(--accent); font: 500 10px var(--font-mono); text-transform: uppercase; letter-spacing: .13em; }

.hero { min-height: calc(100vh - 72px); position: relative; display: flex; align-items: flex-end; isolation: isolate; background: var(--base); }
.hero-art { position: absolute; inset: 0; z-index: -3; background-position: center 20%; background-size: cover; }
.hero-scrim { position: absolute; inset: 0; z-index: -2; background: linear-gradient(90deg, var(--ink) 0%, oklch(11% .018 285 / .94) 24%, oklch(11% .018 285 / .34) 66%, oklch(11% .018 285 / .12) 100%), linear-gradient(0deg, var(--ink), transparent 52%); }
.hero-layout { min-height: calc(100vh - 72px); display: grid; grid-template-columns: minmax(0, 760px) minmax(240px, 1fr); align-items: end; gap: 80px; padding-block: 120px 110px; }
.hero-copy h1 { max-width: 9ch; margin: 19px 0 24px -.055em; font-size: clamp(3.8rem, 8.2vw, 8.4rem); line-height: .86; letter-spacing: -.075em; font-weight: 800; }
.hero-facts { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; color: oklch(82% .018 285); font: 500 11px var(--font-mono); text-transform: uppercase; letter-spacing: .06em; }
.hero-facts strong { padding: 5px 8px; background: var(--accent); color: var(--ink); border-radius: 4px; }
.hero-copy > p { max-width: 62ch; margin-top: 22px; color: oklch(82% .018 285); font-size: 16px; line-height: 1.7; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
.hero-rail { justify-self: end; width: min(100%, 350px); border-top: 1px solid var(--line); }
.hero-rail button { width: 100%; display: grid; grid-template-columns: 30px 1fr 34px; align-items: center; gap: 12px; padding: 15px 0; background: transparent; border: 0; border-bottom: 1px solid var(--line-soft); text-align: left; cursor: pointer; color: var(--muted); }
.hero-rail button span { font: 400 10px var(--font-mono); }
.hero-rail button b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 600; }
.hero-rail button i { height: 2px; background: var(--line); transform-origin: left; }
.hero-rail button.active { color: var(--text); }
.hero-rail button.active i { background: var(--accent); }
.hero-scrollcue { position: absolute; right: 28px; bottom: 26px; display: flex; align-items: center; gap: 9px; color: var(--muted); font: 400 9px var(--font-mono); text-transform: uppercase; letter-spacing: .12em; transform: rotate(90deg) translateX(-100%); transform-origin: right bottom; }
.catalog-flow { padding-block: 24px 120px; }

.media-row { margin-top: 92px; }
.row-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.row-heading h2, .section-heading h2 { margin-top: 6px; font-size: clamp(1.65rem, 3vw, 2.75rem); line-height: 1.05; letter-spacing: -.055em; }
.row-actions { display: flex; gap: 7px; }
.row-actions button { height: 38px; min-width: 38px; display: grid; place-items: center; background: transparent; border: 1px solid var(--line-soft); border-radius: 50%; color: var(--muted); cursor: pointer; }
.row-actions button:hover { color: var(--text); border-color: var(--line); }
.row-actions .explore { width: auto; display: flex; padding: 0 14px; border-radius: 99px; gap: 7px; font: 500 10px var(--font-mono); text-transform: uppercase; }
.media-rail { display: grid; grid-auto-flow: column; grid-auto-columns: clamp(160px, 15.2vw, 220px); gap: 18px; overflow-x: auto; padding: 2px 1px 18px; scroll-snap-type: x proximity; scrollbar-width: none; }
.media-rail::-webkit-scrollbar { display: none; }
.media-row.featured .media-rail { grid-auto-columns: clamp(190px, 18.5vw, 270px); }
.media-card { min-width: 0; display: block; scroll-snap-align: start; animation: card-in 600ms var(--ease-out) both; animation-delay: calc(var(--i) * 35ms); }
.poster-wrap { position: relative; aspect-ratio: 2/3; overflow: hidden; background: var(--raised); border-radius: 10px; }
.poster-wrap > img { width: 100%; height: 100%; object-fit: cover; transition: transform 600ms var(--ease-out), filter 300ms; }
.media-card:hover .poster-wrap > img { transform: scale(1.045); filter: saturate(1.08); }
.poster-shade { position: absolute; inset: 45% 0 0; background: linear-gradient(transparent, oklch(6% .012 285 / .78)); opacity: .45; }
.card-rank, .card-score { position: absolute; top: 9px; min-height: 25px; display: grid; place-items: center; padding: 0 7px; background: var(--base); border: 1px solid var(--line); border-radius: 5px; font: 500 10px var(--font-mono); }
.card-rank { left: 9px; color: var(--muted); }
.card-score { right: 9px; color: var(--accent); }
.card-play { position: absolute; right: 11px; bottom: 11px; width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; background: var(--accent); color: var(--ink); opacity: 0; transform: translateY(8px); transition: transform 260ms var(--ease-out), opacity 180ms; }
.media-card:hover .card-play, .media-card:focus-visible .card-play { opacity: 1; transform: translateY(0); }
.remove-card { position: absolute; right: 9px; top: 42px; width: 28px; height: 28px; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 50%; background: var(--base); cursor: pointer; }
.remove-card:hover { background: var(--danger); border-color: var(--danger); }
.progress-track { position: absolute; inset: auto 0 0; height: 3px; background: var(--line); }
.progress-track i { display: block; width: 48%; height: 100%; background: var(--accent); }
.media-card h3 { margin-top: 12px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 14px; letter-spacing: -.02em; }
.card-meta { display: flex; justify-content: space-between; gap: 10px; margin-top: 4px; color: var(--muted); font: 400 9px var(--font-mono); text-transform: uppercase; letter-spacing: .06em; }
.card-meta span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

.browse-page, .search-page, .list-page { padding-block: 76px 120px; }
.browse-header { display: flex; justify-content: space-between; align-items: end; gap: 32px; margin-bottom: 42px; }
.browse-header h1, .search-heading h1 { margin: 10px 0 12px -.05em; font-size: clamp(3.4rem, 8vw, 7.5rem); line-height: .9; letter-spacing: -.075em; }
.browse-header p, .search-heading p { max-width: 60ch; color: var(--muted); }
.archive-count { color: var(--muted); font: 400 9px var(--font-mono); letter-spacing: .13em; }
.genre-strip { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; border-bottom: 1px solid var(--line-soft); scrollbar-width: none; }
.genre-strip button, .status-tabs button { min-height: 40px; flex: 0 0 auto; padding: 0 15px; background: transparent; border: 1px solid var(--line-soft); border-radius: 99px; color: var(--muted); cursor: pointer; font: 500 10px var(--font-mono); text-transform: uppercase; letter-spacing: .06em; }
.genre-strip button:hover, .genre-strip button.active, .status-tabs button:hover, .status-tabs button.active { color: var(--ink); background: var(--accent); border-color: var(--accent); }
.browse-rows .media-row { width: 100%; }
.filtered-section { margin-top: 36px; }
.filter-bar, .search-tools { display: flex; align-items: end; gap: 14px; margin-bottom: 38px; padding: 18px 0; border-bottom: 1px solid var(--line-soft); }
.filter-bar label, .search-tools label { display: grid; gap: 7px; }
.filter-bar label span, .search-tools label span, .status-select span { color: var(--muted); font: 400 9px var(--font-mono); text-transform: uppercase; letter-spacing: .1em; }
.filter-bar input, .filter-bar select, .search-tools input, .search-tools select, .section-heading select, .status-select select { height: 42px; padding: 0 13px; background: var(--base); color: var(--text); border: 1px solid var(--line); border-radius: 8px; outline: 0; }
.filter-bar input:focus, .filter-bar select:focus, .search-tools input:focus, .search-tools select:focus { border-color: var(--accent); }
.media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 34px 18px; }
.empty-state { min-height: 340px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--muted); text-align: center; border-top: 1px solid var(--line-soft); }
.empty-state h2 { color: var(--text); font-size: 1.5rem; letter-spacing: -.04em; }
.empty-state p { max-width: 46ch; font-size: 14px; }

.search-heading { margin-bottom: 30px; }
.search-heading h1 span { color: var(--accent); }
.search-tools > div { display: flex; align-items: center; gap: 8px; margin-right: auto; font: 500 11px var(--font-mono); text-transform: uppercase; }
.list-page .browse-header { margin-bottom: 30px; }
.status-tabs { display: flex; gap: 8px; overflow-x: auto; margin-bottom: 42px; padding-bottom: 14px; border-bottom: 1px solid var(--line-soft); scrollbar-width: none; }
.status-tabs button { display: flex; align-items: center; gap: 9px; }
.status-tabs button span { opacity: .55; }

.detail-hero { min-height: 690px; position: relative; isolation: isolate; display: flex; align-items: end; }
.detail-backdrop { position: absolute; inset: 0; z-index: -3; width: 100%; height: 100%; object-fit: cover; object-position: center 18%; }
.detail-shade { position: absolute; inset: 0; z-index: -2; background: linear-gradient(90deg, var(--ink), oklch(11% .018 285 / .8) 42%, transparent 78%), linear-gradient(0deg, var(--ink) 0%, transparent 58%); }
.detail-layout { display: grid; grid-template-columns: 190px minmax(0, 760px); gap: 36px; align-items: end; padding-block: 110px 64px; }
.detail-poster { width: 190px; aspect-ratio: 2/3; object-fit: cover; border-radius: 11px; border: 1px solid var(--line); }
.detail-copy h1 { margin: 11px 0 18px -.05em; font-size: clamp(3rem, 7vw, 6.8rem); line-height: .92; letter-spacing: -.07em; }
.detail-facts { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; color: var(--muted); font: 400 10px var(--font-mono); text-transform: uppercase; }
.detail-facts > * { display: flex; align-items: center; gap: 5px; }
.detail-facts strong { color: var(--accent); }
.detail-copy > p { max-width: 68ch; margin-top: 20px; color: oklch(80% .02 285); line-height: 1.72; }
.status-select { position: relative; width: 200px; display: grid; gap: 6px; margin-top: 18px; }
.status-select select { width: 100%; appearance: none; }
.status-select svg { position: absolute; right: 12px; bottom: 13px; pointer-events: none; color: var(--muted); }
.detail-content { padding-block: 30px 120px; }
.player-block { margin: 30px 0 88px; }
.player-toolbar { min-height: 58px; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 10px 14px; background: var(--raised); border: 1px solid var(--line); border-radius: 12px 12px 0 0; font: 500 10px var(--font-mono); text-transform: uppercase; }
.player-toolbar > div:first-child { display: flex; align-items: center; gap: 8px; }
.live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px var(--accent); }
.player-controls { display: flex; align-items: center; gap: 7px; }
.player-controls > button, .server-toggle button { min-height: 34px; display: inline-flex; align-items: center; gap: 6px; padding: 0 10px; background: var(--base); border: 1px solid var(--line); border-radius: 7px; cursor: pointer; }
.server-toggle { display: flex; align-items: center; gap: 4px; padding-left: 8px; }
.server-toggle button { min-width: 32px; justify-content: center; padding: 0; }
.server-toggle button.active { background: var(--accent); color: var(--ink); border-color: var(--accent); }
.auto-toggle { display: flex; align-items: center; gap: 7px; color: var(--muted); cursor: pointer; }
.auto-toggle input { position: absolute; opacity: 0; }
.auto-toggle span { width: 30px; height: 17px; position: relative; border-radius: 99px; background: var(--line); }
.auto-toggle span::after { content: ''; position: absolute; top: 3px; left: 3px; width: 11px; height: 11px; border-radius: 50%; background: var(--muted); transition: transform 180ms var(--ease-out); }
.auto-toggle input:checked + span { background: var(--accent); }
.auto-toggle input:checked + span::after { background: var(--ink); transform: translateX(13px); }
.player-frame { aspect-ratio: 16/9; overflow: hidden; background: oklch(6% .01 285); border: 1px solid var(--line); border-top: 0; border-radius: 0 0 12px 12px; }
.player-frame iframe { width: 100%; height: 100%; border: 0; }
.episodes-section, .chapters-section { margin-top: 88px; }
.section-heading { display: flex; justify-content: space-between; align-items: end; gap: 24px; margin-bottom: 24px; }
.episode-list { border-top: 1px solid var(--line); }
.episode-list > button { width: 100%; display: grid; grid-template-columns: 42px 150px minmax(0, 1fr) 34px; align-items: center; gap: 18px; padding: 14px 0; background: transparent; border: 0; border-bottom: 1px solid var(--line-soft); color: var(--text); text-align: left; cursor: pointer; }
.episode-list > button:hover, .episode-list > button.active { color: var(--accent); }
.episode-number { color: var(--muted); font: 400 11px var(--font-mono); }
.episode-list img, .episode-placeholder { width: 150px; aspect-ratio: 16/9; object-fit: cover; background: var(--raised); border-radius: 7px; }
.episode-list b, .episode-list small { display: block; }
.episode-list b { font-size: 14px; }
.episode-list small { max-width: 70ch; margin-top: 5px; color: var(--muted); font-size: 12px; line-height: 1.45; }
.chapter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 8px; }
.chapter-grid button { min-height: 44px; background: var(--base); border: 1px solid var(--line-soft); border-radius: 7px; color: var(--muted); cursor: pointer; font: 400 10px var(--font-mono); }
.chapter-grid button:hover, .chapter-grid button.active { color: var(--ink); background: var(--accent); border-color: var(--accent); }
.trailer-overlay { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 24px; background: oklch(7% .012 285 / .94); }
.trailer-overlay > div { position: relative; width: min(1100px, 100%); aspect-ratio: 16/9; }
.trailer-overlay iframe { width: 100%; height: 100%; border: 1px solid var(--line); border-radius: 12px; }
.trailer-overlay button { position: absolute; right: 10px; top: 10px; z-index: 2; width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--line); background: var(--base); cursor: pointer; font-size: 22px; }
.detail-missing { min-height: calc(100vh - 72px); }

.loader { min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 17px; color: var(--muted); font: 400 9px var(--font-mono); text-transform: uppercase; letter-spacing: .14em; }
.loader-page { min-height: calc(100vh - 72px); }
.loader-mark { display: flex; align-items: end; gap: 4px; height: 28px; }
.loader-mark i { width: 4px; height: 13px; border-radius: 99px; background: var(--accent); animation: signal 900ms var(--ease-out) infinite alternate; }
.loader-mark i:nth-child(2) { height: 25px; animation-delay: 120ms; }
.loader-mark i:nth-child(3) { height: 18px; animation-delay: 240ms; }
.onboarding { width: min(480px, calc(100% - 32px)); padding: 34px; color: var(--text); background: var(--raised); border: 1px solid var(--line); border-radius: 18px; }
.onboarding::backdrop { background: oklch(7% .012 285 / .88); }
.onboarding-mark { width: 46px; height: 46px; display: grid; place-items: center; margin-bottom: 24px; border-radius: 50%; background: var(--accent); color: var(--ink); }
.onboarding h2 { margin: 8px 0 12px; font-size: 2.2rem; letter-spacing: -.055em; }
.onboarding p { color: var(--muted); }
.onboarding label { display: grid; gap: 7px; margin-top: 28px; }
.onboarding label span { color: var(--muted); font: 400 9px var(--font-mono); text-transform: uppercase; letter-spacing: .1em; }
.onboarding input { height: 48px; padding: 0 14px; background: var(--base); color: var(--text); border: 1px solid var(--line); border-radius: 8px; outline: 0; }
.onboarding input:focus { border-color: var(--accent); }
.onboarding .button { width: 100%; margin-top: 12px; }
.onboarding a { display: inline-flex; align-items: center; gap: 5px; margin-top: 19px; color: var(--accent); font-size: 12px; }
.onboarding small { display: block; margin-top: 8px; color: var(--muted); }
.site-footer { padding: 48px 0; border-top: 1px solid var(--line-soft); }
.footer-grid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 30px; color: var(--muted); font: 400 9px var(--font-mono); text-transform: uppercase; letter-spacing: .08em; }
.footer-grid > div:first-child { display: grid; gap: 5px; }
.footer-grid strong { color: var(--text); }
.service-status { display: flex; align-items: center; gap: 8px; }
.service-status i { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 10px var(--accent); }
.footer-meta { text-align: right; }

@keyframes card-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes signal { from { transform: scaleY(.55); opacity: .55; } to { transform: scaleY(1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }

@media (max-width: 960px) {
  .desktop-links, .saved-link { display: none; }
  .menu-button { display: grid; }
  .nav-search { width: min(48vw, 320px); }
  .mobile-panel { display: grid; position: absolute; top: 72px; left: 0; right: 0; gap: 2px; padding: 16px; background: var(--base); border-bottom: 1px solid var(--line); }
  .mobile-panel form { height: 46px; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; padding: 0 14px; background: var(--ink); border: 1px solid var(--line); border-radius: 10px; }
  .mobile-panel input { width: 100%; color: var(--text); background: transparent; border: 0; outline: 0; }
  .mobile-panel > a { padding: 13px 4px; border-bottom: 1px solid var(--line-soft); font-weight: 700; }
  .hero-layout { grid-template-columns: 1fr; }
  .hero-rail { display: none; }
  .hero-copy h1 { font-size: clamp(3.6rem, 12vw, 7rem); }
  .detail-layout { grid-template-columns: 150px 1fr; }
  .detail-poster { width: 150px; }
  .player-toolbar { align-items: flex-start; flex-direction: column; }
  .footer-grid { grid-template-columns: 1fr 1fr; }
  .footer-meta { display: none; }
}

@media (max-width: 640px) {
  .shell { width: min(100% - 24px, 1440px); }
  .app-shell { padding-top: 64px; }
  .site-nav { height: 64px; }
  .nav-inner { gap: 12px; }
  .brand b, .nav-search { display: none; }
  .mobile-panel { top: 64px; }
  .hero { min-height: calc(88vh - 64px); }
  .hero-layout { min-height: calc(88vh - 64px); padding-block: 110px 64px; }
  .hero-scrim { background: linear-gradient(0deg, var(--ink) 0%, oklch(11% .018 285 / .72) 62%, oklch(11% .018 285 / .2)); }
  .hero-copy h1 { font-size: clamp(3.2rem, 16vw, 5rem); }
  .hero-copy > p { display: -webkit-box; overflow: hidden; -webkit-line-clamp: 3; -webkit-box-orient: vertical; font-size: 14px; }
  .hero-scrollcue { display: none; }
  .media-row { margin-top: 68px; }
  .media-rail, .media-row.featured .media-rail { grid-auto-columns: 152px; gap: 12px; }
  .row-actions button:not(.explore), .row-actions .explore { display: none; }
  .browse-page, .search-page, .list-page { padding-block: 48px 90px; }
  .browse-header { align-items: start; flex-direction: column; }
  .browse-header h1, .search-heading h1 { font-size: clamp(3.2rem, 17vw, 5rem); }
  .archive-count { display: none; }
  .filter-bar, .search-tools { align-items: stretch; flex-wrap: wrap; }
  .search-tools > div { width: 100%; }
  .filter-bar label, .search-tools label { flex: 1; min-width: 130px; }
  .filter-bar input, .filter-bar select, .search-tools input, .search-tools select { width: 100%; }
  .media-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 12px; }
  .detail-hero { min-height: 680px; }
  .detail-shade { background: linear-gradient(0deg, var(--ink) 0%, oklch(11% .018 285 / .82) 64%, oklch(11% .018 285 / .2)); }
  .detail-layout { display: block; padding-block: 180px 48px; }
  .detail-poster { display: none; }
  .detail-copy h1 { font-size: clamp(3rem, 15vw, 5rem); }
  .detail-copy > p { display: -webkit-box; overflow: hidden; -webkit-line-clamp: 4; -webkit-box-orient: vertical; font-size: 14px; }
  .player-block { margin-bottom: 64px; }
  .player-toolbar { border-radius: 9px 9px 0 0; }
  .player-controls { width: 100%; overflow-x: auto; }
  .auto-toggle { display: none; }
  .episode-list > button { grid-template-columns: 32px 96px minmax(0, 1fr); gap: 10px; }
  .episode-list img, .episode-placeholder { width: 96px; }
  .episode-list small, .episode-list > button > svg { display: none; }
  .footer-grid { grid-template-columns: 1fr; }
  .service-status { justify-self: start; }
}
"""
}

for filepath, content in files.items():
    with open(filepath, 'w') as f:
        f.write(content)
print("Updated all files with premium design")
