import re

with open("pages/Details.tsx", "r") as f:
    content = f.read()

target = """  const renderEmbed = () => {
    if (!media) return null;
    const url = generateEmbedUrl(media, playState);
    return (
      <div className="w-full h-full bg-black rounded-lg overflow-hidden relative group"> 
         <iframe"""

replacement = """  const renderEmbed = () => {
    if (!media) return null;
    const url = generateEmbedUrl(media, playState);
    if (!url) {
      return (
         <div className="w-full h-full bg-nexus-900 rounded-lg overflow-hidden relative group flex items-center justify-center flex-col text-gray-500 text-sm">
             <Video size={48} className="mb-4 opacity-50" />
             <span>Unsupported source or missing metadata.</span>
             {media.type === 'manga' && <span className="mt-2 text-xs">Manga reading is not supported yet.</span>}
         </div>
      );
    }
    return (
      <div className="w-full h-full bg-black rounded-lg overflow-hidden relative group"> 
         <iframe"""

if target in content:
    content = content.replace(target, replacement)
    with open("pages/Details.tsx", "w") as f:
        f.write(content)
    print("Done handling embed error")
else:
    print("Target not found for embed error")
