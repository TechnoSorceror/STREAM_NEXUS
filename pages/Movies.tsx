import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Film, RefreshCcw } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';
import Row from '../components/Row';
import Loader from '../components/Loader';
import GenreFilter from '../components/GenreFilter';
import MediaCard from '../components/MediaCard';
import Seo, { SITE_NAME, toAbsoluteSiteUrl } from '../components/Seo';
import { mediaPath } from '../lib/routes';

const Movies: React.FC = () => {
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
      { '@type': 'CollectionPage', name: 'Movies', url: toAbsoluteSiteUrl('/movies'), description: 'Browse current, popular, highly rated, Hindi-language, and genre-based movies.' },
      ...(data.trending?.length ? [{ '@type': 'ItemList', itemListElement: data.trending.slice(0, 20).map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.title, url: toAbsoluteSiteUrl(mediaPath(item)) })) }] : [])
    ]
  }), [data.trending]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setWarning('');
      const keys = ['trending', 'newMovies', 'bollywood', 'popular', 'topRated', 'action', 'comedy', 'horror', 'romance', 'scifi'];
      const settled = await Promise.allSettled([
        tmdbService.getTrending('movie'), tmdbService.getByYear('movie', new Date().getFullYear()),
        tmdbService.getByLanguage('movie', 'hi'), tmdbService.getPopular('movie'),
        tmdbService.getTopRated('movie'), tmdbService.getByGenre('movie', 28),
        tmdbService.getByGenre('movie', 35), tmdbService.getByGenre('movie', 27),
        tmdbService.getByGenre('movie', 10749), tmdbService.getByGenre('movie', 878)
      ]);
      if (!active) return;
      const next: Record<string, MediaItem[]> = {};
      settled.forEach((result, index) => { if (result.status === 'fulfilled') next[keys[index]] = result.value; });
      setData(previous => ({ ...previous, ...next }));
      const failures = settled.filter(result => result.status === 'rejected').length;
      if (failures === settled.length) setWarning('The movie catalog could not be refreshed.');
      else if (failures) setWarning('Some movie rows are temporarily unavailable.');
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
      try {
        const items = await tmdbService.getByGenre('movie', genre, year, rating);
        if (active) setFiltered(items);
      } catch { if (active) setWarning('The selected movie filters could not be loaded.'); }
      finally { if (active) setLoading(false); }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [genre, year, rating]);

  return (
    <div className="browse-page shell">
      <Seo title={`Movies: Cast, Trailers & Release Details | ${SITE_NAME}`} description="Browse current, popular, highly rated, Hindi-language, and genre-based movies with story, cast, trailer, and release information." path="/movies" robots={isFiltered ? 'noindex,follow' : undefined} jsonLd={isFiltered ? undefined : schema} />
      <header className="browse-header">
        <div><div className="eyebrow"><Film size={13} /> Film archive</div><h1>Movies</h1><p>Big releases, quiet masterpieces, and everything between.</p></div>
        <div className="archive-count">CURATED DAILY</div>
      </header>
      <GenreFilter type="movie" selectedGenreId={genre} onSelectGenre={setGenre} />
      {warning && <div className="catalog-warning" role="status"><AlertCircle size={17} /><span>{warning}</span><button onClick={() => setRetryKey(key => key + 1)}><RefreshCcw size={14} /> Retry</button></div>}
      {genre !== null ? (
        <section className="filtered-section">
          <div className="filter-bar">
            <label><span>Release year</span><input inputMode="numeric" placeholder="2026" value={year} onChange={e => setYear(e.target.value)} /></label>
            <label><span>Minimum score</span><select value={rating} onChange={e => setRating(Number(e.target.value))}><option value={0}>Any score</option><option value={6}>6.0+</option><option value={7}>7.0+</option><option value={8}>8.0+</option><option value={9}>9.0+</option></select></label>
          </div>
          {loading ? <Loader label="Refining selection" /> : filtered.length ? <div className="media-grid">{filtered.map((item, i) => <MediaCard key={`${item.type}-${item.id}`} item={item} index={i} />)}</div> : <div className="empty-state"><h2>No clean match.</h2><p>Loosen the year or score and try again.</p></div>}
        </section>
      ) : (
        <div className="browse-rows">
          {loading && <Loader label="Opening the film archive" />}
          <Row title="Trending now" kicker="The films moving culture" items={data.trending} featured />
          <Row title="Fresh arrivals" kicker="New this year" items={data.newMovies} />
          <Row title="Hindi cinema" kicker="Bollywood and beyond" items={data.bollywood} />
          <Row title="Popular" kicker="Crowd magnets" items={data.popular} />
          <Row title="Top rated" kicker="Consensus classics" items={data.topRated} />
          <Row title="Action" items={data.action} onExplore={() => setGenre(28)} />
          <Row title="Comedy" items={data.comedy} onExplore={() => setGenre(35)} />
          <Row title="Horror" items={data.horror} onExplore={() => setGenre(27)} />
          <Row title="Romance" items={data.romance} onExplore={() => setGenre(10749)} />
          <Row title="Science fiction" items={data.scifi} onExplore={() => setGenre(878)} />
        </div>
      )}
    </div>
  );
};

export default Movies;
