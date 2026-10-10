import { FILMU_EMBED_BASE } from '../constants';
import { MediaItem, PlaybackState } from '../types';

export const generateEmbedUrl = (media: MediaItem, state: PlaybackState): string | null => {
  const { type, tmdbId, anilistId } = media;
  const { season, episode } = state;
  const selectedSeason = season ?? media.tmdbSeason ?? 1;
  const selectedEpisode = episode ?? 1;

  switch (type) {
    case 'movie':
      if (!tmdbId) return null;
      return `${FILMU_EMBED_BASE}/movie/${tmdbId}`;

    case 'tv':
      if (!tmdbId) return null;
      return `${FILMU_EMBED_BASE}/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;

    case 'anime':
      if (!anilistId) return null;
      return `${FILMU_EMBED_BASE}/anime/${anilistId}/${selectedSeason}/${selectedEpisode}`;

    case 'manga':
      return null;

    default:
      return null;
  }
};
