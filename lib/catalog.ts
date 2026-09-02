export interface GenreLandingDefinition {
  type: 'movie' | 'tv';
  id: number;
  slug: string;
  name: string;
  title: string;
  intro: string;
}

export const GENRE_LANDINGS: GenreLandingDefinition[] = [
  { type: 'movie', id: 28, slug: 'action', name: 'Action', title: 'Action movies', intro: 'Browse action films built around chases, combat, rescues, and high-stakes missions. Each title links to its story summary, cast, release details, trailer, and viewing options.' },
  { type: 'movie', id: 35, slug: 'comedy', name: 'Comedy', title: 'Comedy movies', intro: 'Find comedies across sharp satire, character-driven humor, romantic comedy, and broad crowd-pleasers. Compare release years, story summaries, casts, and related films.' },
  { type: 'movie', id: 18, slug: 'drama', name: 'Drama', title: 'Drama movies', intro: 'Explore dramatic films centered on consequential choices, relationships, personal conflict, and social change, with concise context for choosing what to watch next.' },
  { type: 'movie', id: 27, slug: 'horror', name: 'Horror', title: 'Horror movies', intro: 'Discover supernatural, psychological, creature, and survival horror. Use the title pages to review premise, age rating when verified, cast, runtime, and related stories.' },
  { type: 'movie', id: 10749, slug: 'romance', name: 'Romance', title: 'Romance movies', intro: 'Browse love stories ranging from intimate character pieces to romantic comedy and sweeping period drama, organized around useful title and release information.' },
  { type: 'movie', id: 878, slug: 'science-fiction', name: 'Science Fiction', title: 'Science-fiction movies', intro: 'Explore films about imagined technologies, space travel, altered societies, and first contact. Each listing leads to a factual overview and connected recommendations.' },
  { type: 'tv', id: 10759, slug: 'action-adventure', name: 'Action & Adventure', title: 'Action and adventure TV shows', intro: 'Find serialized adventures, mission-driven thrillers, and large-scale action shows, with season counts, episode navigation, cast, and series context.' },
  { type: 'tv', id: 35, slug: 'comedy', name: 'Comedy', title: 'Comedy TV shows', intro: 'Browse sitcoms, workplace comedies, animated humor, and genre hybrids. Series pages provide premises, seasons, episodes, cast, and similar shows.' },
  { type: 'tv', id: 80, slug: 'crime', name: 'Crime', title: 'Crime TV shows', intro: 'Explore investigations, legal dramas, organized-crime stories, and true-crime series, with clear series summaries and episode-level navigation.' },
  { type: 'tv', id: 18, slug: 'drama', name: 'Drama', title: 'Drama TV shows', intro: 'Discover character-led series and long-form stories across family, workplace, historical, and contemporary drama, organized for easy comparison.' },
  { type: 'tv', id: 9648, slug: 'mystery', name: 'Mystery', title: 'Mystery TV shows', intro: 'Browse puzzle-box series, detective stories, and slow-burn mysteries. Follow each result for series background, seasons, episode synopses, and cast.' },
  { type: 'tv', id: 10765, slug: 'science-fiction-fantasy', name: 'Sci-Fi & Fantasy', title: 'Science-fiction and fantasy TV shows', intro: 'Explore speculative series spanning future worlds, magic, alternate histories, and the supernatural, with clear season and episode context.' }
];

export const getGenreLanding = (type: 'movie' | 'tv', slug?: string) =>
  GENRE_LANDINGS.find(item => item.type === type && item.slug === slug);

export const getGenreLandingByName = (type: 'movie' | 'tv', name: string) =>
  GENRE_LANDINGS.find(item => item.type === type && item.name.toLowerCase() === name.toLowerCase());

