import { MediaItem, MediaType, WatchStatus } from '../types';

const MY_LIST_KEY = 'streamnexus_my_list';
const LIST_CHANGE_EVENT = 'streamnexus:list-change';
const MAX_ITEMS = 500;
const MEDIA_TYPES = new Set<MediaType>(['movie', 'tv', 'anime', 'manga']);
const WATCH_STATUSES = new Set<WatchStatus>(['watching', 'plan_to_watch', 'completed', 'on_hold', 'dropped']);
const IMAGE_HOSTS = new Set(['image.tmdb.org', 's4.anilist.co', 'picsum.photos']);

export interface MyListItem extends MediaItem {
  watchStatus?: WatchStatus;
}

interface LibraryBackup {
  version: 1;
  exportedAt: string;
  items: MyListItem[];
}

const safeText = (value: unknown, maxLength: number) => typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
const safeNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : undefined;
const safeImage = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && IMAGE_HOSTS.has(url.hostname) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const normalizeItem = (value: unknown): MyListItem | null => {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const type = source.type as MediaType;
  const id = typeof source.id === 'number' || typeof source.id === 'string' ? source.id : undefined;
  const title = safeText(source.title, 200);
  const poster = safeImage(source.poster);
  if (!id || !MEDIA_TYPES.has(type) || !title || !poster) return null;
  const status = WATCH_STATUSES.has(source.watchStatus as WatchStatus) ? source.watchStatus as WatchStatus : 'plan_to_watch';
  const tmdbMediaType = source.tmdbMediaType === 'movie' || source.tmdbMediaType === 'tv' ? source.tmdbMediaType : undefined;
  return {
    id,
    type,
    title,
    poster,
    banner: safeImage(source.banner),
    description: safeText(source.description, 5_000),
    rating: Math.max(0, Math.min(10, safeNumber(source.rating) || 0)),
    releaseDate: safeText(source.releaseDate, 32) || 'N/A',
    genres: Array.isArray(source.genres) ? source.genres.map(genre => safeText(genre, 60)).filter(Boolean).slice(0, 20) : [],
    status: safeText(source.status, 80) || undefined,
    format: safeText(source.format, 40) || undefined,
    tmdbId: safeNumber(source.tmdbId),
    tmdbMediaType,
    tmdbSeason: safeNumber(source.tmdbSeason),
    anilistId: safeNumber(source.anilistId),
    imdbId: safeText(source.imdbId, 32) || undefined,
    seasons: safeNumber(source.seasons),
    episodes: safeNumber(source.episodes),
    chapters: safeNumber(source.chapters),
    watchStatus: status
  };
};

const notify = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(LIST_CHANGE_EVENT));
};

const writeMyList = (items: MyListItem[]) => {
  localStorage.setItem(MY_LIST_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  notify();
};

export const getMyList = (): MyListItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(MY_LIST_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(normalizeItem).filter((item): item is MyListItem => Boolean(item)).slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
};

export const isInMyList = (id: string | number, type: MediaType): boolean =>
  getMyList().some(item => String(item.id) === String(id) && item.type === type);

export const getMyListStatus = (id: string | number, type: MediaType): WatchStatus | undefined =>
  getMyList().find(item => String(item.id) === String(id) && item.type === type)?.watchStatus;

export const addToMyList = (item: MediaItem, status: WatchStatus = 'plan_to_watch') => {
  const list = getMyList();
  const normalized = normalizeItem({ ...item, watchStatus: status });
  if (!normalized) return;
  const existingIndex = list.findIndex(entry => String(entry.id) === String(item.id) && entry.type === item.type);
  if (existingIndex > -1) list[existingIndex] = { ...list[existingIndex], ...normalized, watchStatus: status };
  else list.push(normalized);
  writeMyList(list);
};

export const setMyListStatus = (id: string | number, type: MediaType, status: WatchStatus) => {
  const list = getMyList();
  const item = list.find(entry => String(entry.id) === String(id) && entry.type === type);
  if (!item) return;
  item.watchStatus = status;
  writeMyList(list);
};

export const removeFromMyList = (id: string | number, type: MediaType) =>
  writeMyList(getMyList().filter(item => !(String(item.id) === String(id) && item.type === type)));

export const exportMyListBackup = () => JSON.stringify({
  version: 1,
  exportedAt: new Date().toISOString(),
  items: getMyList()
} satisfies LibraryBackup, null, 2);

export const importMyListBackup = (raw: string) => {
  if (raw.length > 2_000_000) throw new Error('That backup is too large.');
  const parsed: unknown = JSON.parse(raw);
  const candidates = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).items)
      ? (parsed as Record<string, unknown>).items as unknown[]
      : null;
  if (!candidates) throw new Error('This is not a StreamNexus library backup.');
  const unique = new Map<string, MyListItem>();
  candidates.slice(0, MAX_ITEMS).forEach(candidate => {
    const item = normalizeItem(candidate);
    if (item) unique.set(`${item.type}:${item.id}`, item);
  });
  if (!unique.size && candidates.length) throw new Error('The backup did not contain any valid titles.');
  writeMyList([...unique.values()]);
  return unique.size;
};
