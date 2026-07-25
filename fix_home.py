import re

with open("pages/Home.tsx", "r") as f:
    content = f.read()

target = r"  return \(\n    <div className=\"pb-20 overflow-hidden\">.*"

replacement = r"""  return (
    <div className="pb-20 bg-nexus-ink text-nexus-text font-mono overflow-hidden">
      {/* Hero Billboard */}
      {heroMovie && (
        <section className="min-h-[760px] h-[92vh] relative flex items-end overflow-hidden bg-nexus-base">
          <AnimatePresence mode="wait">
            <motion.div
              key={heroMovie.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <div 
                className="absolute inset-0 transform scale-[1.015] animate-[drift_14s_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{
                  backgroundImage: `linear-gradient(90deg, var(--color-nexus-ink) 0%, color-mix(in oklch, var(--color-nexus-ink) 83%, transparent) 30%, transparent 68%), linear-gradient(0deg, var(--color-nexus-ink) 0%, transparent 48%), url('${heroMovie.banner || heroMovie.poster}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 22%'
                }}
              />
            </motion.div>
          </AnimatePresence>
          <div className="relative z-10 pb-[112px] grid grid-cols-1 xl:grid-cols-[minmax(0,760px)_1fr] gap-12 items-end shell">
            <div>
              <div className="flex items-center gap-2.5 text-nexus-lime uppercase tracking-[0.14em] text-[0.72rem] before:content-[''] before:w-[34px] before:h-[2px] before:bg-nexus-lime">Featured transmission</div>
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="font-sans text-[clamp(4rem,9vw,8.8rem)] leading-[0.82] tracking-[-0.075em] my-6 max-w-[8ch] text-balance"
              >
                {heroMovie.title}
              </motion.h1>
              <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.4, duration: 0.8 }}
                 className="flex flex-wrap gap-4 items-center my-5 text-nexus-muted text-[0.78rem] uppercase"
              >
                <span className="text-nexus-ink bg-nexus-lime px-2 py-1 rounded-[3px] font-black">{heroMovie.rating?.toFixed(1) || 'NR'}</span>
                <span>{heroMovie.releaseDate?.substring(0, 4) || ''}</span>
                <span>{heroMovie.type === 'tv' ? 'Series' : 'Movie'}</span>
                <span>{heroMovie.genres?.slice(0, 2).map(g => g.name).join(' · ')}</span>
              </motion.div>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="max-w-[64ch] text-[oklch(86%_0.015_265)] font-sans text-[1.05rem] line-clamp-3"
              >
                {heroMovie.description}
              </motion.p>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="flex gap-3 mt-8"
              >
                <button 
                  onClick={() => navigate(getHeroPath(heroMovie))}
                  className="h-12 border border-transparent rounded-[7px] px-5 bg-nexus-lime text-nexus-ink font-black cursor-pointer uppercase tracking-[0.06em] text-[0.76rem] transition-transform duration-180 hover:-translate-y-1 hover:bg-nexus-limedeep flex items-center justify-center gap-2"
                >
                  <Play size={16} fill="currentColor" /> Start watching
                </button>
                <button 
                  onClick={() => navigate(getHeroPath(heroMovie))}
                  className="h-12 border border-nexus-line rounded-[7px] px-5 bg-nexus-raised text-nexus-text font-black cursor-pointer uppercase tracking-[0.06em] text-[0.76rem] transition-transform duration-180 hover:-translate-y-1 hover:border-nexus-lime flex items-center justify-center gap-2"
                >
                  <Info size={16} /> Info
                </button>
              </motion.div>
            </div>
            <aside className="justify-self-end w-[min(100%,370px)] bg-nexus-base border border-nexus-line rounded-[9px] overflow-hidden shadow-[12px_12px_0_oklch(8%_0.01_265/0.75)] hidden xl:block">
              <div className="h-[38px] px-3 flex items-center gap-[7px] border-b border-nexus-line text-nexus-muted text-[0.68rem]">
                <i className="w-2 h-2 rounded-full bg-[oklch(65%_0.2_25)]"></i>
                <i className="w-2 h-2 rounded-full bg-[oklch(80%_0.16_85)]"></i>
                <i className="w-2 h-2 rounded-full bg-nexus-lime"></i>
                <span className="ml-auto">stream.config.ts</span>
              </div>
              <div className="p-4 text-nexus-muted text-[0.73rem] leading-[1.9]">
                <div><b className="text-nexus-violet">const</b> session = {"{"}</div>
                <div>&nbsp;&nbsp;quality: <i className="text-nexus-lime not-italic">'4K_HDR'</i>,</div>
                <div>&nbsp;&nbsp;audio: <i className="text-nexus-lime not-italic">'Dolby_Atmos'</i>,</div>
                <div>&nbsp;&nbsp;latency: <i className="text-nexus-lime not-italic">42</i>,</div>
                <div>&nbsp;&nbsp;subtitles: <i className="text-nexus-lime not-italic">true</i></div>
                <div>{"};"}</div>
                <br/>
                <div><b className="text-nexus-violet">await</b> player.mount(session);</div>
                <div><i className="text-nexus-lime not-italic">✓ ready</i> <span className="inline-block w-[7px] h-[14px] bg-nexus-lime align-[-2px] animate-[blink_1s_step-end_infinite]"></span></div>
              </div>
            </aside>
          </div>
          {/* Carousel Indicators */}
          <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-20">
            {heroItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveHeroIndex(idx)}
                className={`h-[3px] transition-all duration-300 ${
                  idx === activeHeroIndex ? 'w-8 bg-nexus-lime' : 'w-4 bg-nexus-line hover:bg-nexus-muted'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Content Rows */}
      <div className="py-7 bg-nexus-ink relative z-10 space-y-16">
        {continueWatching.length > 0 && (
          <Row 
             title="Continue Watching" 
             kicker="Resume session"
             items={continueWatching} 
             isLarge 
             onRemoveItem={(item, e) => handleRemoveContinueWatching(e, item.id, item.type)}
          />
        )}
        {data.latestMovies.length > 0 && <Row title="Most watched this week" kicker="Trending index" items={data.latestMovies} isLarge />}
        {data.latestTv.length > 0 && <Row title="Top Series" kicker="Signal matched" items={data.latestTv} />}
        <Row title="Trending Movies" kicker="Global charts" items={data.trendingMovies} isLarge={data.latestMovies.length === 0} />
        <Row title="Trending TV Shows" kicker="Binge material" items={data.trendingTv} />
        <Row title="Top Rated Movies" kicker="Hall of fame" items={data.topRatedMovies} />
        <Row title="Popular TV Series" kicker="Crowd favorites" items={data.popularTv} />
        <Row title="Action Movies" kicker="High voltage" items={data.actionMovies} />
        <Row title="Sci-Fi & Fantasy" kicker="Beyond reality" items={data.scifiMovies} />
        <Row title="Dramatic Hits" kicker="Deep feelings" items={data.dramaMovies} />
      </div>
    </div>
  );
};
export default Home;"""

content = re.sub(r"  return \(\n    <div className=\"pb-20 overflow-hidden\">.*", replacement, content, flags=re.DOTALL)

# Let's fix tailwind drift animation globally
with open("index.css", "a") as f:
    f.write("""
@keyframes drift {
  from { transform: scale(1.07); }
  to { transform: scale(1.015); }
}
@keyframes blink {
  50% { opacity: 0; }
}
""")

with open("pages/Home.tsx", "w") as f:
    f.write(content)
print("Home.tsx updated")
