import { TMDB_IMAGE_BASE, TMDB_BACKDROP_BASE } from '../constants';
import { MediaItem, EpisodeInfo, PersonCredit, PersonDetails, SeasonInfo } from '../types';

const REQUEST_TIMEOUT_MS = 10_000;

const fetchWithTimeout = async (url: string) => {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
  } finally {
    globalThis.clearTimeout(timeout);
  }
};

const fetchTMDB = async (endpoint: string, params: Record<string, string> = {}) => {
  const publicQuery = new URLSearchParams(params).toString();
  try {
    const response = await fetchWithTimeout(`/api/tmdb${endpoint}${publicQuery ? `?${publicQuery}` : ''}`);
    if (!response.ok) throw new Error(`TMDB request failed (${response.status})`);
    return await response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('TMDB request timed out');
    throw error;
  }
};

const movieGenres: Record<number, string> = { 28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction', 53: 'Thriller', 10752: 'War', 37: 'Western' };
const tvGenres: Record<number, string> = { 10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family', 10762: 'Kids', 9648: 'Mystery', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics', 37: 'Western' };

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
  genres: (item.genre_ids || []).map((id: number) => (type === 'movie' ? movieGenres : tvGenres)[id]).filter(Boolean),
  status: 'Released'
});

const mapCredit = (person: any, role?: string): PersonCredit => ({
  id: person.id,
  name: person.name,
  role: role || person.character || person.job,
  profile: person.profile_path ? `${TMDB_IMAGE_BASE}${person.profile_path}` : undefined
});

const pickAgeRating = (data: any, type: 'movie' | 'tv') => {
  if (type === 'movie') {
    const us = data.release_dates?.results?.find((entry: any) => entry.iso_3166_1 === 'US');
    return us?.release_dates?.find((entry: any) => entry.certification)?.certification || undefined;
  }
  return data.content_ratings?.results?.find((entry: any) => entry.iso_3166_1 === 'US')?.rating || undefined;
};

const ANIME_MAP_KEY = 'streamnexus_anime_tmdb_map_v1';

type AnimeMap = Record<string, { tmdbId: number; type: 'movie' | 'tv'; season?: number }>;

const readAnimeMap = (): AnimeMap => {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(ANIME_MAP_KEY) || '{}'); }
  catch { return {}; }
};

const writeAnimeMap = (map: AnimeMap) => {
  if (typeof window !== 'undefined') localStorage.setItem(ANIME_MAP_KEY, JSON.stringify(map));
};

