import React, { useEffect, useRef, useState } from 'react';
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
import { MediaItem } from '../types';

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

  const searchType = () =>
    location.pathname.startsWith('/movies') || searchParams.get('t') === 'movie'
      ? 'movie'
      : location.pathname.startsWith('/tv-shows') || searchParams.get('t') === 'tv'
        ? 'tv'
        : 'media';

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
    if (searchOpen) window.setTimeout(() => searchInput.current?.focus(), 80);
    else setQuery('');
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
      const type = searchType();
      const result =
        type === 'media'
          ? await tmdbService.searchMulti(query)
          : await tmdbService.search(query, type);
      if (live) {
        setSuggestions(result.slice(0, 7));
        setSearching(false);
      }
    }, 240);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [query, location.pathname]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}&t=${searchType()}`);
    setSearchOpen(false);
  };

  const pick = () => setSearchOpen(false);

  const mobileItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/movies', label: 'Movies', icon: Clapperboard },
    { path: '/search', label: 'Search', icon: Search, action: true },
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
            <Link className={active('/') ? 'active' : ''} to="/">Discover</Link>
            <Link className={active('/movies') ? 'active' : ''} to="/movies">Movies</Link>
            <Link className={active('/tv-shows') ? 'active' : ''} to="/tv-shows">Series</Link>
          </div>

          <div className="nav-actions">
            <button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search the catalog">
              <Search size={17} />
              <span>Search movies &amp; series</span>
              <kbd>⌘ K</kbd>
            </button>
            <Link to="/my-list" className={`saved-link ${active('/my-list') ? 'active' : ''}`}>
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
          if (item.action) {
            return (
              <button key={item.label} onClick={() => setSearchOpen(true)} aria-label="Open search">
                <span><Icon size={20} /></span>
                <small>{item.label}</small>
              </button>
            );
          }
          return (
            <Link key={item.path} to={item.path} className={active(item.path) ? 'active' : ''}>
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
            onMouseDown={() => setSearchOpen(false)}
          >
            <motion.div
              className="command-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Search StreamNexus"
              initial={{ opacity: 0, y: -18, scale: .98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: .985 }}
              transition={{ duration: .24, ease: [0.16, 1, 0.3, 1] }}
              onMouseDown={event => event.stopPropagation()}
            >
              <form className="command-input" onSubmit={submit}>
                <Search size={22} />
                <input
                  ref={searchInput}
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search for a movie or series…"
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
                      <Link key={`${item.type}-${item.id}`} to={`/${item.type}/${item.id}`} onClick={pick}>
                        <img src={item.poster} alt="" />
                        <span>
                          <b>{item.title}</b>
                          <small>{item.type === 'tv' ? 'Series' : 'Movie'} · {item.releaseDate?.slice(0, 4) || 'TBA'}</small>
                        </span>
                        <em><Star size={12} fill="currentColor" /> {item.rating?.toFixed(1) || 'NR'}</em>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="search-empty"><div><b>{searching ? 'Searching the archive…' : 'No title found'}</b><small>{searching ? 'Matching titles across movies and series.' : 'Try another title or check the spelling.'}</small></div></div>
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
