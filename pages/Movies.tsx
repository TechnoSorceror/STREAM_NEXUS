import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Film } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';
import Row from '../components/Row';
import Loader from '../components/Loader';
import GenreFilter from '../components/GenreFilter';
import MediaCard from '../components/MediaCard';

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
      ) : (
        <div className="browse-rows">
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
