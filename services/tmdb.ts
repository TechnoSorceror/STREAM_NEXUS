import { TMDB_BASE_URL, TMDB_IMAGE_BASE, TMDB_BACKDROP_BASE, DEFAULT_TMDB_API_KEY } from '../constants';
import { MediaItem, EpisodeInfo, SeasonInfo } from '../types';

const getApiKey = () => {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('sn_tmdb_key');
    if (localKey) return localKey;
  }
  return DEFAULT_TMDB_API_KEY;
};

const fetchTMDB = async (endpoint: string, params: Record<string, string> = {}) => {
  let apiKey = getApiKey();
  if (!apiKey) return { results: [] }; 
  
  let query = new URLSearchParams({ api_key: apiKey, ...params }).toString();
  const originalUrl = `${TMDB_BASE_URL}${endpoint}?${query}`;
  const altUrl = `https://api.tmdb.org/3${endpoint}?${query}`;
  
  const attemptFetch = async (url: string) => {
    let res = await fetch(url);
    
    // If unauthorized, the local key might be invalid. Clear it and retry with default.
    if (res.status === 401 && typeof window !== 'undefined') {
        const localKey = localStorage.getItem('sn_tmdb_key');
        if (localKey) {
            localStorage.removeItem('sn_tmdb_key');
            apiKey = DEFAULT_TMDB_API_KEY;
            query = new URLSearchParams({ api_key: apiKey, ...params }).toString();
            
            // Re-construct the URL appropriately
            let retryUrl = url;
            if (url.includes('api.themoviedb.org')) {
                retryUrl = `https://api.themoviedb.org/3${endpoint}?${query}`;
            } else if (url.includes('api.tmdb.org')) {
                retryUrl = `https://api.tmdb.org/3${endpoint}?${query}`;
            } else if (url.includes('allorigins.win')) {
                const inner = `https://api.themoviedb.org/3${endpoint}?${query}`;
                retryUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(inner)}`;
            } else if (url.includes('corsproxy.io')) {
                const inner = `https://api.themoviedb.org/3${endpoint}?${query}`;
                retryUrl = `https://corsproxy.io/?url=${encodeURIComponent(inner)}`;
            }
            res = await fetch(retryUrl);
        }
    }
    return res;
  };

  const fallbacks = [
    originalUrl,
    altUrl, // Try official alt domain first
    `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(originalUrl)}`
  ];

  for (let i = 0; i < fallbacks.length; i++) {
    try {
      let res = await attemptFetch(fallbacks[i]);
      if (res.ok) {
        return await res.json();
      } else if (res.status === 429) {
        // Rate limited, try next
        console.warn(`TMDB Fetch Rate Limited (429) on fallback ${i}`);
        continue;
      } else {
        // Not a network error but a response error (e.g., 404), return empty
        console.warn(`TMDB Fetch Error on fallback ${i}: ${res.status} ${res.statusText}`);
        return {};
      }
    } catch (error) {
      console.warn(`TMDB Fetch Network Error on fallback ${i}. Trying next...`, error);
      // Try next fallback
    }
  }
  
  console.error("All TMDB fetch attempts failed.");
  return {};
};

const mapTMDBToMedia = (item: any, type: 'movie' | 'tv'): MediaItem => ({
  id: item.id,
  tmdbId: item.id,
  title: item.title || item.name,
  poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : 'https://picsum.photos/300/450?grayscale',
  banner: item.backdrop_path ? `${TMDB_BACKDROP_BASE}${item.backdrop_path}` : undefined,
  description: item.overview,
  rating: item.vote_average,
  releaseDate: item.release_date || item.first_air_date || 'N/A',
  type,
  genres: [], // Populated in details
  status: 'Released'
});

