import { VIDSRC_BASE, VIDSRC_RU_BASE, VIDSRC_SBS_BASE } from '../constants';
import { MediaItem, PlaybackState } from '../types';

export const MULTIEMBED_BASE = 'https://multiembed.mov/directstream.php'; // VIP player

export const generateEmbedUrl = (media: MediaItem, state: PlaybackState): string | null => {
  const { type, tmdbId, anilistId } = media;
  const { season, episode, chapter, isDub, server } = state;

  switch (type) {
    case 'movie':
      if (!tmdbId) return null;
      if (server === 2) {
        return `${MULTIEMBED_BASE}?video_id=${tmdbId}&tmdb=1`;
      }
      return `${VIDSRC_SBS_BASE}/movie/${tmdbId}`;

    case 'tv':
      if (!tmdbId) return null;
      
      if (server === 2) {
        if (season && episode) {
          return `${MULTIEMBED_BASE}?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
        }
        return `${MULTIEMBED_BASE}?video_id=${tmdbId}&tmdb=1`;
      }

      if (season && episode) {
        return `${VIDSRC_SBS_BASE}/tv/${tmdbId}/${season}/${episode}`;
      }
      return `${VIDSRC_SBS_BASE}/tv/${tmdbId}`;

    case 'anime':
      if (!tmdbId) return null;
      if (server === 2) {
        if (season && episode) {
          return `${MULTIEMBED_BASE}?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
        }
        return `${MULTIEMBED_BASE}?video_id=${tmdbId}&tmdb=1&s=${season || 1}&e=${episode || 1}`;
      }

      if (season && episode) {
        return `${VIDSRC_SBS_BASE}/tv/${tmdbId}/${season}/${episode}`;
      }
      return `${VIDSRC_SBS_BASE}/tv/${tmdbId}/${season || 1}/${episode || 1}`;

    case 'manga':
      // Manga is not affected by server selection
      if (!anilistId) return null;
      const chap = chapter || 1;
      return null;

    default:
      return null;
  }
};