import { MediaItem, WatchStatus } from '../types';

const MY_LIST_KEY = 'streamnexus_my_list';

export interface MyListItem extends MediaItem {
  watchStatus?: WatchStatus;
}

export const getMyList = (): MyListItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(MY_LIST_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const isInMyList = (id: string | number, type: 'movie' | 'tv' | 'anime' | 'manga'): boolean => {
  const list = getMyList();
  return list.some(item => String(item.id) === String(id) && item.type === type);
};

export const getMyListStatus = (id: string | number, type: 'movie' | 'tv' | 'anime' | 'manga'): WatchStatus | undefined => {
  const list = getMyList();
  const item = list.find(i => String(i.id) === String(id) && i.type === type);
  return item?.watchStatus;
};

export const addToMyList = (item: MediaItem, status: WatchStatus = 'plan_to_watch') => {
  const list = getMyList();
  const existingIndex = list.findIndex(i => String(i.id) === String(item.id) && i.type === item.type);
  if (existingIndex > -1) {
    list[existingIndex].watchStatus = status;
  } else {
    list.push({ ...item, watchStatus: status });
  }
  localStorage.setItem(MY_LIST_KEY, JSON.stringify(list));
};

export const removeFromMyList = (id: string | number, type: 'movie' | 'tv' | 'anime' | 'manga') => {
  let list = getMyList();
  list = list.filter(item => !(String(item.id) === String(id) && item.type === type));
  localStorage.setItem(MY_LIST_KEY, JSON.stringify(list));
};
