import re

with open("pages/Details.tsx", "r") as f:
    content = f.read()

# Fix season effect race condition
target_season = """  // Fetch TV Episodes when Season Changes or Media Loads
  useEffect(() => {
    if ((media?.type === 'tv' || media?.type === 'anime') && media?.tmdbId) {
      const fetchEps = async () => {
        setLoadingEpisodes(true);
        const data = await tmdbService.getSeason(media.tmdbId!, playState.season);
        setEpisodes(data.episodes);
        setLoadingEpisodes(false);
      };
      fetchEps();
    }
  }, [media?.type, media?.tmdbId, playState.season]);"""

replacement_season = """  // Fetch TV Episodes when Season Changes or Media Loads
  useEffect(() => {
    let isMounted = true;
    if ((media?.type === 'tv' || media?.type === 'anime') && media?.tmdbId) {
      const fetchEps = async () => {
        setLoadingEpisodes(true);
        const data = await tmdbService.getSeason(media.tmdbId!, playState.season);
        if (isMounted) {
            setEpisodes(data.episodes);
            setLoadingEpisodes(false);
        }
      };
      fetchEps();
    }
    return () => { isMounted = false; };
  }, [media?.type, media?.tmdbId, playState.season]);"""

content = content.replace(target_season, replacement_season)

# Fix auto-next listener origin check
target_listener = """  useEffect(() => {
    if (!autoPlayNext || !playState.isPlaying) return;

    const handleMessage = (e: MessageEvent) => {
      const data = typeof e.data === 'string' ? e.data : '';
      let isEnded = false;"""

replacement_listener = """  useEffect(() => {
    if (!autoPlayNext || !playState.isPlaying) return;

    const handleMessage = (e: MessageEvent) => {
      // Validate origin to prevent malicious iframe attacks
      const allowedOrigins = ['https://vidsrc.icu', 'https://vidsrc-embed.ru', 'https://vidsrc.sbs', 'https://vidsrc.net', 'https://multiembed.mov'];
      let isValidOrigin = false;
      for (const origin of allowedOrigins) {
          if (e.origin.startsWith(origin)) isValidOrigin = true;
      }
      if (!isValidOrigin && e.origin !== window.location.origin) return;

      const data = typeof e.data === 'string' ? e.data : '';
      let isEnded = false;"""

content = content.replace(target_listener, replacement_listener)

with open("pages/Details.tsx", "w") as f:
    f.write(content)

print("Done")
