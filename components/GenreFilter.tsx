import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { Link } from 'react-router-dom';
import { getGenreLandingByName } from '../lib/catalog';

interface Props {
  type: 'movie' | 'tv';
  selectedGenreId: number | null;
  onSelectGenre: (id: number | null) => void;
}

const GenreFilter: React.FC<Props> = ({ type, selectedGenreId, onSelectGenre }) => {
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [edges, setEdges] = useState({ left: false, right: true });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    tmdbService.getGenres(type).then(items => {
      if (active) setGenres(items);
    }).catch(console.error);
    return () => { active = false; };
  }, [type]);

  const updateEdges = () => {
    const element = scrollRef.current;
    if (!element) return;
    setEdges({
      left: element.scrollLeft > 4,
      right: Math.ceil(element.scrollLeft + element.clientWidth) < element.scrollWidth - 4
    });
  };

  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [genres]);

  const move = (direction: number) =>
    scrollRef.current?.scrollBy({ left: direction * Math.min(scrollRef.current.clientWidth * .75, 420), behavior: 'smooth' });

  if (!genres.length) return null;

  return (
    <div className="genre-filter">
      {edges.left && <button className="genre-arrow left" onClick={() => move(-1)} aria-label="Previous genres"><ChevronLeft size={18} /></button>}
      <nav className="genre-strip" aria-label={`${type === 'movie' ? 'Movie' : 'TV'} genres`} ref={scrollRef} onScroll={updateEdges}>
        <Link className={selectedGenreId === null ? 'active' : ''} to={type === 'movie' ? '/movies' : '/tv-shows'} onClick={() => onSelectGenre(null)}>All titles</Link>
        {genres.map(genre => {
          const landing = getGenreLandingByName(type, genre.name);
          return landing
            ? <Link className={selectedGenreId === genre.id ? 'active' : ''} key={genre.id} to={`/${type === 'movie' ? 'movies' : 'tv-shows'}/genre/${landing.slug}`}>{genre.name}</Link>
            : <button className={selectedGenreId === genre.id ? 'active' : ''} key={genre.id} onClick={() => onSelectGenre(genre.id)}>{genre.name}</button>;
        })}
      </nav>
      {edges.right && <button className="genre-arrow right" onClick={() => move(1)} aria-label="More genres"><ChevronRight size={18} /></button>}
    </div>
  );
};

export default GenreFilter;
