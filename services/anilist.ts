import { ANILIST_API_URL } from '../constants';
import { MediaItem } from '../types';

export interface AnimeBrowseFilters {
  genre?: string;
  format?: string;
  status?: string;
  season?: string;
  seasonYear?: number;
  year?: number;
  minScore?: number;
  sort?: string[];
  perPage?: number;
}

let requestQueue: Promise<void> = Promise.resolve();
const REQUEST_TIMEOUT_MS = 8_000;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

const wait = (milliseconds: number) => new Promise(resolve => globalThis.setTimeout(resolve, milliseconds));

const fetchOnce = async (query: string, variables: any) => {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal
    });
  } finally {
    globalThis.clearTimeout(timeout);
  }
};

const performFetch = async (query: string, variables: any) => {
  const request = requestQueue
    .catch(() => undefined)
    .then(async () => {
      // Keep individual catalog interactions below AniList's IP rate limit.
      await wait(180);
      let response = await fetchOnce(query, variables);
      if (RETRYABLE_STATUS.has(response.status)) {
        await wait(response.status === 429 ? 900 : 350);
        response = await fetchOnce(query, variables);
      }
      return response;
    });

  // Always recover the shared queue so one transient network error cannot
  // leave every later request pending forever.
  requestQueue = request.then(() => undefined, () => undefined);
  return request;
};

const graphQLRequest = async (query: string, variables: any = {}) => {
  try {
    const response = await performFetch(query, variables);
    if (!response.ok) throw new Error(`AniList request failed (${response.status})`);
    const payload = await response.json();
    if (payload.errors?.length && !payload.data) throw new Error('AniList returned a GraphQL error');
    return payload;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('AniList request timed out');
    throw error;
  }
};

const cleanDescription = (value?: string) => value
  ?.replace(/<br\s*\/?\s*>/gi, ' ')
  .replace(/<[^>]*>?/gm, '')
  .replace(/\s+/g, ' ')
  .trim() || '';

const mapAniListToMedia = (item: any, type: 'anime' | 'manga'): MediaItem => ({
  id: item.id,
  anilistId: item.id,
  title: item.title.english || item.title.romaji || 'Unknown Title',
  romajiTitle: item.title.romaji,
  nativeTitle: item.title.native,
  synonyms: item.synonyms || [],
  poster: item.coverImage.extraLarge || item.coverImage.large,
  banner: item.bannerImage || item.coverImage.extraLarge,
  description: cleanDescription(item.description),
  rating: item.averageScore ? item.averageScore / 10 : 0,
  releaseDate: item.startDate.year ? `${item.startDate.year}-${item.startDate.month || '01'}-${item.startDate.day || '01'}` : 'N/A',
  type,
  genres: item.genres || [],
  status: item.status,
  format: item.format,
  season: item.season,
  seasonYear: item.seasonYear,
  countryOfOrigin: item.countryOfOrigin,
  duration: item.duration,
  studios: item.studios?.nodes?.map((studio: any) => studio.name) || [],
  episodes: item.episodes || 0,
  chapters: item.chapters || 0,
  nextAiringEpisode: item.nextAiringEpisode?.episode,
  trailerUrl: item.trailer?.site === 'youtube' ? `https://www.youtube.com/embed/${item.trailer.id}?autoplay=1&mute=0` : undefined,
});

const MEDIA_QUERY = `
  query (
    $id: Int,
    $search: String,
    $type: MediaType,
    $format: MediaFormat,
    $status: MediaStatus,
    $season: MediaSeason,
    $seasonYear: Int,
    $genre: String,
    $averageScoreGreater: Int,
    $startDateGreater: FuzzyDateInt,
    $startDateLesser: FuzzyDateInt,
    $sort: [MediaSort],
    $perPage: Int
  ) {
    Page(page: 1, perPage: $perPage) {
      media(
        id: $id,
        search: $search,
        type: $type,
        format: $format,
        status: $status,
        season: $season,
        seasonYear: $seasonYear,
        genre: $genre,
        averageScore_greater: $averageScoreGreater,
        startDate_greater: $startDateGreater,
        startDate_lesser: $startDateLesser,
        sort: $sort,
        isAdult: false
      ) {
        id
        title {
          romaji
          english
          native
        }
        synonyms
        coverImage {
          extraLarge
          large
        }
        bannerImage
        description
        averageScore
        startDate {
          year
          month
          day
        }
        genres
        status
        format
        season
        seasonYear
        countryOfOrigin
        episodes
        chapters
        duration
        nextAiringEpisode { episode airingAt }
        studios(isMain: true) { nodes { name } }
        trailer {
          id
          site
        }
      }
    }
  }
`;

