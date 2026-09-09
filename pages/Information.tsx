import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import Seo, { SITE_NAME, toAbsoluteSiteUrl } from '../components/Seo';

type InfoKey = 'about' | 'contact' | 'privacy' | 'terms' | 'copyright' | 'editorial-policy';

const information: Record<InfoKey, { title: string; description: string; body: React.ReactNode }> = {
  about: {
    title: 'About StreamNexus',
    description: 'Learn how StreamNexus organizes movie, TV-show, and anime metadata and how viewing links and watchlists work.',
    body: <><p>StreamNexus is a media discovery interface that organizes factual title information, artwork, trailers, episode guides, and related recommendations.</p><h2>Data and viewing sources</h2><p>Movie and TV metadata and imagery are supplied by TMDB. Anime metadata is supplied by AniList. StreamNexus is not endorsed or certified by either provider. Video playback, when available, is delivered by third-party embed providers and is loaded only after a visitor chooses to play a title.</p><h2>Personal features</h2><p>Saved titles and viewing progress are stored locally in the visitor’s browser. The current site does not provide user accounts or synchronize this information to a StreamNexus database.</p></>
  },
  contact: {
    title: 'Contact',
    description: 'Contact information and request categories for StreamNexus.',
    body: <><p>Use the appropriate channel for feedback, privacy questions, metadata corrections, or rights-holder requests.</p><div className="manual-notice"><strong>Site owner action required:</strong> add a monitored contact email or form endpoint before public launch. No business address or individual identity has been invented here.</div><h2>What to include</h2><p>For metadata corrections, include the page URL and the specific field that appears incorrect. Rights-holder notices should identify the protected work, the relevant URL, the requester’s authority, and reliable contact details.</p></>
  },
  privacy: {
    title: 'Privacy policy',
    description: 'How StreamNexus handles local watchlists, analytics, third-party media, and technical request data.',
    body: <><p><strong>Last updated: September 5, 2026.</strong></p><h2>Information stored on your device</h2><p>Watchlists and viewing progress are stored in browser local storage. A session-only counter and next-display time limit sponsor breaks to eight per browser-tab session, scheduled ten minutes apart. Clearing site data removes these values. Exported library backups are downloaded only when you request them and are not uploaded to StreamNexus.</p><h2>Analytics and server logs</h2><p>StreamNexus uses Google Analytics to understand aggregate page usage. Google and the hosting provider may process routine request information such as IP address, browser type, requested URL, and timestamps according to their own policies.</p><h2>Advertising and third-party content</h2><p>Popunder and social-bar advertising loads with the page. Banner and native advertisements appear throughout the catalog, and banners also appear in clearly labeled sponsor breaks. The popunder may open an advertiser tab or window following an interaction with the page. Clicking an advertisement is optional. Opening advertisements, trailers, or playback embeds sends a request to the selected third-party provider. Review each provider’s terms and privacy information before using its service.</p><h2>Your choices</h2><p>You can use browser privacy controls, clear local site data, decline to interact with advertisements, and decline to start embedded players. The site owner must add a monitored privacy contact before launch.</p></>
  },
  terms: {
    title: 'Terms of use',
    description: 'Terms governing use of the StreamNexus media-discovery interface.',
    body: <><p><strong>Last updated: August 5, 2026.</strong></p><h2>Service scope</h2><p>StreamNexus provides discovery features and links or embeds from third parties. Availability, accuracy, and continuity can change, and no title is promised to be available in a particular country or at a particular time.</p><h2>Acceptable use</h2><p>Do not misuse the service, attempt unauthorized access, interfere with normal operation, or use the interface in a way that violates applicable law or third-party rights.</p><h2>Third-party services</h2><p>Metadata, trailers, and playback services have their own terms. StreamNexus does not control those services and does not claim ownership of their content.</p><div className="manual-notice"><strong>Site owner action required:</strong> obtain legal review for the intended jurisdiction and add the operator’s identity and contact method before launch.</div></>
  },
  copyright: {
    title: 'Copyright and rights-holder requests',
    description: 'How rights holders can identify content and request review of a StreamNexus page or third-party embed.',
    body: <><p>StreamNexus displays third-party metadata and may load external players after user interaction. It does not claim ownership of movie, television, anime, poster, or trailer content supplied by those services.</p><h2>Requesting review</h2><p>A notice should include the protected work, the exact StreamNexus URL, the material or link at issue, the requester’s authority, contact information, and a good-faith statement sufficient for the applicable jurisdiction.</p><p>Where appropriate, the site operator can correct metadata, remove a link, or direct the requester to the third-party host that controls the underlying material.</p><div className="manual-notice"><strong>Site owner action required:</strong> publish a monitored rights-holder email or form and define a response workflow before launch.</div></>
  },
  'editorial-policy': {
    title: 'Editorial and metadata policy',
    description: 'How StreamNexus selects, labels, and corrects movie, TV, and anime information.',
    body: <><p>StreamNexus separates factual metadata from interface labels and recommendations. It does not fabricate reviews, availability claims, ratings, credits, or release information.</p><h2>Sources and selection</h2><p>Factual movie and TV fields come from TMDB; anime fields come from AniList. Trending and popular collections reflect those providers’ current catalog signals. Manually curated collections should be clearly named and kept limited to relevant titles.</p><h2>Corrections and freshness</h2><p>Dynamic metadata can change at the source. Corrections should be verified against the source record before publication. Pages state unavailable fields plainly instead of filling gaps with invented information.</p><h2>Recommendations</h2><p>Related-title modules are discovery aids, not endorsements or professional reviews. StreamNexus does not sell rankings or publish undisclosed sponsored placement in these collections.</p></>
  }
};

const InformationPage: React.FC<{ page?: InfoKey }> = ({ page }) => {
  const params = useParams<{ page: string }>();
  const key = (page || params.page) as InfoKey;
  const content = information[key];
  const path = `/${key}`;
  const needsOwnerDetails = key === 'contact' || key === 'terms' || key === 'copyright';
  const jsonLd = useMemo(() => content ? ({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: content.title, description: content.description, url: toAbsoluteSiteUrl(path), isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: toAbsoluteSiteUrl('/') } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: toAbsoluteSiteUrl('/') }, { '@type': 'ListItem', position: 2, name: content.title, item: toAbsoluteSiteUrl(path) }] }
    ]
  }) : undefined, [content, path]);

  if (!content) return <div className="empty-state detail-missing"><Seo title={`Page not found | ${SITE_NAME}`} robots="noindex,follow" /><h1>Page not found</h1><Link to="/">Return home</Link></div>;
  return <article className="information-page shell"><Seo title={`${content.title} | ${SITE_NAME}`} description={content.description} path={path} robots={needsOwnerDetails ? 'noindex,follow' : undefined} jsonLd={needsOwnerDetails ? undefined : jsonLd} /><Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: content.title }]} /><header><div className="eyebrow">StreamNexus information</div><h1>{content.title}</h1><p>{content.description}</p></header><div className="prose">{content.body}</div></article>;
};

export default InformationPage;
