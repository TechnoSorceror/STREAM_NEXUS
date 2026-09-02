import { MediaItem } from '../types';

export const slugify = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80) || 'title';

export const parseEntityId = (value?: string) => {
  const match = value?.match(/^\d+/);
  return match ? Number(match[0]) : null;
};

export const mediaPath = (item: Pick<MediaItem, 'id' | 'title' | 'type'>) =>
  `/${item.type}/${item.id}-${slugify(item.title)}`;

export const personPath = (id: number, name: string) =>
  `/person/${id}-${slugify(name)}`;

