import React, { useEffect, useRef, useState } from 'react';

const banners = {
  leaderboard: { key: '1073b4789aa3061d60eece58c124a1bf', width: 728, height: 90 },
  horizontal: { key: '71d4eca23afbaee74e46e80d08972d66', width: 468, height: 60 },
  mobile: { key: '2605b3913125b7dda28fda6f5658e3ec', width: 320, height: 50 },
  rectangle: { key: 'da6d12386491f727278471211858b88b', width: 300, height: 250 },
  tower: { key: 'aad5ff5fb14bd47a9feae2802ca2d63e', width: 160, height: 300 }
};

type BannerSize = keyof typeof banners;

const Advertisement: React.FC<{ format?: 'responsive' | 'rectangle' | 'tower'; className?: string }> = ({ format = 'responsive', className = '' }) => {
  const host = useRef<HTMLElement>(null);
  const [size, setSize] = useState<BannerSize | null>(null);

  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setSize(width < 160 ? null : format === 'tower' ? 'tower' : format === 'rectangle' && width >= 300 ? 'rectangle' : width >= 728 ? 'leaderboard' : width >= 468 ? 'horizontal' : width >= 320 ? 'mobile' : width >= 300 ? 'rectangle' : 'tower');
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [format]);

  return (
    <aside ref={host} className={`sn-ad-slot sn-ad-slot--${format} ${className}`} aria-label="Advertisement">
      <span className="sn-ad-slot__label">Advertisement</span>
      {size && <iframe key={size} title={`${banners[size].width} by ${banners[size].height} advertisement`} width={banners[size].width} height={banners[size].height} src={`/ad-frame/${size}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" />}
    </aside>
  );
};

export const NativeAdvertisement: React.FC = () => {
  const host = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    // Defer insertion so StrictMode's setup/cleanup check cannot load it twice.
    const timer = window.setTimeout(() => {
      const script = document.createElement('script');
      script.async = true;
      script.dataset.cfasync = 'false';
      script.src = 'https://pl31194158.profitableratecpmnetwork.com/78c4b7c8e22bf7d1f8b7034a7cccec4c/invoke.js';
      element.appendChild(script);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <aside ref={host} className="sn-ad-slot sn-ad-slot--native" aria-label="Sponsored content">
      <span className="sn-ad-slot__label">Advertisement</span>
      <div id="container-78c4b7c8e22bf7d1f8b7034a7cccec4c" />
    </aside>
  );
};

export default Advertisement;
