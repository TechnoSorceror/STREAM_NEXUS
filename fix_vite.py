import re
with open("vite.config.ts", "r") as f:
    content = f.read()

content = re.sub(r'define:\s*\{.*?\},\s*', '', content, flags=re.DOTALL)
with open("vite.config.ts", "w") as f:
    f.write(content)
print("Removed define from vite.config.ts")
