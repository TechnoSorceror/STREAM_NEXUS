import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Check, Play, Star, X } from 'lucide-react';
import { MediaItem } from '../types';
import { addToMyList, isInMyList, removeFromMyList } from '../lib/myList';

interface Props {
  item: MediaItem & { progress?: { season?: number; episode?: number; chapter?: number } };
  index?: number;
  onRemove?: (event: React.MouseEvent) => void;
}

const MediaCard: React.FC<Props> = ({ item, index = 0, onRemove }) => {
  const [saved, setSaved] = useState(() => isInMyList(item.id, item.type));
  const status = item.progress
    ? item.type === 'tv' || item.type === 'anime'
      ? `S${item.progress.season || 1} E${item.progress.episode || 1}`
      : item.type === 'manga'
        ? `Chapter ${item.progress.chapter || 1}`
        : 'Resume'
    : item.releaseDate?.slice(0, 4) || 'TBA';

  const genre = typeof item.genres?.[0] === 'string' ? item.genres[0] : item.type === 'tv' ? 'Series' : item.type;

  const toggleSaved = (event: React.MouseEvent) => {
    if (saved) removeFromMyList(item.id, item.type);
    else addToMyList(item);
    setSaved(!saved);
  };

  return (
    <article className="media-card" style={{ '--i': Math.min(index, 8) } as React.CSSProperties}>
      <Link to={`/${item.type}/${item.id}`} aria-label={`View ${item.title}`}>
        <div className="poster-wrap">
          <img src={item.poster} alt={`${item.title} poster`} loading="lazy" />
          <div className="poster-shade" />
          <span className="card-type">{item.type === 'tv' ? 'Series' : item.type}</span>
          <span className="card-play"><Play size={18} fill="currentColor" /></span>
          {item.progress && <span className="progress-track"><i /></span>}
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
    </article>
  );
};

export default MediaCard;
