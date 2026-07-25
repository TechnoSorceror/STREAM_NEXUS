import re
with open("index.html", "r") as f:
    content = f.read()

# Remove importmap
content = re.sub(r'<script type="importmap">.*?</script>', '', content, flags=re.DOTALL)
# Remove tailwind config script
content = re.sub(r'<script>\s*tailwind\.config = \{.*?\s*</script>', '', content, flags=re.DOTALL)
# Add CSP
csp = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; img-src \'self\' https://image.tmdb.org https://picsum.photos data:; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; connect-src \'self\' https://api.tmdb.org https://corsproxy.io https://api.allorigins.win; frame-src \'self\' https://vidsrc.icu https://vidsrc-embed.ru https://vidsrc.sbs https://vidsrc.net https://multiembed.mov https://www.youtube.com;" />'
content = content.replace('<head>', f'<head>\n    {csp}')

with open("index.html", "w") as f:
    f.write(content)
print("index.html fixed")
