import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Radio, RefreshCcw } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';
import Row from '../components/Row';
import Loader from '../components/Loader';
import GenreFilter from '../components/GenreFilter';
import MediaCard from '../components/MediaCard';
import Seo, { SITE_NAME, toAbsoluteSiteUrl } from '../components/Seo';
import { mediaPath } from '../lib/routes';

const TVShows: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGenre = searchParams.get('genre') ? Number(searchParams.get('genre')) : null;
  const initialYear = searchParams.get('year') || '';
  const initialRating = searchParams.get('rating') ? Number(searchParams.get('rating')) : 0;

  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState<number | null>(initialGenre);
  const [year, setYear] = useState(initialYear);
  const [rating, setRating] = useState(initialRating);
  const [filtered, setFiltered] = useState<MediaItem[]>([]);
  const [data, setData] = useState<Record<string, MediaItem[]>>({});
  const [warning, setWarning] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const isFiltered = genre !== null || Boolean(year) || rating > 0;
  const schema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: 'TV shows', url: toAbsoluteSiteUrl('/tv-shows'), description: 'Browse current, popular, highly rated, Hindi-language, and genre-based television series.' },
      ...(data.trending?.length ? [{ '@type': 'ItemList', itemListElement: data.trending.slice(0, 20).map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.title, url: toAbsoluteSiteUrl(mediaPath(item)) })) }] : [])
    ]
  }), [data.trending]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setWarning('');
      const keys = ['trending', 'newShows', 'hindi', 'popular', 'topRated', 'action', 'comedy', 'crime', 'drama', 'scifi'];
      const settled = await Promise.allSettled([
        tmdbService.getTrending('tv'), tmdbService.getByYear('tv', new Date().getFullYear()),
        tmdbService.getByLanguage('tv', 'hi'), tmdbService.getPopular('tv'),
        tmdbService.getTopRated('tv'), tmdbService.getByGenre('tv', 10759),
        tmdbService.getByGenre('tv', 35), tmdbService.getByGenre('tv', 80),
        tmdbService.getByGenre('tv', 18), tmdbService.getByGenre('tv', 10765)
      ]);
      if (!active) return;
      const next: Record<string, MediaItem[]> = {};
      settled.forEach((result, index) => { if (result.status === 'fulfilled') next[keys[index]] = result.value; });
      setData(previous => ({ ...previous, ...next }));
      const failures = settled.filter(result => result.status === 'rejected').length;
      if (failures === settled.length) setWarning('The TV catalog could not be refreshed.');
      else if (failures) setWarning('Some TV rows are temporarily unavailable.');
      setLoading(false);
    })();
    return () => { active = false; };
  }, [retryKey]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (genre !== null) params.genre = String(genre);
    if (year) params.year = year;
    if (rating > 0) params.rating = String(rating);
    setSearchParams(params, { replace: true });
  }, [genre, year, rating, setSearchParams]);

  useEffect(() => {
    setGenre(searchParams.get('genre') ? Number(searchParams.get('genre')) : null);
    setYear(searchParams.get('year') || '');
    setRating(searchParams.get('rating') ? Number(searchParams.get('rating')) : 0);
  }, [searchParams]);

  useEffect(() => {
    if (genre === null) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try { const items = await tmdbService.getByGenre('tv', genre, year, rating); if (active) setFiltered(items); }
      catch { if (active) setWarning('The selected TV filters could not be loaded.'); }
      finally { if (active) setLoading(false); }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [genre, year, rating]);

  return (
    <div className="browse-page shell">
      <Seo title={`TV Shows: Seasons, Episodes & Cast | ${SITE_NAME}`} description="Browse TV shows with series summaries, cast, seasons, episode navigation, trailers, genres, and related recommendations." path="/tv-shows" robots={isFiltered ? 'noindex,follow' : undefined} jsonLd={isFiltered ? undefined : schema} />
      <header className="browse-header"><div><div className="eyebrow"><Radio size={13} /> Series index</div><h1>TV shows</h1><p>Stories that earn the next episode.</p></div><div className="archive-count">SEASON READY</div></header>
      <GenreFilter type="tv" selectedGenreId={genre} onSelectGenre={setGenre} />
      {warning && <div className="catalog-warning" role="status"><AlertCircle size={17} /><span>{warning}</span><button onClick={() => setRetryKey(key => key + 1)}><RefreshCcw size={14} /> Retry</button></div>}
      {genre !== null ? (
        <section className="filtered-section">
          <div className="filter-bar"><label><span>First air year</span><input inputMode="numeric" placeholder="2026" value={year} onChange={e => setYear(e.target.value)} /></label><label><span>Minimum score</span><select value={rating} onChange={e => setRating(Number(e.target.value))}><option value={0}>Any score</option><option value={6}>6.0+</option><option value={7}>7.0+</option><option value={8}>8.0+</option><option value={9}>9.0+</option></select></label></div>
          {loading ? <Loader label="Refining selection" /> : filtered.length ? <div className="media-grid">{filtered.map((item, i) => <MediaCard key={`${item.type}-${item.id}`} item={item} index={i} />)}</div> : <div className="empty-state"><h2>Nothing survives those filters.</h2><p>Try a broader year or score.</p></div>}
        </section>
      ) : (
        <div className="browse-rows">
          {loading && <Loader label="Tuning the series signal" />}
          <Row title="Trending series" kicker="What everyone is binging" items={data.trending} featured />
          <Row title="New seasons" kicker="Freshly transmitted" items={data.newShows} />
          <Row title="Hindi series" kicker="Local stories, global scale" items={data.hindi} />
          <Row title="Popular" items={data.popular} />
          <Row title="Top rated" items={data.topRated} />
          <Row title="Action and adventure" items={data.action} onExplore={() => setGenre(10759)} />
          <Row title="Comedy" items={data.comedy} onExplore={() => setGenre(35)} />
          <Row title="Crime" items={data.crime} onExplore={() => setGenre(80)} />
          <Row title="Drama" items={data.drama} onExplore={() => setGenre(18)} />
          <Row title="Science fiction and fantasy" items={data.scifi} onExplore={() => setGenre(10765)} />
        </div>
      )}
    </div>
  );
};

export default TVShows;
