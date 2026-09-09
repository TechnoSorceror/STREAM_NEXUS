import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tmdbService } from '../services/tmdb';
import { MediaItem } from '../types';

// The URL is the source of truth, including same-page links and browser history.
export const useQueryFilters = () => {
  const [params, setParams] = useSearchParams();
  const updateFilters = (changes: Record<string, string | null>) => {
    setParams(current => {
      const next = new URLSearchParams(current);
      Object.entries(changes).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      return next;
    }, { replace: true });
  };
  return { params, updateFilters };
};

export const filterYear = (value: string) => value.replace(/\D/g, '').slice(0, 4);
export const filterScore = (value: string | null, scores = [6, 7, 8, 9]) =>
  scores.includes(Number(value)) ? Number(value) : 0;

export const useCatalogFilters = (type: 'movie' | 'tv', retryKey: number) => {
  const { params, updateFilters } = useQueryFilters();
  const genreValue = Number(params.get('genre'));
  const genre = Number.isSafeInteger(genreValue) && genreValue > 0 ? genreValue : null;
  const year = filterYear(params.get('year') || '');
  const rating = filterScore(params.get('rating'));
  const isFiltered = genre !== null || Boolean(year) || rating > 0;
  const [filtered, setFiltered] = useState<MediaItem[]>([]);
  const [filtering, setFiltering] = useState(isFiltered);
  const [filterWarning, setFilterWarning] = useState('');

  useEffect(() => {
    setFiltered([]);
    setFilterWarning('');
    setFiltering(isFiltered);
    if (!isFiltered) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const items = await tmdbService.getByGenre(type, genre, year, rating);
        if (active) setFiltered(items);
      } catch {
        if (active) setFilterWarning(`The selected ${type === 'movie' ? 'movie' : 'TV'} filters could not be loaded.`);
      } finally {
        if (active) setFiltering(false);
      }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [type, genre, year, rating, isFiltered, retryKey]);

  return {
    genre, year, rating, isFiltered, filtered, filtering, filterWarning,
    setGenre: (value: number | null) => updateFilters(value === null
      ? { genre: null, year: null, rating: null }
      : { genre: String(value) }),
    setYear: (value: string) => updateFilters({ year: filterYear(value) }),
    setRating: (value: number) => updateFilters({ rating: value ? String(value) : null })
  };
};
