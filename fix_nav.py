import re

with open("components/Navbar.tsx", "r") as f:
    content = f.read()

target = r"  return \(\n    <nav className=.*?    </nav>\n  \);"

replacement = r"""  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="h-[72px] fixed z-40 inset-0 bottom-auto bg-[oklch(10%_0.016_265/0.93)] border-b border-nexus-line font-mono backdrop-blur-md">
      <nav className="h-full flex items-center gap-8 shell" aria-label="Primary">
        <Link to="/" className="flex items-center gap-3 font-black tracking-[-0.05em] text-[1.15rem]">
          <span className="w-[34px] h-[34px] grid place-items-center bg-nexus-lime text-nexus-ink rounded-[7px] shadow-[5px_5px_0_var(--color-nexus-violet)]">S/</span>
          <span>stream<em className="not-italic text-nexus-lime">nexus</em></span>
        </Link>
        
        <div className="hidden md:flex gap-7 ml-7 text-nexus-muted text-[0.78rem] uppercase tracking-[0.1em]">
          <Link to="/" className={`relative hover:text-nexus-text ${isActive('/') ? 'text-nexus-text after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-[9px] after:h-[2px] after:bg-nexus-lime' : ''}`}>Discover</Link>
          <Link to="/movies" className={`relative hover:text-nexus-text ${isActive('/movies') ? 'text-nexus-text after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-[9px] after:h-[2px] after:bg-nexus-lime' : ''}`}>Movies</Link>
          <Link to="/tv-shows" className={`relative hover:text-nexus-text ${isActive('/tv-shows') ? 'text-nexus-text after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-[9px] after:h-[2px] after:bg-nexus-lime' : ''}`}>Series</Link>
          <Link to="/my-list" className={`relative hover:text-nexus-text ${isActive('/my-list') ? 'text-nexus-text after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-[9px] after:h-[2px] after:bg-nexus-lime' : ''}`}>My List</Link>
        </div>

        <div className="ml-auto flex items-center gap-[10px]">
          <div ref={searchRef} className="relative hidden md:block">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                className="w-[min(29vw,310px)] h-[40px] px-3.5 border border-nexus-line rounded-[7px] bg-nexus-base text-nexus-text placeholder-nexus-muted outline-none focus:border-nexus-lime transition-colors"
                placeholder={getPlaceholder()}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (query.trim()) setShowSuggestions(true); }}
              />
            </form>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-3 right-0 w-full min-w-[280px] bg-nexus-base border border-nexus-line rounded-lg shadow-xl overflow-hidden z-50">
                {suggestions.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={`/${item.type}/${item.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-nexus-raised transition-colors border-b border-nexus-line last:border-0"
                    onClick={() => {
                      setShowSuggestions(false);
                      setQuery('');
                    }}
                  >
                    <img src={item.poster} alt={item.title} className="w-10 h-14 object-cover rounded shadow-md bg-nexus-raised" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm text-nexus-text font-medium truncate font-sans">{item.title}</span>
                      <div className="flex items-center gap-2 mt-1 font-mono uppercase text-[0.65rem] text-nexus-muted">
                        <span className="text-nexus-lime">{item.type}</span>
                        <span>{item.releaseDate.split('-')[0]}</span>
                        <div className="flex items-center gap-0.5">
                          <Star size={10} fill="var(--color-nexus-lime)" className="text-nexus-lime" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-[42px] h-[42px] border border-nexus-line rounded-[7px] bg-nexus-base text-nexus-text cursor-pointer hover:border-nexus-lime hover:text-nexus-lime grid place-items-center md:hidden" aria-label="Menu">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[72px] left-0 w-full bg-[oklch(10%_0.016_265/0.98)] border-b border-nexus-line p-5 space-y-5 backdrop-blur-xl z-40 shadow-2xl">
          <div className="relative">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder={getPlaceholder()}
                className="w-full h-[48px] px-4 border border-nexus-line rounded-[7px] bg-nexus-base text-nexus-text placeholder-nexus-muted outline-none focus:border-nexus-lime"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (query.trim()) setShowSuggestions(true); }}
              />
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="mt-3 w-full bg-nexus-base border border-nexus-line rounded-lg shadow-xl overflow-hidden">
                {suggestions.map((item) => (
                  <Link
                    key={`mobile-${item.type}-${item.id}`}
                    to={`/${item.type}/${item.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-nexus-raised transition-colors border-b border-nexus-line last:border-0"
                    onClick={() => {
                      setShowSuggestions(false);
                      setQuery('');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <img src={item.poster} alt={item.title} className="w-10 h-14 object-cover rounded bg-nexus-raised" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm text-nexus-text font-medium truncate font-sans">{item.title}</span>
                      <div className="flex items-center gap-2 mt-1 font-mono uppercase text-[0.65rem] text-nexus-muted">
                        <span className="text-nexus-lime">{item.type}</span>
                        <span>{item.releaseDate.split('-')[0]}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4 font-mono uppercase text-sm tracking-wider pt-2 border-t border-nexus-line/50">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`${isActive('/') ? 'text-nexus-lime' : 'text-nexus-text'} hover:text-nexus-lime`}>Discover</Link>
            <Link to="/movies" onClick={() => setMobileMenuOpen(false)} className={`${isActive('/movies') ? 'text-nexus-lime' : 'text-nexus-text'} hover:text-nexus-lime`}>Movies</Link>
            <Link to="/tv-shows" onClick={() => setMobileMenuOpen(false)} className={`${isActive('/tv-shows') ? 'text-nexus-lime' : 'text-nexus-text'} hover:text-nexus-lime`}>Series</Link>
            <Link to="/my-list" onClick={() => setMobileMenuOpen(false)} className={`${isActive('/my-list') ? 'text-nexus-lime' : 'text-nexus-text'} hover:text-nexus-lime`}>My List</Link>
          </div>
        </div>
      )}
    </header>
  );"""

content = re.sub(target, replacement, content, flags=re.DOTALL)

with open("components/Navbar.tsx", "w") as f:
    f.write(content)

print("Navbar.tsx updated")
