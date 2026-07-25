import { MediaItem } from '../types';

export interface WatchProgress {
  media: MediaItem;
  season?: number;
  episode?: number;
  chapter?: number;
  updatedAt: string; // ISO string
}

const WATCH_PROGRESS_KEY = 'streamnexus_watch_progress';

export const getWatchProgressList = (): WatchProgress[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(WATCH_PROGRESS_KEY);
  if (!stored) return [];
  try {
    const list: WatchProgress[] = JSON.parse(stored);
    // Sort by most recently updated/watched first
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
};

export const getWatchProgress = (
  id: string | number,
  type: 'movie' | 'tv' | 'anime' | 'manga'
): WatchProgress | null => {
  const list = getWatchProgressList();
  const found = list.find((item) => String(item.media.id) === String(id) && item.media.type === type);
  return found || null;
};

export const saveWatchProgress = (
  media: MediaItem,
  progress: { season?: number; episode?: number; chapter?: number }
) => {
  if (typeof window === 'undefined') return;
  const list = getWatchProgressList();
  const existingIndex = list.findIndex(
    (item) => String(item.media.id) === String(media.id) && item.media.type === media.type
  );

  const updatedProgress: WatchProgress = {
    media,
    season: progress.season,
    episode: progress.episode,
    chapter: progress.chapter,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex > -1) {
    list[existingIndex] = updatedProgress;
  } else {
    list.push(updatedProgress);
  }

  // Keep max 20 continue watching items to avoid bloating localStorage
  const truncatedList = list
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 20);

  localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(truncatedList));
};

export const removeWatchProgress = (id: string | number, type: 'movie' | 'tv' | 'anime' | 'manga') => {
  if (typeof window === 'undefined') return;
  let list = getWatchProgressList();
  list = list.filter((item) => !(String(item.media.id) === String(id) && item.media.type === type));
  localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(list));
};
