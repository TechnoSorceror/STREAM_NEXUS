import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Check, Play, Star, X } from 'lucide-react';
import { MediaItem, WatchStatus } from '../types';
import { addToMyList, isInMyList, removeFromMyList } from '../lib/myList';
import { mediaPath } from '../lib/routes';
import { posterSrc, posterSrcSet } from '../lib/images';

interface Props {
  item: MediaItem & { progress?: { season?: number; episode?: number; chapter?: number } };
  index?: number;
  onRemove?: (event: React.MouseEvent) => void;
  watchStatus?: WatchStatus;
  onWatchStatusChange?: (status: WatchStatus) => void;
}

const MediaCard: React.FC<Props> = ({ item, index = 0, onRemove, watchStatus, onWatchStatusChange }) => {
  const [saved, setSaved] = useState(() => isInMyList(item.id, item.type));
  useEffect(() => {
    const refresh = () => setSaved(isInMyList(item.id, item.type));
    window.addEventListener('streamnexus:list-change', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('streamnexus:list-change', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [item.id, item.type]);
  const status = item.progress
    ? item.type === 'tv' || item.type === 'anime'
      ? `S${item.progress.season || 1} E${item.progress.episode || 1}`
      : item.type === 'manga'
        ? `Chapter ${item.progress.chapter || 1}`
        : 'Resume'
    : item.releaseDate?.slice(0, 4) || 'TBA';

  const genre = typeof item.genres?.[0] === 'string' ? item.genres[0] : item.type === 'tv' ? 'Series' : item.type;

  const toggleSaved = () => {
    if (saved) removeFromMyList(item.id, item.type);
    else addToMyList(item);
    setSaved(!saved);
  };

  return (
    <article className="media-card" style={{ '--i': Math.min(index, 8) } as React.CSSProperties}>
      <Link to={mediaPath(item)}>
        <div className="poster-wrap">
          <img src={posterSrc(item.poster)} srcSet={posterSrcSet(item.poster)} width="342" height="513" sizes="(max-width: 640px) 42vw, (max-width: 1100px) 24vw, 210px" alt={`Poster for ${item.title}${item.releaseDate?.slice(0, 4) ? ` (${item.releaseDate.slice(0, 4)})` : ''}`} loading="lazy" decoding="async" />
          <div className="poster-shade" />
          <span className="card-type">{item.type === 'tv' ? 'Series' : item.type === 'anime' ? (item.format === 'MOVIE' ? 'Anime film' : 'Anime') : item.type}</span>
          <span className="card-play"><Play size={18} fill="currentColor" /></span>
        </div>
        <div className="card-copy">
          <h3>{item.title}</h3>
          <div className="card-meta">
            <span>{status} · {genre}</span>
            <strong><Star size={11} fill="currentColor" />{item.rating ? item.rating.toFixed(1) : 'NR'}</strong>
          </div>
        </div>
      </Link>
      {onRemove ? (
        <button className="remove-card" aria-label={`Remove ${item.title}`} onClick={onRemove}>
          <X size={15} />
        </button>
      ) : (
        <button className={`save-card ${saved ? 'is-saved' : ''}`} onClick={toggleSaved} aria-label={`${saved ? 'Remove' : 'Add'} ${item.title} ${saved ? 'from' : 'to'} my list`}>
          {saved ? <Check size={15} /> : <Bookmark size={15} />}
        </button>
      )}
      {watchStatus && onWatchStatusChange && (
        <label className="card-status-control">
          <span>Watch status</span>
          <select value={watchStatus} onChange={event => onWatchStatusChange(event.target.value as WatchStatus)}>
            <option value="watching">Watching</option>
            <option value="plan_to_watch">Up next</option>
            <option value="completed">Finished</option>
            <option value="on_hold">Paused</option>
            <option value="dropped">Dropped</option>
          </select>
        </label>
      )}
    </article>
  );
};

export default MediaCard;
