import os
import re

directories = ['pages', 'components']

replacements = {
    'bg-nexus-900': 'bg-nexus-ink',
    'bg-nexus-800': 'bg-nexus-base',
    'bg-nexus-700': 'bg-nexus-line',
    'bg-nexus-accent': 'bg-nexus-lime',
    'text-nexus-accent': 'text-nexus-lime',
    'border-nexus-900': 'border-nexus-ink',
    'border-nexus-800': 'border-nexus-base',
    'border-nexus-700': 'border-nexus-line',
    'border-nexus-accent': 'border-nexus-lime',
    'hover:bg-nexus-900': 'hover:bg-nexus-ink',
    'hover:bg-nexus-800': 'hover:bg-nexus-base',
    'hover:bg-nexus-700': 'hover:bg-nexus-line',
    'hover:bg-nexus-accent': 'hover:bg-nexus-lime',
    'hover:border-nexus-accent': 'hover:border-nexus-lime',
    'hover:text-nexus-accent': 'hover:text-nexus-lime',
    'text-white': 'text-nexus-text',
    'text-gray-100': 'text-nexus-text',
    'text-gray-200': 'text-[oklch(86%_0.015_265)]',
    'text-gray-300': 'text-[oklch(86%_0.015_265)]',
    'text-gray-400': 'text-nexus-muted',
    'text-gray-500': 'text-nexus-muted',
    'text-gray-600': 'text-[oklch(50%_0.02_265)]',
    'bg-gray-800': 'bg-nexus-line',
    'bg-gray-900': 'bg-nexus-base',
}

for root, _, files in os.walk('.'):
    if 'node_modules' in root or 'dist' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts') and file != 'Home.tsx' and file != 'Row.tsx' and file != 'MediaCard.tsx' and file != 'Navbar.tsx':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements.items():
                new_content = new_content.replace(old, new)
            
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")

