import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
ReactDOM.createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);

const adSlot = document.querySelector<HTMLElement>('.sn-ad-slot');
if (adSlot) {
  let loaded = false;
  const labelFrames = () => adSlot.querySelectorAll('iframe').forEach(frame => {
    if (!frame.title) frame.title = 'Advertisement';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
  });
  const frameObserver = new MutationObserver(labelFrames);
  frameObserver.observe(adSlot, { childList: true, subtree: true });

  const loadAdvertisement = () => {
    if (loaded) return;
    loaded = true;
    const script = document.createElement('script') as HTMLScriptElement & { settings?: Record<string, never> };
    script.settings = {};
    script.src = 'https://conventionalresponse.com/b/XCVls.dVG/lJ0vYGWtcF/peJmP9EuCZmULl_koP_TscRyjO/T/MlwQNhD/kstCNvz/IZ5gMpzTAO1nMOwi';
    script.async = true;
    script.referrerPolicy = 'no-referrer-when-downgrade';
    adSlot.appendChild(script);
  };

  const intersectionObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          intersectionObserver.disconnect();
          loadAdvertisement();
        }
      }, { rootMargin: '600px 0px' })
    : null;
  if (intersectionObserver) intersectionObserver.observe(adSlot);
  else window.addEventListener('load', loadAdvertisement, { once: true });
}
