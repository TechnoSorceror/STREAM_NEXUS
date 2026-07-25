import sys
import re

with open("pages/Details.tsx", "r") as f:
    content = f.read()

# Add icons
content = content.replace("Layers, Image as ImageIcon, ChevronDown, Video }", "Layers, Image as ImageIcon, ChevronDown, Video, SkipForward, SkipBack }")

# Add autoplay state
state_target = """  // Playback State
  const [playState, setPlayState] = useState<PlaybackState>({"""

state_replacement = """  const [autoPlayNext, setAutoPlayNext] = useState(true);

  // Playback State
  const [playState, setPlayState] = useState<PlaybackState>({"""

content = content.replace(state_target, state_replacement)

# Add handler functions right above `const renderEmbed = () => {`
handler_code = """
  const handleNextEpisode = () => {
    if (!media || (media.type !== 'tv' && media.type !== 'anime')) return;
    
    const currentEpIndex = episodes.findIndex(ep => ep.episode_number === playState.episode);
    if (currentEpIndex !== -1 && currentEpIndex < episodes.length - 1) {
      const nextEp = episodes[currentEpIndex + 1].episode_number;
      setPlayState(prev => ({ ...prev, episode: nextEp }));
    } else if (media.seasons && playState.season! < media.seasons) {
      setPlayState(prev => ({ ...prev, season: prev.season! + 1, episode: 1 }));
    }
  };

  const handlePrevEpisode = () => {
    if (!media || (media.type !== 'tv' && media.type !== 'anime')) return;
    
    const currentEpIndex = episodes.findIndex(ep => ep.episode_number === playState.episode);
    if (currentEpIndex > 0) {
      const prevEp = episodes[currentEpIndex - 1].episode_number;
      setPlayState(prev => ({ ...prev, episode: prevEp }));
    } else if (playState.season! > 1) {
       setPlayState(prev => ({ ...prev, season: prev.season! - 1, episode: 1 }));
    }
  };

  useEffect(() => {
    if (!autoPlayNext || !playState.isPlaying) return;

    const handleMessage = (e: MessageEvent) => {
      const data = typeof e.data === 'string' ? e.data : '';
      let isEnded = false;
      
      try {
        if (e.data === 'video_ended' || e.data === 'ended') {
          isEnded = true;
        } else if (e.data?.event === 'ended' || e.data?.event === 'video_ended') {
          isEnded = true;
        } else if (data.includes('ended') || data.includes('video_ended')) {
          isEnded = true;
        }
      } catch (err) {}
      
      if (isEnded) {
         handleNextEpisode();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [autoPlayNext, playState.isPlaying, playState.episode, playState.season, episodes, media?.seasons]);

  const renderEmbed = () => {"""

content = content.replace("  const renderEmbed = () => {", handler_code)


with open("pages/Details.tsx", "w") as f:
    f.write(content)

print("done")
