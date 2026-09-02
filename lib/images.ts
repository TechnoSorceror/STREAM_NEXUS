const TMDB_IMAGE_PATTERN = /^(https:\/\/image\.tmdb\.org\/t\/p\/)(?:w\d+|original)(\/.*)$/i;

const resizeTmdbImage = (url: string | undefined, size: string) => {
  if (!url) return undefined;
  return TMDB_IMAGE_PATTERN.test(url) ? url.replace(TMDB_IMAGE_PATTERN, `$1${size}$2`) : url;
};

const srcSet = (url: string | undefined, variants: Array<[string, number]>) => {
  if (!url || !TMDB_IMAGE_PATTERN.test(url)) return undefined;
  return variants.map(([size, width]) => `${resizeTmdbImage(url, size)} ${width}w`).join(', ');
};

export const posterSrc = (url: string) => resizeTmdbImage(url, 'w342') || url;
export const posterSrcSet = (url: string) => srcSet(url, [['w185', 185], ['w342', 342], ['w500', 500]]);
export const backdropSrc = (url: string) => resizeTmdbImage(url, 'w1280') || url;
export const backdropSrcSet = (url: string) => srcSet(url, [['w780', 780], ['w1280', 1280], ['original', 1920]]);

