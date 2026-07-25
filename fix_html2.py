import re
with open("index.html", "r") as f:
    content = f.read()

content = re.sub(r'<style>.*?</style>\s*', '', content, flags=re.DOTALL)
content = re.sub(r'<link rel="stylesheet" href="/index.css">\s*', '', content, flags=re.DOTALL)

with open("index.html", "w") as f:
    f.write(content)