const ANIME_LANDING_QUERY = `
  query AnimeLanding($season: MediaSeason!, $seasonYear: Int!) {
    trending: Page(page: 1, perPage: 20) {
      media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: false) { ...LandingMedia }
    }
    currentSeason: Page(page: 1, perPage: 30) {
      media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: [POPULARITY_DESC, TRENDING_DESC], isAdult: false) { ...LandingMedia }
    }
    latest: Page(page: 1, perPage: 30) {
      media(type: ANIME, status: RELEASING, sort: [UPDATED_AT_DESC, POPULARITY_DESC], isAdult: false) { ...LandingMedia }
    }
    movies: Page(page: 1, perPage: 30) {
      media(type: ANIME, format: MOVIE, sort: [POPULARITY_DESC, SCORE_DESC], isAdult: false) { ...LandingMedia }
    }
    popular: Page(page: 1, perPage: 20) {
      media(type: ANIME, sort: [POPULARITY_DESC], isAdult: false) { ...LandingMedia }
    }
    topRated: Page(page: 1, perPage: 20) {
      media(type: ANIME, sort: [SCORE_DESC, TRENDING_DESC], isAdult: false) { ...LandingMedia }
    }
    action: Page(page: 1, perPage: 20) {
      media(type: ANIME, genre: "Action", sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: false) { ...LandingMedia }
    }
    romance: Page(page: 1, perPage: 20) {
      media(type: ANIME, genre: "Romance", sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: false) { ...LandingMedia }
    }
    fantasy: Page(page: 1, perPage: 20) {
      media(type: ANIME, genre: "Fantasy", sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: false) { ...LandingMedia }
    }
  }

  fragment LandingMedia on Media {
    id
    title { romaji english native }
    synonyms
    coverImage { extraLarge large }
    bannerImage
    description
    averageScore
    startDate { year month day }
    genres
    status
    format
    season
    seasonYear
    countryOfOrigin
    episodes
    chapters
    duration
    nextAiringEpisode { episode airingAt }
    studios(isMain: true) { nodes { name } }
    trailer { id site }
  }
`;

export interface AnimeLandingData {
  trending: MediaItem[];
  currentSeason: MediaItem[];
  latest: MediaItem[];
  movies: MediaItem[];
  popular: MediaItem[];
  topRated: MediaItem[];
  action: MediaItem[];
  romance: MediaItem[];
  fantasy: MediaItem[];
}

const emptyAnimeLanding = (): AnimeLandingData => ({
  trending: [], currentSeason: [], latest: [], movies: [], popular: [], topRated: [], action: [], romance: [], fantasy: []
});

