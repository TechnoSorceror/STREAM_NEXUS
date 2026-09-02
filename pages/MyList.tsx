import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Download, Library, Upload } from 'lucide-react';
import { exportMyListBackup, getMyList, importMyListBackup, MyListItem, removeFromMyList, setMyListStatus } from '../lib/myList';
import { WatchStatus } from '../types';
import MediaCard from '../components/MediaCard';
import Seo, { SITE_NAME } from '../components/Seo';

const filters: { value: WatchStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'watching', label: 'Watching' },
  { value: 'plan_to_watch', label: 'Up next' }, { value: 'completed', label: 'Finished' },
  { value: 'on_hold', label: 'Paused' }, { value: 'dropped', label: 'Dropped' }
];

const MyList: React.FC = () => {
  const [items, setItems] = useState<MyListItem[]>([]);
  const [filter, setFilter] = useState<WatchStatus | 'all'>('all');
  const [message, setMessage] = useState('');
  const importInput = useRef<HTMLInputElement>(null);
  const refresh = () => setItems(getMyList());

  useEffect(() => {
    refresh();
    window.addEventListener('streamnexus:list-change', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('streamnexus:list-change', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const visible = useMemo(() => items.filter(item => filter === 'all' || item.watchStatus === filter), [items, filter]);

  const exportBackup = () => {
    const blob = new Blob([exportMyListBackup()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `streamnexus-library-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`Exported ${items.length} ${items.length === 1 ? 'title' : 'titles'}.`);
  };

  const importBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const count = importMyListBackup(await file.text());
      refresh();
      setMessage(`Imported ${count} ${count === 1 ? 'title' : 'titles'} safely.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The backup could not be imported.');
    }
  };

  return (
    <div className="list-page shell">
      <Seo title={`My List | ${SITE_NAME}`} description="Your device-local StreamNexus watchlist." path="/my-list" robots="noindex,nofollow" />
      <header className="browse-header library-header">
        <div><div className="eyebrow"><Library size={13} /> Personal library</div><h1>My list</h1><p>{items.length ? `${items.length} saved ${items.length === 1 ? 'title' : 'titles'}, organized your way.` : 'Build a queue worth coming back to.'}</p></div>
        <div className="library-actions">
          <button className="button button-quiet" onClick={exportBackup} disabled={!items.length}><Download size={16} /> Export backup</button>
          <button className="button button-quiet" onClick={() => importInput.current?.click()}><Upload size={16} /> Import backup</button>
          <input ref={importInput} className="visually-hidden" type="file" accept="application/json,.json" onChange={importBackup} />
        </div>
      </header>
      {message && <p className="library-message" role="status" aria-live="polite">{message}</p>}
      <div className="status-tabs" role="tablist" aria-label="Watch status">{filters.map(item => <button role="tab" aria-selected={filter === item.value} className={filter === item.value ? 'active' : ''} key={item.value} onClick={() => setFilter(item.value)}>{item.label}<span>{items.filter(entry => item.value === 'all' || entry.watchStatus === item.value).length}</span></button>)}</div>
      {visible.length ? <div className="media-grid">{visible.map((item, index) => <MediaCard key={`${item.type}-${item.id}`} item={item} index={index} watchStatus={item.watchStatus || 'plan_to_watch'} onWatchStatusChange={status => setMyListStatus(item.id, item.type, status)} onRemove={event => { event.preventDefault(); removeFromMyList(item.id, item.type); }} />)}</div> : <div className="empty-state"><Bookmark size={30} /><h2>Nothing here yet.</h2><p>Save a title or switch to another status.</p></div>}
    </div>
  );
};

export default MyList;

