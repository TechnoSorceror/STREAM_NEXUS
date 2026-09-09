import { VIDSRC_SBS_BASE } from '../constants';
import { MediaItem, PlaybackState } from '../types';

export const generateEmbedUrl = (media: MediaItem, state: PlaybackState): string | null => {
  const { type, tmdbId, anilistId } = media;
  const { season, episode } = state;
  const selectedSeason = season ?? media.tmdbSeason ?? 1;
  const selectedEpisode = episode ?? 1;

  switch (type) {
    case 'movie':
      if (!tmdbId) return null;
      return `${VIDSRC_SBS_BASE}/movie/${tmdbId}`;

    case 'tv':
      if (!tmdbId) return null;
      return `${VIDSRC_SBS_BASE}/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;

    case 'anime':
      if (!tmdbId) return null;
      if (media.tmdbMediaType === 'movie') {
        return `${VIDSRC_SBS_BASE}/movie/${tmdbId}`;
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
