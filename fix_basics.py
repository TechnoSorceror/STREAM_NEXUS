import re
import os

# 1. Home.tsx
with open("pages/Home.tsx", "r") as f:
    content = f.read()

content = content.replace("openAdAndIntercept(e as unknown as React.MouseEvent);", "")

with open("pages/Home.tsx", "w") as f:
    f.write(content)

# 2. constants.ts
with open("constants.ts", "r") as f:
    content = f.read()

content = re.sub(r"export const ANILIST_TOKEN = '.*?';\n", "", content)

with open("constants.ts", "w") as f:
    f.write(content)

# 3. vite.config.ts
with open("vite.config.ts", "r") as f:
    content = f.read()

# Remove define process.env.GEMINI_API_KEY
content = re.sub(r"define:\s*\{.*?GEMINI_API_KEY:.*?\},\n?", "", content, flags=re.DOTALL)

with open("vite.config.ts", "w") as f:
    f.write(content)

# 4. index.html
with open("index.html", "r") as f:
    content = f.read()

content = re.sub(r'<script src="https://cdn.tailwindcss.com"></script>\n?', "", content)
with open("index.html", "w") as f:
    f.write(content)

# 5. package.json
with open("package.json", "r") as f:
    content = f.read()

content = content.replace('"build": "vite build",', '"build": "vite build",\n    "typecheck": "tsc --noEmit",')
with open("package.json", "w") as f:
    f.write(content)

print("Basic fixes applied")
