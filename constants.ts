export const TMDB_BASE_URL = 'https://api.tmdb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
export const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

export const ANILIST_API_URL = 'https://graphql.anilist.co';

export const VIDSRC_BASE = 'https://vidsrc.icu/embed';
export const VIDSRC_RU_BASE = 'https://vidsrc-embed.ru/embed';
export const VIDSRC_SBS_BASE = 'https://vidsrc.sbs/embed';

// NOTE: In a real production app, keys should be on the server. 
// For this client-side demo, we rely on the user inputting a key or using a demo key if available.
export const STORAGE_KEYS = {
  TMDB_API_KEY: 'sn_tmdb_key',
  WATCH_HISTORY: 'sn_history'
};

// Provided key for seamless demo experience
export const DEFAULT_TMDB_API_KEY = '68d2c10d17c83f4187dacb843a73adb5';