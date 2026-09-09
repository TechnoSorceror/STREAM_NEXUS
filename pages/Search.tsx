import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCcw, Search as SearchIcon, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { tmdbService } from '../services/tmdb';
import { anilistService } from '../services/anilist';
import { MediaItem } from '../types';
import MediaCard from '../components/MediaCard';
import Advertisement from '../components/Advertisement';
import Loader from '../components/Loader';
import Seo, { SITE_NAME } from '../components/Seo';
import { filterScore, filterYear } from '../lib/useCatalogFilters';

const SearchPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const query = params.get('q')?.trim() || '';
  const type = ['movie', 'tv', 'anime'].includes(params.get('t') || '') ? params.get('t')! : 'media';
  const [draft, setDraft] = useState(query);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(Boolean(query));
  const [warning, setWarning] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const year = filterYear(params.get('y') || '');
  const rating = filterScore(params.get('r'));

  useEffect(() => setDraft(query), [query]);

  useEffect(() => {
    setResults([]);
    setWarning('');
    setLoading(Boolean(query));
    if (!query) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      const requests: Promise<MediaItem[]>[] = [];
      if (type === 'media' || type === 'movie') requests.push(tmdbService.search(query, 'movie'));
      if (type === 'media' || type === 'tv') requests.push(tmdbService.search(query, 'tv'));
      if (type === 'media' || type === 'anime') requests.push(anilistService.search(query, 'anime'));
      const settled = await Promise.allSettled(requests);
      if (!active) return;
      const successful = settled.filter((result): result is PromiseFulfilledResult<MediaItem[]> => result.status === 'fulfilled');
      const nextResults = successful.flatMap(result => result.value);
      if (successful.length) setResults(nextResults);
      const failures = settled.length - successful.length;
      if (failures === settled.length) setWarning('The catalog services could not be reached. Please try again.');
      else if (failures) setWarning('Some catalog sources are temporarily unavailable, so these are partial results.');
      setLoading(false);
    }, 260);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, retryKey, type]);

  const filtered = useMemo(() => results.filter(item => (!rating || item.rating >= rating) && (!year || item.releaseDate?.startsWith(year))), [results, rating, year]);
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next); };
  const setType = (nextType: string) => { const next = new URLSearchParams(params); next.set('t', nextType); setParams(next); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (draft.trim()) next.set('q', draft.trim()); else next.delete('q');
    setParams(next);
  };

  return (
    <div className="search-page shell">
      <Seo title={`${query ? `Search results for “${query}”` : 'Search the catalog'} | ${SITE_NAME}`} description="Search the StreamNexus movie, TV-show, and anime catalog." path="/search" robots="noindex,follow" />
      <header className="search-heading"><div className="eyebrow"><SearchIcon size={13} /> Search archive</div><h1>{query ? <>Results for <span>“{query}”</span></> : 'Find your next obsession'}</h1><p aria-live="polite">{loading ? 'Searching the catalog…' : `${filtered.length} ${filtered.length === 1 ? 'title' : 'titles'} found`}</p></header>
      <form className="search-page-form" role="search" onSubmit={submit}>
        <SearchIcon size={19} />
        <label className="visually-hidden" htmlFor="catalog-query">Search movies, series, and anime</label>
        <input id="catalog-query" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Search another title" autoComplete="off" />
        <button className="button button-primary" type="submit">Search</button>
      </form>
      <div className="search-type-tabs" role="group" aria-label="Result type">
        {[['media', 'All'], ['movie', 'Movies'], ['tv', 'Series'], ['anime', 'Anime']].map(([value, label]) => <button key={value} type="button" aria-pressed={type === value} className={type === value ? 'active' : ''} onClick={() => setType(value)}>{label}</button>)}
      </div>
      <Advertisement />
      <div className="search-tools"><div><SlidersHorizontal size={16} /><strong>Refine results</strong></div><label><span>Release year</span><input value={year} inputMode="numeric" maxLength={4} placeholder="Any" onChange={event => update('y', event.target.value.replace(/\D/g, '').slice(0, 4))} /></label><label><span>Minimum score</span><select value={rating} onChange={event => update('r', event.target.value === '0' ? '' : event.target.value)}><option value="0">Any score</option><option value="6">6.0+</option><option value="7">7.0+</option><option value="8">8.0+</option><option value="9">9.0+</option></select></label></div>
      {warning && <div className="catalog-warning" role="status"><AlertCircle size={17} /><span>{warning}</span><button onClick={() => setRetryKey(key => key + 1)}><RefreshCcw size={14} /> Retry</button></div>}
      {loading && !results.length ? <Loader label="Searching" /> : filtered.length ? <div className={`media-grid ${loading ? 'is-refreshing' : ''}`}>{filtered.map((item, index) => <MediaCard key={`${item.type}-${item.id}`} item={item} index={index} />)}</div> : <div className="empty-state"><SearchIcon size={28} /><h2>{query ? 'No convincing match.' : 'Start with a title.'}</h2><p>{query ? 'Check the spelling or clear a filter.' : 'Use the search field above to scan movies, series, and anime.'}</p></div>}
    </div>
  );
};

export default SearchPage;
