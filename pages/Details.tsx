import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { BookOpen, Calendar, Check, ChevronDown, ExternalLink, Layers, Play, Server, Share2, SkipBack, SkipForward, Star, Video } from 'lucide-react';
import { MediaItem, PlaybackState, EpisodeInfo, WatchStatus } from '../types';
import { tmdbService } from '../services/tmdb';
import { anilistService } from '../services/anilist';
import { generateEmbedUrl } from '../services/embed';
import { addToMyList, getMyListStatus, isInMyList, removeFromMyList } from '../lib/myList';
import { getWatchProgress, saveWatchProgress } from '../lib/watchProgress';
import Row from '../components/Row';
import Loader from '../components/Loader';

const statuses: { value: WatchStatus; label: string }[] = [
  { value: 'watching', label: 'Watching' }, { value: 'plan_to_watch', label: 'Plan to watch' },
  { value: 'completed', label: 'Completed' }, { value: 'on_hold', label: 'On hold' }, { value: 'dropped', label: 'Dropped' }
];

const Details: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const type = location.pathname.split('/')[1] as 'movie' | 'tv' | 'anime' | 'manga';
  const playerRef = useRef<HTMLDivElement>(null);
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [collection, setCollection] = useState<MediaItem[]>([]);
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [saved, setSaved] = useState(false);
  const [watchStatus, setWatchStatus] = useState<WatchStatus>('plan_to_watch');
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [shared, setShared] = useState(false);
  const [playState, setPlayState] = useState<PlaybackState>({ isPlaying: false, season: 1, episode: 1, chapter: 1, isDub: false, server: 1 });

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      setLoading(true); setCollection([]); setRecommendations([]);
      try {
        let result: MediaItem | null = null;
        if (type === 'movie' || type === 'tv') result = await tmdbService.getDetails(Number(id), type);
        else result = await anilistService.getDetails(Number(id), type);
        if (!active) return;
        setMedia(result);
        if (!result) return;
        setSaved(isInMyList(result.id, result.type));
        setWatchStatus((getMyListStatus(result.id, result.type) as WatchStatus) || 'plan_to_watch');
        const progress = getWatchProgress(result.id, result.type);
        setPlayState({ isPlaying: false, season: progress?.season || 1, episode: progress?.episode || 1, chapter: progress?.chapter || 1, isDub: false, server: 1 });
        if ((type === 'movie' || type === 'tv') && result.id) setRecommendations(await tmdbService.getRecommendations(Number(result.id), type));
        if (type === 'movie' && result.collectionId) setCollection((await tmdbService.getCollection(result.collectionId)).filter(item => item.id !== result!.id));
      } catch (error) { console.error('Details fetch error', error); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [id, type]);

  useEffect(() => {
    if (!media || (media.type !== 'tv' && media.type !== 'anime') || !media.tmdbId) return;
    let active = true;
    setLoadingEpisodes(true);
    tmdbService.getSeason(media.tmdbId, playState.season).then(data => { if (active) setEpisodes(data.episodes || []); }).finally(() => { if (active) setLoadingEpisodes(false); });
    return () => { active = false; };
  }, [media, playState.season]);

  useEffect(() => {
    if (media && playState.isPlaying) saveWatchProgress(media, { season: playState.season, episode: playState.episode, chapter: playState.chapter });
  }, [media, playState.isPlaying, playState.season, playState.episode, playState.chapter]);

  const embedUrl = useMemo(() => media ? generateEmbedUrl(media, playState) : '', [media, playState]);
  const start = () => { setPlayState(state => ({ ...state, isPlaying: true })); window.setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80); };
  const selectEpisode = (episode: number) => { setPlayState(state => ({ ...state, episode, isPlaying: true })); window.setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth' }), 80); };
  const nextEpisode = () => { const index = episodes.findIndex(ep => ep.episode_number === playState.episode); if (index >= 0 && index < episodes.length - 1) selectEpisode(episodes[index + 1].episode_number); else if ((media?.seasons || 0) > playState.season) setPlayState(s => ({ ...s, season: s.season + 1, episode: 1 })); };
  const previousEpisode = () => { const index = episodes.findIndex(ep => ep.episode_number === playState.episode); if (index > 0) selectEpisode(episodes[index - 1].episode_number); };
  const share = async () => {
    const data = { title: media?.title || 'StreamNexus', text: `Watch ${media?.title || 'this title'} on StreamNexus`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      // Dismissed share dialogs need no visible error.
    }
  };

  if (loading) return <Loader page label="Loading title" />;
  if (!media) return <div className="empty-state detail-missing"><h2>Title unavailable.</h2><p>The source returned no usable metadata.</p></div>;

  const isSeries = media.type === 'tv' || media.type === 'anime';
  return (
    <div className="detail-page">
      <section className="detail-hero">
        <img className="detail-backdrop" src={media.banner || media.poster} alt="" />
        <div className="detail-shade" />
        <div className="shell detail-layout">
          <img className="detail-poster" src={media.poster} alt={`${media.title} poster`} />
          <div className="detail-copy">
            <div className="eyebrow">{media.type} / {media.status || 'Available'}</div>
            <h1>{media.title}</h1>
            <div className="detail-facts"><strong><Star size={14} fill="currentColor" /> {media.rating?.toFixed(1) || 'NR'}</strong><span><Calendar size={14} /> {media.releaseDate?.slice(0, 4)}</span><span>{media.genres?.slice(0, 3).join(' / ')}</span></div>
            <p>{media.description}</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={start}>{media.type === 'manga' ? <BookOpen size={17} /> : <Play size={17} fill="currentColor" />}{media.type === 'manga' ? 'Start reading' : 'Watch now'}</button>
              <button className={`button button-quiet ${saved ? 'is-saved' : ''}`} onClick={() => { if (saved) { removeFromMyList(media.id, media.type); setSaved(false); } else { addToMyList(media, watchStatus); setSaved(true); } }}>{saved ? <Check size={17} /> : '+'}{saved ? 'Saved' : 'My list'}</button>
              {media.trailerUrl && <button className="button button-quiet" onClick={() => setTrailerOpen(true)}><Video size={17} /> Trailer</button>}
              <button className="button button-icon" onClick={share} aria-label="Share this title">{shared ? <Check size={17} /> : <Share2 size={17} />}</button>
            </div>
            {saved && <label className="status-select"><span>Status</span><select value={watchStatus} onChange={event => { const value = event.target.value as WatchStatus; setWatchStatus(value); addToMyList(media, value); }}>{statuses.map(status => <option value={status.value} key={status.value}>{status.label}</option>)}</select><ChevronDown size={15} /></label>}
          </div>
        </div>
      </section>

      <div className="shell detail-content">
        {playState.isPlaying && (
          <section className="player-block" ref={playerRef}>
            <div className="player-toolbar"><div><span className="live-dot" />{media.type === 'movie' ? 'Now playing' : media.type === 'manga' ? `Chapter ${playState.chapter}` : `Season ${playState.season}, episode ${playState.episode}`}</div><div className="player-controls">{isSeries && <><button onClick={previousEpisode} aria-label="Previous episode"><SkipBack size={16} /></button><button onClick={nextEpisode} aria-label="Next episode"><SkipForward size={16} /></button><label className="auto-toggle"><input type="checkbox" checked={autoPlay} onChange={e => setAutoPlay(e.target.checked)} /><span />Auto next</label></>}<div className="server-toggle"><Server size={14} /><button className={playState.server === 1 ? 'active' : ''} onClick={() => setPlayState(s => ({ ...s, server: 1 }))}>A</button><button className={playState.server === 2 ? 'active' : ''} onClick={() => setPlayState(s => ({ ...s, server: 2 }))}>B</button></div>{embedUrl && <button onClick={() => window.open(embedUrl, '_blank', 'noopener,noreferrer')}><ExternalLink size={15} /> New tab</button>}</div></div>
            <div className="player-frame">{embedUrl ? <iframe key={embedUrl} src={embedUrl} title={`${media.title} player`} allowFullScreen allow="autoplay; encrypted-media; picture-in-picture" /> : <div className="empty-state"><Video size={28} /><h2>Source unavailable.</h2></div>}</div>
          </section>
        )}

        {isSeries && media.seasons && <section className="episodes-section"><div className="section-heading"><div><div className="eyebrow"><Layers size={13} /> Episode guide</div><h2>Choose an episode</h2></div><select value={playState.season} onChange={e => setPlayState(s => ({ ...s, season: Number(e.target.value), episode: 1 }))}>{Array.from({ length: media.seasons }, (_, i) => i + 1).map(season => <option key={season} value={season}>Season {season}</option>)}</select></div>{loadingEpisodes ? <Loader label="Loading episodes" /> : <div className="episode-list">{episodes.map(ep => <button key={ep.id} onClick={() => selectEpisode(ep.episode_number)} className={playState.episode === ep.episode_number ? 'active' : ''}><span className="episode-number">{String(ep.episode_number).padStart(2, '0')}</span>{ep.still_path ? <img src={ep.still_path} alt="" /> : <div className="episode-placeholder" />}<span><b>{ep.name}</b><small>{ep.overview || 'No synopsis available.'}</small></span><Play size={16} /></button>)}</div>}</section>}
        {media.type === 'manga' && (media.chapters || 0) > 0 && <section className="chapters-section"><div className="section-heading"><div><div className="eyebrow"><BookOpen size={13} /> Reading index</div><h2>Chapters</h2></div></div><div className="chapter-grid">{Array.from({ length: media.chapters || 0 }, (_, i) => i + 1).map(chapter => <button key={chapter} className={playState.chapter === chapter ? 'active' : ''} onClick={() => { setPlayState(s => ({ ...s, chapter, isPlaying: true })); }}>{String(chapter).padStart(3, '0')}</button>)}</div></section>}
        {collection.length > 0 && <Row title={`More in ${media.collectionName}`} kicker="Complete the collection" items={collection} featured />}
        {recommendations.length > 0 && <Row title="You may also like" kicker="Signal matched" items={recommendations} />}
      </div>

      {trailerOpen && media.trailerUrl && <div className="trailer-overlay" role="dialog" aria-modal="true" onClick={() => setTrailerOpen(false)}><div onClick={e => e.stopPropagation()}><button onClick={() => setTrailerOpen(false)} aria-label="Close trailer">×</button><iframe src={media.trailerUrl} title={`${media.title} trailer`} allowFullScreen allow="autoplay; encrypted-media; picture-in-picture" /></div></div>}
    </div>
  );
};
export default Details;
