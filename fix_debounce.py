import re

with open("pages/Details.tsx", "r") as f:
    content = f.read()

target = """      if (isEnded) {
         handleNextEpisode();
      }"""

replacement = """      if (isEnded) {
         if (window.lastAutoNext && Date.now() - window.lastAutoNext < 3000) return;
         window.lastAutoNext = Date.now();
         handleNextEpisode();
      }"""

content = content.replace(target, replacement)

# Add declare global for lastAutoNext at top if needed, or simply use a ref.
# I will use a ref instead of global window object.

# Actually, I can just use `window as any` or a module-level variable, wait, a module level variable in React is fine for debouncing.

target2 = """      if (isEnded) {
         handleNextEpisode();
      }"""

replacement2 = """      if (isEnded) {
         if ((window as any).lastAutoNext && Date.now() - (window as any).lastAutoNext < 5000) return;
         (window as any).lastAutoNext = Date.now();
         handleNextEpisode();
      }"""

content = content.replace(target, replacement2)

with open("pages/Details.tsx", "w") as f:
    f.write(content)
