import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Movies from './pages/Movies';
import TVShows from './pages/TVShows';
import Details from './pages/Details';
import SearchPage from './pages/Search';
import MyList from './pages/MyList';
import OnboardingModal from './components/OnboardingModal';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 150, damping: 28, restDelta: .001 });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <motion.div className="scroll-progress" style={{ scaleX }} />
      <Navbar />
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${location.pathname}${location.search}`}
            className="route-stage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: .32, ease: [0.16, 1, 0.3, 1] }}
          >
            <Routes location={location}>
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
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="site-footer">
        <div className="shell footer-grid">
          <div className="footer-brand">
            <span className="brand-mark"><i /><i /><i /></span>
            <div><strong>StreamNexus</strong><small>Your universe of stories.</small></div>
          </div>
          <p>Explore films and series, build your watchlist, and pick up exactly where you left off.</p>
          <a href="#top" onClick={event => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            Back to top <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="shell footer-bottom">
          <span>Powered by TMDB metadata</span>
          <span>Designed for every screen · 2026</span>
        </div>
      </footer>
      <OnboardingModal />
    </div>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
