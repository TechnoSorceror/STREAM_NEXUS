import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bookmark,
  Clapperboard,
  Home,
  Search,
  Sparkles,
  Star,
  Tv,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { tmdbService } from '../services/tmdb';
import { anilistService } from '../services/anilist';
import { MediaItem } from '../types';
import { mediaPath } from '../lib/routes';
import { posterSrc, posterSrcSet } from '../lib/images';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MediaItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchPanel = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const searchType = useCallback(() =>
    location.pathname.startsWith('/movies') || searchParams.get('t') === 'movie'
      ? 'movie'
      : location.pathname.startsWith('/tv-shows') || searchParams.get('t') === 'tv'
        ? 'tv'
        : location.pathname.startsWith('/anime') || searchParams.get('t') === 'anime'
          ? 'anime'
        : 'media', [location.pathname, searchParams]);

  const active = (path: string) =>
    path === '/' ? location.pathname === path : location.pathname.startsWith(path);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!searchOpen) { setQuery(''); return; }
    previousFocus.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const background = [document.querySelector('main'), document.querySelector('.site-footer')].filter(Boolean) as HTMLElement[];
    document.body.style.overflow = 'hidden';
    background.forEach(element => element.setAttribute('inert', ''));
    const timer = window.setTimeout(() => searchInput.current?.focus(), 50);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      background.forEach(element => element.removeAttribute('inert'));
      previousFocus.current?.focus();
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    let live = true;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const type = searchType();
        const result = type === 'media'
          ? (await Promise.allSettled([tmdbService.searchMulti(query), anilistService.search(query, 'anime')])).flatMap(item => item.status === 'fulfilled' ? item.value : [])
          : type === 'anime'
            ? await anilistService.search(query, 'anime')
            : await tmdbService.search(query, type);
        if (live) setSuggestions(result.slice(0, 7));
      } catch {
        if (live) setSuggestions([]);
      } finally {
        if (live) setSearching(false);
      }
    }, 240);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [query, searchType]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}&t=${searchType()}`);
    setSearchOpen(false);
  };

  const pick = () => setSearchOpen(false);

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = [...(searchPanel.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])') || [])];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const mobileItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/movies', label: 'Movies', icon: Clapperboard },
    { path: '/anime', label: 'Anime', icon: Sparkles },
    { path: '/tv-shows', label: 'Series', icon: Tv },
    { path: '/my-list', label: 'My list', icon: Bookmark }
  ];

  return (
    <>
      <header className={`site-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <nav className="shell nav-inner" aria-label="Primary navigation">
          <Link className="brand" to="/" aria-label="StreamNexus home">
            <span className="brand-mark"><i /><i /><i /></span>
            <b>Stream<span>Nexus</span></b>
          </Link>

          <div className="desktop-links">
            <Link className={active('/') ? 'active' : ''} aria-current={active('/') ? 'page' : undefined} to="/">Discover</Link>
            <Link className={active('/movies') ? 'active' : ''} aria-current={active('/movies') ? 'page' : undefined} to="/movies">Movies</Link>
            <Link className={active('/tv-shows') ? 'active' : ''} aria-current={active('/tv-shows') ? 'page' : undefined} to="/tv-shows">Series</Link>
            <Link className={active('/anime') ? 'active' : ''} aria-current={active('/anime') ? 'page' : undefined} to="/anime">Anime</Link>
          </div>

          <div className="nav-actions">
            <button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search the catalog">
              <Search size={17} />
              <span>Search movies, series &amp; anime</span>
              <kbd>⌘ K</kbd>
            </button>
            <Link to="/my-list" aria-current={active('/my-list') ? 'page' : undefined} className={`saved-link ${active('/my-list') ? 'active' : ''}`}>
              <Bookmark size={17} />
              <span>My list</span>
            </Link>
            <button className="mobile-search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search size={20} />
            </button>
          </div>
        </nav>
      </header>

      <nav className="mobile-dock" aria-label="Mobile navigation">
        {mobileItems.map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} aria-current={active(item.path) ? 'page' : undefined} className={active(item.path) ? 'active' : ''}>
              <span><Icon size={19} /></span>
              <small>{item.label}</small>
            </Link>
          );
        })}
      </nav>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="command-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={event => { if (event.target === event.currentTarget) setSearchOpen(false); }}
          >
            <motion.div
              ref={searchPanel}
              className="command-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Search StreamNexus"
              initial={{ opacity: 0, y: -18, scale: .98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: .985 }}
              transition={{ duration: .24, ease: [0.16, 1, 0.3, 1] }}
              onMouseDown={event => event.stopPropagation()}
              onKeyDown={trapFocus}
            >
              <form className="command-input" onSubmit={submit}>
                <Search size={22} />
                <input
                  ref={searchInput}
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search movies, series, or anime…"
                  aria-label="Search catalog"
                />
                <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={18} /></button>
              </form>

              <div className="command-body">
                {!query.trim() ? (
                  <div className="search-empty">
                    <span><Sparkles size={18} /></span>
                    <div><b>Find your next story</b><small>Search by title. Results appear as you type.</small></div>
                  </div>
                ) : suggestions.length ? (
                  <div className="command-results">
                    <div className="command-label">Top matches</div>
                    {suggestions.map(item => (
                      <Link key={`${item.type}-${item.id}`} to={mediaPath(item)} onClick={pick}>
                        <img src={posterSrc(item.poster)} srcSet={posterSrcSet(item.poster)} sizes="42px" width="42" height="63" alt="" loading="lazy" decoding="async" />
                        <span>
                          <b>{item.title}</b>
                          <small>{item.type === 'tv' ? 'Series' : item.type === 'anime' ? 'Anime' : 'Movie'} · {item.releaseDate?.slice(0, 4) || 'TBA'}</small>
                        </span>
                        <em><Star size={12} fill="currentColor" /> {item.rating?.toFixed(1) || 'NR'}</em>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="search-empty"><div><b>{searching ? 'Searching the archive…' : 'No title found'}</b><small>{searching ? 'Matching titles across the catalog.' : 'Try another title or check the spelling.'}</small></div></div>
                )}
              </div>

              <div className="command-footer">
                <span><kbd>↵</kbd> search all</span>
                <span><kbd>esc</kbd> close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
