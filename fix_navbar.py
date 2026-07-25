import re

with open("components/Navbar.tsx", "r") as f:
    content = f.read()

target = """  const searchRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };"""

replacement = """  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideDesktop = searchRef.current && !searchRef.current.contains(event.target as Node);
      const isOutsideMobile = mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node);
      if (isOutsideDesktop && isOutsideMobile) {
        setShowSuggestions(false);
      } else if (isOutsideDesktop && !mobileSearchRef.current) {
        setShowSuggestions(false);
      }
    };"""

content = content.replace(target, replacement)

target_mobile = """            {/* Mobile Search */}
            <div className="relative">"""

replacement_mobile = """            {/* Mobile Search */}
            <div className="relative" ref={mobileSearchRef}>"""

content = content.replace(target_mobile, replacement_mobile)

with open("components/Navbar.tsx", "w") as f:
    f.write(content)
print("Navbar fixed")
