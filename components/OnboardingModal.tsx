import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ExternalLink, KeyRound } from 'lucide-react';
import { DEFAULT_TMDB_API_KEY, STORAGE_KEYS } from '../constants';

const OnboardingModal: React.FC = () => {
  const dialog = useRef<HTMLDialogElement>(null);
  const [apiKey, setApiKey] = useState('');
  useEffect(() => { if (!localStorage.getItem(STORAGE_KEYS.TMDB_API_KEY) && !DEFAULT_TMDB_API_KEY) dialog.current?.showModal(); }, []);
  const save = () => { if (!apiKey.trim()) return; localStorage.setItem(STORAGE_KEYS.TMDB_API_KEY, apiKey.trim()); dialog.current?.close(); window.location.reload(); };
  return <dialog className="onboarding" ref={dialog}><div className="onboarding-mark"><KeyRound size={22} /></div><div className="eyebrow">One-time setup</div><h2>Connect the catalog.</h2><p>StreamNexus uses TMDB for artwork, metadata, ratings, and discovery.</p><label><span>TMDB API key (v3)</span><input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Paste your key" /></label><button className="button button-primary" disabled={!apiKey.trim()} onClick={save}>Connect TMDB <ArrowRight size={16} /></button><a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">Get a free key <ExternalLink size={12} /></a><small>Stored only in this browser.</small></dialog>;
};
export default OnboardingModal;
