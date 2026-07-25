import re

with open("App.tsx", "r") as f:
    content = f.read()

target = r'<div className="min-h-screen bg-nexus-900 text-gray-100 font-sans selection:bg-nexus-accent selection:text-white">'
replacement = r'<div className="min-h-screen bg-nexus-ink text-nexus-text font-mono selection:bg-nexus-lime selection:text-nexus-ink flex flex-col pt-[72px]">'

content = content.replace(target, replacement)
content = content.replace('<div className="noise"></div>', '')
content = content.replace('<Navbar />', '<div className="noise"></div><Navbar />')

target_footer = r'<footer className="py-12 text-center text-xs text-gray-600 border-t border-nexus-800 mt-20 bg-nexus-900">.*?</footer>'
replacement_footer = r'''<footer className="border-t border-nexus-line py-10 pb-14 text-nexus-muted text-[0.72rem] mt-auto">
          <div className="shell flex flex-col sm:flex-row justify-between gap-5">
            <span>STREAMNEXUS / BUILD 2.6.1</span>
            <span className="flex gap-2 items-center before:content-[''] before:w-2 before:h-2 before:rounded-full before:bg-nexus-lime before:shadow-[0_0_18px_var(--color-nexus-lime)]">
              All discovery services operational
            </span>
            <span>Metadata via TMDB</span>
          </div>
        </footer>'''

content = re.sub(target_footer, replacement_footer, content, flags=re.DOTALL)

with open("App.tsx", "w") as f:
    f.write(content)
