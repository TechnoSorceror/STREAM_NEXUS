import re

with open("pages/Details.tsx", "r") as f:
    content = f.read()

pattern = r'const url = generateEmbedUrl\(media, playState\);\s*return \(\s*<div className="w-full h-full bg-black rounded-lg overflow-hidden relative group">\s*<iframe'

replacement = r'''const url = generateEmbedUrl(media, playState);
    if (!url) return <div className="w-full h-full bg-nexus-900 flex items-center justify-center flex-col text-gray-500 text-sm"><Video size={48} className="mb-4 opacity-50" /><span>Unsupported source or missing metadata.</span></div>;
    return (
      <div className="w-full h-full bg-black rounded-lg overflow-hidden relative group"> 
         <iframe'''

content = re.sub(pattern, replacement, content)
with open("pages/Details.tsx", "w") as f:
    f.write(content)

# Fix Movies.tsx filter loading
with open("pages/Movies.tsx", "r") as f:
    m_content = f.read()

m_target = """  useEffect(() => {
    if (selectedGenreId === null) return;"""

m_replace = """  useEffect(() => {
    if (selectedGenreId === null) {
      setLoading(false);
      return;
    }"""

if m_target in m_content:
    m_content = m_content.replace(m_target, m_replace)
    with open("pages/Movies.tsx", "w") as f:
        f.write(m_content)

# Fix TVShows.tsx filter loading
with open("pages/TVShows.tsx", "r") as f:
    tv_content = f.read()

if m_target in tv_content:
    tv_content = tv_content.replace(m_target, m_replace)
    with open("pages/TVShows.tsx", "w") as f:
        f.write(tv_content)

print("Fixed")
