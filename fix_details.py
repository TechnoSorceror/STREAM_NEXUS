import re
with open("pages/Details.tsx", "r") as f:
    content = f.read()

target = r"  if \(loading\) return \(.*?  \);\n\n  return \(\n    <div className=\"min-h-screen bg-nexus-ink pb-20\">.*?    </div>\n  \);\n\};"

replacement = r"""  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-nexus-ink text-nexus-lime font-mono">
      Initializing system protocols...
    </div>
  );

  if (!media) return (
    <div className="h-screen flex items-center justify-center bg-nexus-ink text-nexus-lime font-mono">
      Entity not found.
    </div>
  );

  const heroImage = media.banner || media.poster;

  return (
    <div className="min-h-screen bg-nexus-ink font-mono pb-20">
      {/* Hero Section */}
      <section className="min-h-[600px] h-[80vh] relative flex items-end overflow-hidden bg-nexus-base">
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 transform scale-[1.015] animate-[drift_14s_cubic-bezier(0.16,1,0.3,1)_both]"
            style={{
              backgroundImage: `linear-gradient(90deg, var(--color-nexus-ink) 0%, color-mix(in oklch, var(--color-nexus-ink) 83%, transparent) 30%, transparent 68%), linear-gradient(0deg, var(--color-nexus-ink) 0%, transparent 48%), url('${heroImage}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 22%'
            }}
          />
        </div>
        
        <div className="relative z-10 pb-16 grid grid-cols-1 xl:grid-cols-[minmax(0,760px)_1fr] gap-12 items-end shell w-full">
          <div>
            <div className="flex items-center gap-2.5 text-nexus-lime uppercase tracking-[0.14em] text-[0.72rem] before:content-[''] before:w-[34px] before:h-[2px] before:bg-nexus-lime">
              {type === 'movie' ? 'Cinematic Archive' : type === 'tv' ? 'Serial Transmission' : type === 'anime' ? 'Anime Database' : 'Manga Archive'}
            </div>
            
            <h1 className="font-sans text-[clamp(3.5rem,7vw,7rem)] leading-[0.82] tracking-[-0.075em] my-6 max-w-[10ch] text-balance text-nexus-text">
              {media.title}
            </h1>
            
            <div className="flex flex-wrap gap-4 items-center my-5 text-nexus-muted text-[0.78rem] uppercase">
              <span className="text-nexus-ink bg-nexus-lime px-2 py-1 rounded-[3px] font-black">{media.rating?.toFixed(1) || 'NR'}</span>
              <span>{media.releaseDate?.substring(0, 4) || 'TBA'}</span>
              <span>{media.status || 'Released'}</span>
              {media.type === 'tv' || media.type === 'anime' ? <span>{media.seasons} Seasons</span> : null}
              {media.genres && <span>{media.genres.slice(0, 3).map(g => g.name).join(' · ')}</span>}
            </div>
            
            <p className="max-w-[64ch] text-[oklch(86%_0.015_265)] font-sans text-[1.05rem] line-clamp-4">
              {media.description || 'No description available in the archive.'}
            </p>
            
            <div className="flex gap-3 mt-8">
              <button 
                onClick={handleWatch}
                className="h-12 border border-transparent rounded-[7px] px-5 bg-nexus-lime text-nexus-ink font-black cursor-pointer uppercase tracking-[0.06em] text-[0.76rem] transition-transform duration-180 hover:-translate-y-1 hover:bg-nexus-limedeep flex items-center justify-center gap-2"
              >
                <Play size={16} fill="currentColor" /> {playState.isPlaying ? 'Resume feed' : 'Initialize feed'}
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className={`h-12 border rounded-[7px] px-5 font-black cursor-pointer uppercase tracking-[0.06em] text-[0.76rem] transition-transform duration-180 hover:-translate-y-1 flex items-center justify-center gap-2 ${isInList ? 'bg-nexus-raised border-nexus-lime text-nexus-lime' : 'bg-nexus-raised border-nexus-line text-nexus-text hover:border-nexus-lime'}`}
                >
                  {isInList ? (
                     <>
                        <BookOpen size={16} /> {watchStatus.replace(/_/g, ' ')}
                     </>
                  ) : (
                     <>+ Add to list</>
                  )}
                </button>
                
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-nexus-base border border-nexus-line rounded-lg shadow-xl overflow-hidden z-20">
                    <select
                      value={watchStatus}
                      onChange={(e) => handleStatusChange(e.target.value as WatchStatus)}
                      className="w-full bg-transparent text-nexus-text px-4 py-3 outline-none appearance-none cursor-pointer hover:bg-nexus-raised transition font-mono uppercase text-sm"
                      size={5}
                    >
                      <option value="watching">Watching</option>
                      <option value="plan_to_watch">Plan to Watch</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                      <option value="dropped">Dropped</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="shell mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column - Player & Episodes */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Player Container */}
          <div ref={playerRef} className="scroll-mt-24">
             {playState.isPlaying ? (
                <div className="border border-nexus-line rounded-[10px] bg-nexus-base overflow-hidden shadow-lg">
                    {/* Player Header/Toolbar */}
                    <div className="bg-nexus-base p-4 flex flex-wrap gap-4 items-center justify-between border-b border-nexus-line">
                        <div className="flex items-center gap-4 text-sm uppercase tracking-wider text-nexus-muted">
                            <span className="text-nexus-lime font-bold">Signal Active</span>
                            {media.type !== 'movie' && (
                                <span>S{playState.season} E{playState.episode}</span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* Server Selector */}
                            <div className="flex items-center gap-2 bg-nexus-ink rounded p-1 border border-nexus-line">
                                <button
                                    onClick={() => setPlayState(p => ({ ...p, server: 1 }))}
                                    className={`px-3 py-1 text-[0.65rem] font-bold rounded uppercase transition-colors ${playState.server === 1 ? 'bg-nexus-lime text-nexus-ink' : 'text-nexus-muted hover:text-nexus-text'}`}
                                >
                                    Alpha
                                </button>
                                <button
                                    onClick={() => setPlayState(p => ({ ...p, server: 2 }))}
                                    className={`px-3 py-1 text-[0.65rem] font-bold rounded uppercase transition-colors ${playState.server === 2 ? 'bg-nexus-lime text-nexus-ink' : 'text-nexus-muted hover:text-nexus-text'}`}
                                >
                                    Beta
                                </button>
                            </div>
                            
                            {/* Auto Next */}
                            {(media.type === 'tv' || media.type === 'anime') && (
                                <button
                                    onClick={() => setAutoPlayNext(!autoPlayNext)}
                                    className="flex items-center gap-2 text-nexus-muted hover:text-nexus-text transition text-xs uppercase"
                                >
                                    <span className="font-bold">Auto-Next</span>
                                    <div className="relative w-8 h-4 bg-nexus-ink rounded-full border border-nexus-line transition-colors">
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${autoPlayNext ? 'bg-nexus-lime translate-x-4' : 'bg-[oklch(50%_0.02_265)]'}`}></div>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* The Player */}
                    <div className="aspect-video w-full bg-black relative">
                        {renderEmbed()}
                    </div>
                    
                    {/* Player Footer Controls */}
                    {(media.type === 'tv' || media.type === 'anime') && (
                        <div className="bg-nexus-base p-4 flex justify-between items-center border-t border-nexus-line">
                            <button
                                onClick={handlePrevEpisode}
                                disabled={playState.episode <= 1}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-nexus-ink text-nexus-muted hover:text-nexus-text hover:border-nexus-lime disabled:opacity-50 text-xs font-bold rounded border border-nexus-line transition-all uppercase"
                            >
                                <SkipBack size={14} /> Prev
                            </button>
                            
                            <button
                                onClick={handleNextEpisode}
                                disabled={playState.episode >= episodes.length}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-nexus-ink text-nexus-lime hover:bg-nexus-lime hover:text-nexus-ink disabled:opacity-50 text-xs font-bold rounded border border-nexus-lime transition-all uppercase"
                            >
                                Next <SkipForward size={14} />
                            </button>
                        </div>
                    )}
                </div>
             ) : (
                <div className="border border-nexus-line rounded-[10px] bg-nexus-base p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                   <MonitorPlay size={48} className="text-nexus-muted mb-4 opacity-50" />
                   <h3 className="text-xl text-nexus-text font-sans mb-2">Feed Offline</h3>
                   <p className="text-nexus-muted text-sm max-w-md mb-6 uppercase">Initialize playback to establish connection with the central streaming server.</p>
                   <button 
                     onClick={handleWatch}
                     className="h-12 rounded-[7px] px-6 bg-nexus-lime text-nexus-ink font-black cursor-pointer uppercase tracking-[0.06em] text-[0.76rem] transition-transform hover:-translate-y-1 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(130,255,130,0.3)]"
                   >
                     <Play size={16} fill="currentColor" /> Initialize
                   </button>
                </div>
             )}
          </div>

          {/* TV Shows / Anime Episodes */}
          {(media.type === 'tv' || media.type === 'anime') && (
            <div className="border border-nexus-line rounded-[10px] bg-nexus-base p-6">
              <div className="flex justify-between items-end mb-6 border-b border-nexus-line pb-4">
                 <div>
                    <div className="text-nexus-lime uppercase tracking-[0.14em] text-[0.67rem]">Directory</div>
                    <h2 className="font-sans text-2xl tracking-[-0.045em] mt-1 mb-0 text-nexus-text">Episodes</h2>
                 </div>
                 <div className="relative">
                    <select
                      value={playState.season}
                      onChange={(e) => setPlayState(p => ({ ...p, season: parseInt(e.target.value) }))}
                      className="bg-nexus-ink text-nexus-text border border-nexus-line rounded px-4 py-2 outline-none focus:border-nexus-lime appearance-none font-mono text-sm uppercase pr-10 cursor-pointer hover:border-nexus-lime transition"
                    >
                      {Array.from({ length: media.seasons || 1 }, (_, i) => i + 1).map(s => (
                        <option key={s} value={s}>Season {s}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-nexus-muted pointer-events-none" />
                 </div>
              </div>
              
              {loadingEpisodes ? (
                <div className="py-12 flex justify-center">
                   <Loader />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  {episodes.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => {
                        setPlayState(p => ({ ...p, episode: ep.episodeNumber, isPlaying: true }));
                        scrollTimeoutRef.current = setTimeout(() => {
                           playerRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className={`flex gap-3 p-3 rounded-[7px] border text-left transition-all group ${
                        playState.episode === ep.episodeNumber 
                          ? 'bg-nexus-raised border-nexus-lime' 
                          : 'bg-nexus-ink border-nexus-line hover:border-nexus-lime hover:bg-nexus-raised'
                      }`}
                    >
                      <div className="relative w-24 h-16 flex-shrink-0 bg-nexus-base rounded overflow-hidden">
                        {ep.stillPath ? (
                          <img src={ep.stillPath} alt={ep.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-nexus-muted">
                             <ImageIcon size={20} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition flex items-center justify-center">
                           <Play size={20} className={playState.episode === ep.episodeNumber ? 'text-nexus-lime' : 'text-white/70'} fill={playState.episode === ep.episodeNumber ? 'currentColor' : 'none'} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-wider">
                           <span className={playState.episode === ep.episodeNumber ? 'text-nexus-lime' : 'text-nexus-muted'}>
                              E{ep.episodeNumber}
                           </span>
                           {ep.airDate && <span className="text-nexus-muted font-normal">{ep.airDate}</span>}
                        </div>
                        <h4 className="font-sans text-sm text-nexus-text truncate group-hover:text-nexus-lime transition-colors mt-0.5">
                           {ep.name || `Episode ${ep.episodeNumber}`}
                        </h4>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
        
        {/* Right Column - Meta & Terminal Stats */}
        <div className="space-y-8">
           {/* Telemetry Panel */}
           <aside className="bg-nexus-base border border-nexus-line rounded-[9px] overflow-hidden shadow-[8px_8px_0_oklch(8%_0.01_265/0.75)]">
             <div className="h-[38px] px-3 flex items-center gap-[7px] border-b border-nexus-line text-nexus-muted text-[0.68rem]">
               <i className="w-2 h-2 rounded-full bg-[oklch(65%_0.2_25)]"></i>
               <i className="w-2 h-2 rounded-full bg-[oklch(80%_0.16_85)]"></i>
               <i className="w-2 h-2 rounded-full bg-nexus-lime"></i>
               <span className="ml-auto">system.telemetry</span>
             </div>
             <div className="p-5 flex flex-col gap-4 text-[0.75rem]">
               <div className="flex justify-between border-b border-nexus-line pb-3">
                 <span className="text-nexus-muted">Classification</span>
                 <b className="text-nexus-lime capitalize">{media.type}</b>
               </div>
               <div className="flex justify-between border-b border-nexus-line pb-3">
                 <span className="text-nexus-muted">Status</span>
                 <b className="text-nexus-lime">{media.status || 'Archived'}</b>
               </div>
               <div className="flex justify-between border-b border-nexus-line pb-3">
                 <span className="text-nexus-muted">Global Rating</span>
                 <b className="text-nexus-lime">{media.rating?.toFixed(1) || 'N/A'}</b>
               </div>
               <div className="flex justify-between border-b border-nexus-line pb-3">
                 <span className="text-nexus-muted">Launch Cycle</span>
                 <b className="text-nexus-lime">{media.releaseDate || 'Unknown'}</b>
               </div>
               {media.episodes ? (
                 <div className="flex justify-between border-b border-nexus-line pb-3">
                   <span className="text-nexus-muted">Total Segments</span>
                   <b className="text-nexus-lime">{media.episodes}</b>
                 </div>
               ) : null}
             </div>
           </aside>
           
           {/* Cast/Crew if needed (placeholder for now or omit) */}
        </div>
      </div>
      
      {/* Related Content */}
      <div className="mt-20">
        {collection.length > 0 && <Row title={`More in this Collection`} items={collection} />}
        {recommendations.length > 0 && <Row title="Signal Matched" items={recommendations} />}
      </div>
    </div>
  );
};"""

content = re.sub(target, replacement, content, flags=re.DOTALL)
with open("pages/Details.tsx", "w") as f:
    f.write(content)
print("Details updated")
