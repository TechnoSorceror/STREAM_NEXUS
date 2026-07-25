import { ANILIST_API_URL } from '../constants';
import { MediaItem } from '../types';

let requestQueue: Promise<void> = Promise.resolve();

const performFetch = async (query: string, variables: any) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const res = await new Promise<Response>((resolve, reject) => {
    requestQueue = requestQueue.then(async () => {
      try {
        // Delay between AniList requests to avoid triggering the IP rate limit
        await new Promise(r => setTimeout(r, 250));
        const response = await fetch(ANILIST_API_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query, variables }),
        });
        resolve(response);
      } catch (err) {
        reject(err);
      }
    });
  });

  return res;
};

const graphQLRequest = async (query: string, variables: any = {}) => {
  let res = await performFetch(query, variables);
  
  if (!res.ok) {
    console.warn("AniList Request Failed", res.status);
    // Return empty structure to prevent app crash
    return { data: { Page: { media: [] } } };
  }

  return res.json();
};

const mapAniListToMedia = (item: any, type: 'anime' | 'manga'): MediaItem => ({
  id: item.id,
  anilistId: item.id,
  title: item.title.english || item.title.romaji || 'Unknown Title',
  poster: item.coverImage.large,
  banner: item.bannerImage,
  description: item.description?.replace(/<[^>]*>?/gm, '') || '', // Strip HTML
  rating: item.averageScore ? item.averageScore / 10 : 0,
  releaseDate: item.startDate.year ? `${item.startDate.year}-${item.startDate.month || '01'}-${item.startDate.day || '01'}` : 'N/A',
  type,
  genres: item.genres || [],
  status: item.status,
  episodes: item.episodes || 0, // Total episodes
  chapters: item.chapters || 0, // Total chapters
  trailerUrl: item.trailer?.site === 'youtube' ? `https://www.youtube.com/embed/${item.trailer.id}?autoplay=1&mute=0` : undefined,
});

const MEDIA_QUERY = `
  query ($id: Int, $search: String, $type: MediaType, $sort: [MediaSort]) {
    Page(page: 1, perPage: 20) {
      media(id: $id, search: $search, type: $type, sort: $sort) {
        id
        title {
          romaji
          english
        }
        coverImage {
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
        episodes
        chapters
        trailer {
          id
          site
        }
      }
    }
  }
`;

export const anilistService = {
  getTrending: async (type: 'anime' | 'manga'): Promise<MediaItem[]> => {
    try {
      const data = await graphQLRequest(MEDIA_QUERY, {
        type: type.toUpperCase(),
        sort: ['TRENDING_DESC', 'POPULARITY_DESC']
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
        sort: ['POPULARITY_DESC']
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
        sort: ['SCORE_DESC', 'TRENDING_DESC']
      });
      return data.data?.Page?.media?.map((i: any) => mapAniListToMedia(i, type)) || [];
    } catch (e) {
      console.error("AniList Top Rated Error", e);
      return [];
    }
  },

  getByGenre: async (type: 'anime' | 'manga', genre: string): Promise<MediaItem[]> => {
    const GENRE_QUERY = `
      query ($type: MediaType, $genre: String, $sort: [MediaSort]) {
        Page(page: 1, perPage: 20) {
          media(type: $type, genre: $genre, sort: $sort) {
            id
            title {
              romaji
              english
            }
            coverImage {
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
            episodes
            chapters
            trailer {
              id
              site
            }
          }
        }
      }
    `;
    try {
      const data = await graphQLRequest(GENRE_QUERY, {
        type: type.toUpperCase(),
        genre,
        sort: ['TRENDING_DESC', 'POPULARITY_DESC']
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
        type: type.toUpperCase()
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
        sort: ['POPULARITY_DESC']
      });
      return data.data?.Page?.media?.map((i: any) => mapAniListToMedia(i, type)) || [];
    } catch (e) {
      console.error("AniList Search Error", e);
      return [];
    }
  }
};