import { MediaItem } from '../types';
import { tmdbService } from './tmdb';

const VIDSRC_API_BASE = 'https://corsproxy.io/?url=https://vidsrc-embed.ru';

export const vidsrcService = {
  getLatestMovies: async (page: number = 1): Promise<MediaItem[]> => {
    try {
      const response = await fetch(`${VIDSRC_API_BASE}/movies/latest/page-${page}.json`);
      if (!response.ok) return [];
      const data = await response.json();
      
      const results = (data.result || []).slice(0, 12);
      const mediaItems: MediaItem[] = [];
      
      // Fetch TMDB details for each item to get posters and full metadata
      // Using Promise.all to fetch concurrently
      const detailsPromises = results.map(async (item: any) => {
        if (item.tmdb_id) {
           return await tmdbService.getDetails(Number(item.tmdb_id), 'movie');
        }
        return null;
      });

      const detailsResponses = await Promise.all(detailsPromises);
      
      return detailsResponses.filter((item): item is MediaItem => item !== null);
    } catch (error) {
      console.error("Error fetching latest vidsrc movies", error);
      return [];
    }
  },

  getLatestTvShows: async (page: number = 1): Promise<MediaItem[]> => {
    try {
      const response = await fetch(`${VIDSRC_API_BASE}/tvshows/latest/page-${page}.json`);
      if (!response.ok) return [];
      const data = await response.json();
      
      const results = (data.result || []).slice(0, 12);
      
      const detailsPromises = results.map(async (item: any) => {
        if (item.tmdb_id) {
           return await tmdbService.getDetails(Number(item.tmdb_id), 'tv');
        }
        return null;
      });

      const detailsResponses = await Promise.all(detailsPromises);
      return detailsResponses.filter((item): item is MediaItem => item !== null);
    } catch (error) {
      console.error("Error fetching latest vidsrc tv shows", error);
      return [];
    }
  }
};
