import React from 'react';
import { Link } from 'react-router-dom';
import Seo, { SITE_NAME } from '../components/Seo';

const NotFound: React.FC = () => <div className="empty-state detail-missing"><Seo title={`Page not found | ${SITE_NAME}`} description="The requested StreamNexus page could not be found." robots="noindex,follow" /><h1>Page not found</h1><p>The address may have changed or the title may no longer be available.</p><Link className="button button-primary" to="/">Return to StreamNexus</Link></div>;

export default NotFound;

