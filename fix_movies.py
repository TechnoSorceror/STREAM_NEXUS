import re
import glob

for filename in ['pages/Movies.tsx', 'pages/TVShows.tsx', 'pages/MyList.tsx', 'pages/Search.tsx']:
    with open(filename, "r") as f:
        content = f.read()

    # Layout fixes
    content = content.replace('pt-24 pb-20 px-4 max-w-7xl mx-auto space-y-6', 'pt-8 pb-20 shell space-y-12 bg-nexus-ink text-nexus-text font-mono')
    content = content.replace('text-3xl font-bold text-nexus-text mb-6 border-l-4 border-nexus-lime pl-3', 'font-sans text-[clamp(1.7rem,3vw,2.6rem)] tracking-[-0.045em] mb-6 text-nexus-text')
    
    with open(filename, "w") as f:
        f.write(content)
print("Pages layout updated")
