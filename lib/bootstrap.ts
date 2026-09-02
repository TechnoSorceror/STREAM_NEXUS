import { MediaItem } from '../types';

interface StreamNexusBootstrap {
  home?: {
    trendingMovies?: MediaItem[];
  };
}

let cached: StreamNexusBootstrap | undefined;

export const getBootstrapData = (): StreamNexusBootstrap => {
  if (cached) return cached;
  if (typeof document === 'undefined') return {};
  const element = document.getElementById('streamnexus-bootstrap');
  if (!element?.textContent) return {};
  try {
    cached = JSON.parse(element.textContent) as StreamNexusBootstrap;
  } catch {
    cached = {};
  }
  return cached;
};

