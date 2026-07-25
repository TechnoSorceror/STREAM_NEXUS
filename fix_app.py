import re

with open("App.tsx", "r") as f:
    content = f.read()

content = content.replace("import { HashRouter, Routes, Route } from 'react-router-dom';", "import { BrowserRouter, Routes, Route } from 'react-router-dom';")
content = content.replace("<HashRouter>", "<BrowserRouter>")
content = content.replace("</HashRouter>", "</BrowserRouter>")

with open("App.tsx", "w") as f:
    f.write(content)
print("App.tsx fixed")