export const anilistService = {
  getAnimeLanding: async (): Promise<AnimeLandingData> => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const season = month <= 3 ? 'WINTER' : month <= 6 ? 'SPRING' : month <= 9 ? 'SUMMER' : 'FALL';
      const result = await graphQLRequest(ANIME_LANDING_QUERY, { season, seasonYear: now.getFullYear() });
      const landing = emptyAnimeLanding();
      (Object.keys(landing) as Array<keyof AnimeLandingData>).forEach(key => {
        landing[key] = result.data?.[key]?.media?.map((item: any) => mapAniListToMedia(item, 'anime')) || [];
      });
      return landing;
    } catch (error) {
      console.error('AniList landing error', error);
      throw error;
    }
  },

  browseAnime: async (filters: AnimeBrowseFilters = {}): Promise<MediaItem[]> => {
    try {
      const year = filters.year;
      const data = await graphQLRequest(MEDIA_QUERY, {
        type: 'ANIME',
        genre: filters.genre || undefined,
        format: filters.format || undefined,
        status: filters.status || undefined,
        season: filters.season || undefined,
        seasonYear: filters.season && filters.seasonYear ? filters.seasonYear : undefined,
        averageScoreGreater: filters.minScore ? filters.minScore - 1 : undefined,
        startDateGreater: year ? year * 10000 + 101 : undefined,
        startDateLesser: year ? year * 10000 + 1231 : undefined,
        sort: filters.sort || ['TRENDING_DESC', 'POPULARITY_DESC'],
        perPage: filters.perPage || 30
      });
      return data.data?.Page?.media?.map((item: any) => mapAniListToMedia(item, 'anime')) || [];
    } catch (error) {
      console.error('AniList Browse Error', error);
      throw error;
    }
  },

  getCurrentSeason: async (): Promise<MediaItem[]> => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const season = month <= 3 ? 'WINTER' : month <= 6 ? 'SPRING' : month <= 9 ? 'SUMMER' : 'FALL';
    return anilistService.browseAnime({ season, seasonYear: now.getFullYear(), sort: ['POPULARITY_DESC', 'TRENDING_DESC'] });
  },

  getLatestAnime: async (): Promise<MediaItem[]> => anilistService.browseAnime({
    status: 'RELEASING',
    sort: ['UPDATED_AT_DESC', 'POPULARITY_DESC']
  }),

  getAnimeMovies: async (): Promise<MediaItem[]> => anilistService.browseAnime({
    format: 'MOVIE',
    sort: ['POPULARITY_DESC', 'SCORE_DESC']
  }),

  getTrending: async (type: 'anime' | 'manga'): Promise<MediaItem[]> => {
    try {
      const data = await graphQLRequest(MEDIA_QUERY, {
        type: type.toUpperCase(),
        sort: ['TRENDING_DESC', 'POPULARITY_DESC'],
        perPage: 20
      });
      return data.data?.Page?.media?.map((i: any) => mapAniListToMedia(i, type)) || [];
    } catch (e) {
      console.error("AniList Trending Error", e);
      return [];
    }
  },

  getPopular: async (type: 'anime' | 'manga'): Promise<MediaItem[]> => {
    try {
      const data = await graphQLRequest(MEDIA_QUERY, {
        type: type.toUpperCase(),
        sort: ['POPULARITY_DESC'],
        perPage: 20
      });
      return data.data?.Page?.media?.map((i: any) => mapAniListToMedia(i, type)) || [];
    } catch (e) {
      console.error("AniList Popular Error", e);
      return [];
    }
  },

  getTopRated: async (type: 'anime' | 'manga'): Promise<MediaItem[]> => {
    try {
      const data = await graphQLRequest(MEDIA_QUERY, {
        type: type.toUpperCase(),
        sort: ['SCORE_DESC', 'TRENDING_DESC'],
        perPage: 20
      });
      return data.data?.Page?.media?.map((i: any) => mapAniListToMedia(i, type)) || [];
    } catch (e) {
      console.error("AniList Top Rated Error", e);
      return [];
    }
  },

  getByGenre: async (type: 'anime' | 'manga', genre: string): Promise<MediaItem[]> => {
    try {
      const data = await graphQLRequest(MEDIA_QUERY, {
        type: type.toUpperCase(),
        genre,
        sort: ['TRENDING_DESC', 'POPULARITY_DESC'],
        perPage: 20
      });
      return data.data?.Page?.media?.map((i: any) => mapAniListToMedia(i, type)) || [];
    } catch (e) {
      console.error(`AniList ${genre} Error`, e);
      return [];
    }
  },

  getDetails: async (id: number, type: 'anime' | 'manga'): Promise<MediaItem | null> => {
    try {
      const data = await graphQLRequest(MEDIA_QUERY, {
        id,
        type: type.toUpperCase(),
        perPage: 1
      });
      const item = data.data?.Page?.media?.[0];
      return item ? mapAniListToMedia(item, type) : null;
    } catch (e) {
      console.error("AniList Details Error", e);
      return null;
    }
  },

  search: async (query: string, type: 'anime' | 'manga'): Promise<MediaItem[]> => {
    try {
      const data = await graphQLRequest(MEDIA_QUERY, {
        search: query,
        type: type.toUpperCase(),
        sort: ['POPULARITY_DESC'],
        perPage: 20
      });
      return data.data?.Page?.media?.map((i: any) => mapAniListToMedia(i, type)) || [];
    } catch (e) {
      console.error("AniList Search Error", e);
      throw e;
    }
  }
};
