import sys

with open("services/tmdb.ts", "r") as f:
    content = f.read()

target = """const fetchTMDB = async (endpoint: string, params: Record<string, string> = {}) => {
  let apiKey = getApiKey();
  if (!apiKey) return { results: [] }; 
  
  let query = new URLSearchParams({ api_key: apiKey, ...params }).toString();
  const directUrl = `${TMDB_BASE_URL}${endpoint}?${query}`;
  
  const attemptFetch = async (url: string) => {
    let res = await fetch(url);
    
    // If unauthorized, the local key might be invalid. Clear it and retry with default.
    if (res.status === 401 && typeof window !== 'undefined') {
        const localKey = localStorage.getItem('sn_tmdb_key');
        if (localKey) {
            localStorage.removeItem('sn_tmdb_key');
            apiKey = DEFAULT_TMDB_API_KEY;
            query = new URLSearchParams({ api_key: apiKey, ...params }).toString();
            // Re-construct the URL appropriately whether it was proxied or not
            const newDirectUrl = `${TMDB_BASE_URL}${endpoint}?${query}`;
            const isProxied = url.includes('corsproxy.io');
            const retryUrl = isProxied ? `https://corsproxy.io/?url=${encodeURIComponent(newDirectUrl)}` : newDirectUrl;
            res = await fetch(retryUrl);
        }
    }
    return res;
  };

  try {
    let res = await attemptFetch(directUrl);
    
    if (!res.ok) {
        console.warn(`TMDB Fetch Error: ${res.status} ${res.statusText}`);
        return {}; 
    }
    return res.json();
  } catch (error) {
    console.warn("Direct fetch failed, likely due to ISP/DNS blocking. Attempting proxy fallback...", error);
    try {
      const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(directUrl)}`;
      let proxyRes = await attemptFetch(proxyUrl);
      
      if (!proxyRes.ok) {
         console.warn(`TMDB Proxy Fetch Error: ${proxyRes.status} ${proxyRes.statusText}`);
         return {};
      }
      return proxyRes.json();
    } catch (proxyError) {
      console.error("Network error (even with proxy):", proxyError);
      return {};
    }
  }
};"""

replacement = """const fetchTMDB = async (endpoint: string, params: Record<string, string> = {}) => {
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
};"""

if target in content:
    content = content.replace(target, replacement)
    with open("services/tmdb.ts", "w") as f:
        f.write(content)
    print("Done tmdb.ts")
else:
    print("Target not found in tmdb.ts")
