import React, { useEffect, useMemo, useState } from 'react';
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
  const setType = (nextType: string) => {
    const next = new URLSearchParams(params);
    next.set('t', nextType);
    setParams(next);
  };

  return (
    <div className="search-page shell">
      <header className="search-heading"><div className="eyebrow"><SearchIcon size={13} /> Search archive</div><h1>{query ? <>Results for <span>“{query}”</span></> : 'Find your next obsession'}</h1><p>{loading ? 'Searching the catalog…' : `${filtered.length} ${filtered.length === 1 ? 'title' : 'titles'} found`}</p></header>
      <div className="search-type-tabs" role="tablist" aria-label="Result type">
        {[['media', 'All'], ['movie', 'Movies'], ['tv', 'Series']].map(([value, label]) => <button key={value} role="tab" aria-selected={type === value || (value === 'media' && type === 'all')} className={type === value || (value === 'media' && type === 'all') ? 'active' : ''} onClick={() => setType(value)}>{label}</button>)}
      </div>
      <div className="search-tools"><div><SlidersHorizontal size={16} /><strong>Refine results</strong></div><label><span>Release year</span><input value={year} inputMode="numeric" placeholder="Any" onChange={e => update('y', e.target.value)} /></label><label><span>Minimum score</span><select value={rating} onChange={e => update('r', e.target.value === '0' ? '' : e.target.value)}><option value="0">Any score</option><option value="6">6.0+</option><option value="7">7.0+</option><option value="8">8.0+</option><option value="9">9.0+</option></select></label></div>
      {loading ? <Loader label="Searching" /> : filtered.length ? <div className="media-grid">{filtered.map((item, i) => <MediaCard key={`${item.type}-${item.id}-${i}`} item={item} index={i} />)}</div> : <div className="empty-state"><SearchIcon size={28} /><h2>{query ? 'No convincing match.' : 'Start with a title.'}</h2><p>{query ? 'Check the spelling or clear a filter.' : 'Use the search field above to scan movies and series.'}</p></div>}
    </div>
  );
};
export default SearchPage;