const normalizeTitle = (value = '') => value
  .toLocaleLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\b(?:season|part|cour)\s*\d+\b/g, '')
  .replace(/\b\d+(?:st|nd|rd|th)\s+season\b/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const inferAnimeSeason = (anime: MediaItem) => {
  const titles = [anime.title, anime.romajiTitle, anime.nativeTitle, ...(anime.synonyms || [])].filter(Boolean).join(' ');
  const direct = titles.match(/\b(?:season|part)\s*(\d+)\b/i)?.[1];
  const ordinal = titles.match(/\b(\d+)(?:st|nd|rd|th)\s+season\b/i)?.[1];
  return Number(direct || ordinal || 1);
};

const scoreAnimeCandidate = (candidate: any, anime: MediaItem) => {
  const sourceTitles = [anime.title, anime.romajiTitle, anime.nativeTitle, ...(anime.synonyms || [])]
    .filter(Boolean)
    .map(title => normalizeTitle(String(title)))
    .filter(Boolean);
  const candidateTitles = [candidate.title, candidate.name, candidate.original_title, candidate.original_name]
    .filter(Boolean)
    .map((title: string) => normalizeTitle(title));

  let score = 0;
  if (sourceTitles.some(title => candidateTitles.includes(title))) score += 75;
  else if (sourceTitles.some(title => candidateTitles.some(other => title.includes(other) || other.includes(title)))) score += 42;

  const animeYear = Number(anime.releaseDate?.slice(0, 4));
  const candidateYear = Number((candidate.release_date || candidate.first_air_date || '').slice(0, 4));
  if (animeYear && candidateYear) {
    const difference = Math.abs(animeYear - candidateYear);
    if (difference === 0) score += 24;
    else if (difference === 1) score += 12;
    else if (difference > 3) score -= 18;
  }
  if (candidate.original_language === 'ja') score += 10;
  if (candidate.genre_ids?.includes(16)) score += 12;
  if (candidate.poster_path) score += 3;
  return score;
};

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
      const data = await fetchTMDB(`/${type}/${id}`, { append_to_response: 'external_ids,videos,credits,release_dates,content_ratings' });
      if (!data || !data.id) return null;
      
      const base = mapTMDBToMedia(data, type);
      const trailer = data.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key;

      return {
        ...base,
        imdbId: data.external_ids?.imdb_id,
        genres: data.genres?.map((g: any) => g.name) || [],
        originalLanguage: data.original_language,
        originCountries: (data.production_countries?.length ? data.production_countries : data.origin_country || []).map((country: any) => typeof country === 'string' ? country : country.name || country.iso_3166_1),
        runtime: type === 'movie' ? data.runtime : data.episode_run_time?.[0],
        tagline: data.tagline || undefined,
        ageRating: pickAgeRating(data, type),
        voteCount: data.vote_count,
        directors: type === 'movie' ? (data.credits?.crew || []).filter((person: any) => person.job === 'Director').slice(0, 5).map((person: any) => mapCredit(person, 'Director')) : undefined,
        creators: type === 'tv' ? (data.created_by || []).map((person: any) => mapCredit(person, 'Creator')) : undefined,
        cast: (data.credits?.cast || []).slice(0, 12).map((person: any) => mapCredit(person)),
        seasons: type === 'tv' ? data.number_of_seasons : undefined,
        episodes: type === 'tv' ? data.number_of_episodes : undefined,
        status: data.status,
        collectionId: data.belongs_to_collection?.id,
        collectionName: data.belongs_to_collection?.name,
        trailerUrl: trailer ? `https://www.youtube.com/embed/${trailer}?autoplay=1&mute=0` : undefined
      };
    } catch {
      return null;
    }
  },

  resolveAnime: async (anime: MediaItem): Promise<MediaItem | null> => {
    if (!anime.anilistId) return null;
    const cached = readAnimeMap()[String(anime.anilistId)];
    const targetType: 'movie' | 'tv' = anime.format === 'MOVIE' ? 'movie' : 'tv';
    let match = cached && cached.type === targetType ? cached : null;

    if (!match) {
      const titles = [anime.title, anime.romajiTitle, ...(anime.synonyms || [])]
        .filter((title, index, list) => Boolean(title) && list.indexOf(title) === index)
        .slice(0, 4) as string[];
      const candidates = new Map<number, any>();

      for (const title of titles) {
        const data = await fetchTMDB(`/search/${targetType}`, { query: title, include_adult: 'false' });
        (data.results || []).forEach((candidate: any) => candidates.set(candidate.id, candidate));
        if (candidates.size >= 20) break;
      }

      const ranked = [...candidates.values()]
        .map(candidate => ({ candidate, score: scoreAnimeCandidate(candidate, anime) }))
        .sort((a, b) => b.score - a.score);
      if (!ranked.length || ranked[0].score < 48) return null;

      match = { tmdbId: ranked[0].candidate.id, type: targetType, season: targetType === 'tv' ? inferAnimeSeason(anime) : undefined };
      const map = readAnimeMap();
      map[String(anime.anilistId)] = match;
      writeAnimeMap(map);
    }

    const details = await tmdbService.getDetails(match.tmdbId, match.type);
    if (!details) return null;

    return {
      ...anime,
      tmdbId: match.tmdbId,
      tmdbMediaType: match.type,
      tmdbSeason: match.season,
      imdbId: details.imdbId,
      poster: details.poster || anime.poster,
      banner: details.banner || anime.banner,
      description: details.description || anime.description,
      genres: details.genres?.length ? details.genres : anime.genres,
      status: details.status || anime.status,
      originalLanguage: details.originalLanguage || anime.originalLanguage,
      originCountries: details.originCountries || (anime.countryOfOrigin ? [anime.countryOfOrigin] : undefined),
      runtime: details.runtime || anime.duration,
      ageRating: details.ageRating,
      directors: details.directors,
      creators: details.creators,
      cast: details.cast,
      seasons: match.type === 'tv' ? details.seasons : undefined,
      episodes: match.type === 'tv' ? details.episodes : undefined,
      trailerUrl: details.trailerUrl || anime.trailerUrl,
      type: 'anime'
    };
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
    } catch {
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
    } catch {
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
  },

  getPersonDetails: async (id: number): Promise<PersonDetails | null> => {
    try {
      const data = await fetchTMDB(`/person/${id}`, { append_to_response: 'combined_credits' });
      if (!data?.id) return null;
      const credits = (data.combined_credits?.cast || [])
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
        .filter((item: any, index: number, list: any[]) => list.findIndex(other => other.id === item.id && other.media_type === item.media_type) === index)
        .slice(0, 30)
        .map((item: any) => mapTMDBToMedia(item, item.media_type));
      return {
        id: data.id,
        name: data.name,
        biography: data.biography || '',
        birthday: data.birthday || undefined,
        deathday: data.deathday || undefined,
        placeOfBirth: data.place_of_birth || undefined,
        knownFor: data.known_for_department || undefined,
        profile: data.profile_path ? `${TMDB_IMAGE_BASE}${data.profile_path}` : undefined,
        credits
      };
    } catch {
      return null;
    }
  }
};
