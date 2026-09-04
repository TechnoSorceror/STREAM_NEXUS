import { VIDSRC_SBS_BASE } from '../constants';
import { MediaItem, PlaybackState } from '../types';

export const MULTIEMBED_BASE = 'https://multiembed.mov/directstream.php'; // VIP player

export const generateEmbedUrl = (media: MediaItem, state: PlaybackState): string | null => {
  const { type, tmdbId, anilistId } = media;
  const { season, episode, server } = state;
  const selectedSeason = season ?? media.tmdbSeason ?? 1;
  const selectedEpisode = episode ?? 1;

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
        return `${MULTIEMBED_BASE}?video_id=${tmdbId}&tmdb=1&s=${selectedSeason}&e=${selectedEpisode}`;
      }
      return `${VIDSRC_SBS_BASE}/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;

    case 'anime':
      if (!tmdbId) return null;
      if (media.tmdbMediaType === 'movie') {
        if (server === 2) return `${MULTIEMBED_BASE}?video_id=${tmdbId}&tmdb=1`;
        return `${VIDSRC_SBS_BASE}/movie/${tmdbId}`;
      }
      if (server === 2) {
        return `${MULTIEMBED_BASE}?video_id=${tmdbId}&tmdb=1&s=${selectedSeason}&e=${selectedEpisode}`;
      }
      return `${VIDSRC_SBS_BASE}/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;

    case 'manga': {
      // Manga is not affected by server selection
      if (!anilistId) return null;
      return null;
    }

    default:
      return null;
  }
};
