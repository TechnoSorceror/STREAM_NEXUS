import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import Navbar from './components/Navbar';
import Loader from './components/Loader';
import SponsorBreak from './components/SponsorBreak';
import Advertisement, { NativeAdvertisement } from './components/Advertisement';

const Home = lazy(() => import('./pages/Home'));
const Movies = lazy(() => import('./pages/Movies'));
const TVShows = lazy(() => import('./pages/TVShows'));
const Anime = lazy(() => import('./pages/Anime'));
const Details = lazy(() => import('./pages/Details'));
const SearchPage = lazy(() => import('./pages/Search'));
const MyList = lazy(() => import('./pages/MyList'));
const GenreLanding = lazy(() => import('./pages/GenreLanding'));
const PersonPage = lazy(() => import('./pages/Person'));
const InformationPage = lazy(() => import('./pages/Information'));
const NotFound = lazy(() => import('./pages/NotFound'));

const AppContent: React.FC = () => {
  const location = useLocation();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 150, damping: 28, restDelta: .001 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <motion.div className="scroll-progress" style={{ scaleX }} />
      <Navbar />
      <SponsorBreak />
      <main id="main-content" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="route-stage"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: reduceMotion ? 0 : .32, ease: [0.16, 1, 0.3, 1] }}
          >
            <Suspense fallback={<Loader page label="Loading page" />}>
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/movies/genre/:slug" element={<GenreLanding type="movie" />} />
                <Route path="/tv-shows" element={<TVShows />} />
                <Route path="/tv-shows/genre/:slug" element={<GenreLanding type="tv" />} />
                <Route path="/anime" element={<Anime />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/my-list" element={<MyList />} />
                <Route path="/movie/:id" element={<Details />} />
                <Route path="/tv/:id" element={<Details />} />
                <Route path="/anime/:id" element={<Details />} />
                <Route path="/manga/:id" element={<Details />} />
                <Route path="/person/:identifier" element={<PersonPage />} />
                <Route path="/about" element={<InformationPage page="about" />} />
                <Route path="/contact" element={<InformationPage page="contact" />} />
                <Route path="/privacy" element={<InformationPage page="privacy" />} />
                <Route path="/terms" element={<InformationPage page="terms" />} />
                <Route path="/copyright" element={<InformationPage page="copyright" />} />
                <Route path="/editorial-policy" element={<InformationPage page="editorial-policy" />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <div className="shell page-ad-host">
        <Advertisement key={location.pathname} />
        <NativeAdvertisement />
      </div>
      <footer className="site-footer">
        <div className="shell footer-grid">
          <div className="footer-brand">
            <span className="brand-mark"><i /><i /><i /></span>
            <div><strong>StreamNexus</strong><small>Your universe of stories.</small></div>
          </div>
          <p>Explore films and series, build your watchlist, and pick up exactly where you left off.</p>
          <button type="button" className="footer-top" onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? 'instant' : 'smooth' })}>
            Back to top <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="shell footer-bottom">
          <nav aria-label="Site information"><Link to="/about">About</Link><Link to="/editorial-policy">Editorial policy</Link><Link to="/contact">Contact</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/copyright">Copyright</Link></nav>
          <span>Designed for every screen · 2026</span>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <MotionConfig reducedMotion="user">
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </MotionConfig>
);

export default App;
