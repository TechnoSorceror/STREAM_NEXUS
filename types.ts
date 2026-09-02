export type MediaType = 'movie' | 'tv' | 'anime' | 'manga';

export interface PersonCredit {
  id: number;
  name: string;
  role?: string;
  profile?: string;
}

export interface MediaItem {
  id: string | number;
  tmdbId?: number;
  tmdbMediaType?: 'movie' | 'tv';
  tmdbSeason?: number;
  imdbId?: string;
  anilistId?: number;
  title: string;
  poster: string;
  banner?: string;
  description: string;
  rating: number;
  releaseDate: string;
  type: MediaType;
  genres: string[];
  status?: string;
  format?: string;
  romajiTitle?: string;
  nativeTitle?: string;
  synonyms?: string[];
  season?: string;
  seasonYear?: number;
  countryOfOrigin?: string;
  duration?: number;
  studios?: string[];
  originalLanguage?: string;
  originCountries?: string[];
  runtime?: number;
  tagline?: string;
  ageRating?: string;
  directors?: PersonCredit[];
  creators?: PersonCredit[];
  cast?: PersonCredit[];
  voteCount?: number;
  // TV specific
  seasons?: number; // Total number of seasons
  episodes?: number; // Total episodes (or per season count in some contexts)
  // Anime/Manga specific
  nextAiringEpisode?: number;
  // Collection specific (Movies)
  collectionId?: number;
  collectionName?: string;
  // Manga specific
  chapters?: number;
  // Progress tracking
  progress?: {
    season?: number;
    episode?: number;
    chapter?: number;
  };
  trailerUrl?: string;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday?: string;
  deathday?: string;
  placeOfBirth?: string;
  knownFor?: string;
  profile?: string;
  credits: MediaItem[];
}

export interface SeasonInfo {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string;
  poster_path?: string;
}

export interface EpisodeInfo {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path?: string;
  air_date: string;
}

// State for the player/reader
export interface PlaybackState {
  isPlaying: boolean;
  season: number;
  episode: number;
  chapter: number;
  isDub: boolean; // 0 = sub, 1 = dub
  server: 1 | 2; // 1 = VidSrc ICU, 2 = VidSrc Embed RU
}

export type WatchStatus = 'watching' | 'plan_to_watch' | 'completed' | 'on_hold' | 'dropped';

export interface SearchFilters {
  query: string;
  type: MediaType | 'all';
  year?: string;
  minRating?: number;
}
