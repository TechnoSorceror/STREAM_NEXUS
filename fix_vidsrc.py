import re

with open("services/vidsrc.ts", "r") as f:
    content = f.read()

content = content.replace("const results = data.result || [];", "const results = (data.result || []).slice(0, 12);")

with open("services/vidsrc.ts", "w") as f:
    f.write(content)
print("vidsrc limited to 12 items")
