import re

with open("components/Loader.tsx", "r") as f:
    content = f.read()

content = content.replace('#00e6e6', 'oklch(82% 0.19 137)')
content = content.replace('#00ccff', 'oklch(82% 0.19 137)')
content = content.replace('#0099ff', 'oklch(69% 0.18 137)')
content = content.replace('#0066ff', 'oklch(69% 0.18 137)')

with open("components/Loader.tsx", "w") as f:
    f.write(content)
