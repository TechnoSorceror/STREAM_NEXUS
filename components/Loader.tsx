import React from 'react';
const Loader: React.FC<{ page?: boolean; label?: string }> = ({ page = false, label = 'Loading' }) => <div className={`loader ${page ? 'loader-page' : ''}`} role="status"><div className="loader-mark"><i /><i /><i /></div><span>{label}</span></div>;
export default Loader;