export const tmdbService = {
  getGenres: async (type: 'movie' | 'tv'): Promise<{ id: number; name: string }[]> => {
    const data = await fetchTMDB(`/genre/${type}/list`);
    return data.genres || [];
  },

  getTrending: async (type: 'movie' | 'tv'): Promise<MediaItem[]> => {
    const data = await fetchTMDB(`/trending/${type}/day`);
    return (data.results || []).map((i: any) => mapTMDBToMedia(i, type));
  },

  getPopular: async (type: 'movie' | 'tv'): Promise<MediaItem[]> => {
    const data = await fetchTMDB(`/${type}/popular`);
    return (data.results || []).map((i: any) => mapTMDBToMedia(i, type));
  },

  getTopRated: async (type: 'movie' | 'tv'): Promise<MediaItem[]> => {
    const data = await fetchTMDB(`/${type}/top_rated`);
    return (data.results || []).map((i: any) => mapTMDBToMedia(i, type));
  },

  getByGenre: async (type: 'movie' | 'tv', genreId: number, year?: string, minRating?: number): Promise<MediaItem[]> => {
    const params: any = {
        with_genres: genreId.toString(),
        sort_by: 'popularity.desc'
    };
    
    if (year) {
        if (type === 'movie') params.primary_release_year = year;
        else params.first_air_date_year = year;
    }
    
    if (minRating && minRating > 0) {
        params['vote_average.gte'] = minRating.toString();
        params['vote_count.gte'] = '50'; // Need some minimum votes so obscure things don't show up with 1 vote of 10
    }
    
    const data = await fetchTMDB(`/discover/${type}`, params);
    return (data.results || []).map((i: any) => mapTMDBToMedia(i, type));
  },

  getByLanguage: async (type: 'movie' | 'tv', languageCode: string): Promise<MediaItem[]> => {
    const data = await fetchTMDB(`/discover/${type}`, { 
        with_original_language: languageCode,
        sort_by: 'popularity.desc'
    });
    return (data.results || []).map((i: any) => mapTMDBToMedia(i, type));
  },

  getByYear: async (type: 'movie' | 'tv', year: number): Promise<MediaItem[]> => {
    const params: Record<string, string> = { sort_by: 'popularity.desc' };
    if (type === 'movie') {
        params.primary_release_year = year.toString();
    } else {
        params.first_air_date_year = year.toString();
    }
    const data = await fetchTMDB(`/discover/${type}`, params);
    return (data.results || []).map((i: any) => mapTMDBToMedia(i, type));
  },

  getDetails: async (id: number, type: 'movie' | 'tv'): Promise<MediaItem | null> => {
    try {
      const data = await fetchTMDB(`/${type}/${id}`, { append_to_response: 'external_ids,genres,videos' });
      if (!data || !data.id) return null;
      
      const base = mapTMDBToMedia(data, type);
      const trailer = data.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key;

      return {
        ...base,
        imdbId: data.external_ids?.imdb_id,
        genres: data.genres?.map((g: any) => g.name) || [],
        seasons: type === 'tv' ? data.number_of_seasons : undefined,
        episodes: type === 'tv' ? data.number_of_episodes : undefined,
        status: data.status,
        collectionId: data.belongs_to_collection?.id,
        collectionName: data.belongs_to_collection?.name,
        trailerUrl: trailer ? `https://www.youtube.com/embed/${trailer}?autoplay=1&mute=0` : undefined
      };
    } catch (e) {
      return null;
    }
  },

  getSeason: async (tmdbId: number, seasonNumber: number): Promise<{ info: SeasonInfo, episodes: EpisodeInfo[] }> => {
    try {
      const data = await fetchTMDB(`/tv/${tmdbId}/season/${seasonNumber}`);
      if (!data) return { info: {} as SeasonInfo, episodes: [] };

      const episodes = (data.episodes || []).map((ep: any) => ({
        id: ep.id,
        episode_number: ep.episode_number,
        name: ep.name,
        overview: ep.overview,
        still_path: ep.still_path ? `${TMDB_IMAGE_BASE}${ep.still_path}` : undefined,
        air_date: ep.air_date
      }));
      
      return { 
          info: {
              id: data.id,
              name: data.name,
              season_number: data.season_number,
              episode_count: episodes.length,
              air_date: data.air_date,
              poster_path: data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : undefined
          }, 
          episodes 
      };
    } catch (e) {
      return { info: {} as SeasonInfo, episodes: [] };
    }
  },

  getCollection: async (collectionId: number): Promise<MediaItem[]> => {
      const data = await fetchTMDB(`/collection/${collectionId}`);
      if (!data || !data.parts) return [];
      
      const sortedParts = data.parts.sort((a: any, b: any) => {
          return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
      });

      return sortedParts.map((i: any) => mapTMDBToMedia(i, 'movie'));
  },

  getRecommendations: async (id: number, type: 'movie' | 'tv'): Promise<MediaItem[]> => {
    try {
      const data = await fetchTMDB(`/${type}/${id}/recommendations`);
      return (data.results || []).map((i: any) => mapTMDBToMedia(i, type));
    } catch (e) {
      return [];
    }
  },

  searchMulti: async (query: string): Promise<MediaItem[]> => {
    const data = await fetchTMDB(`/search/multi`, { query });
    return (data.results || [])
      .filter((i: any) => i.media_type === 'movie' || i.media_type === 'tv')
      .map((i: any) => mapTMDBToMedia(i, i.media_type));
  },

  search: async (query: string, type: 'movie' | 'tv'): Promise<MediaItem[]> => {
    const data = await fetchTMDB(`/search/${type}`, { query });
    return (data.results || []).map((i: any) => mapTMDBToMedia(i, type));
  }
};