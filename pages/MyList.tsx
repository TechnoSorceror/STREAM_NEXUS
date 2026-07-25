import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Library } from 'lucide-react';
import { getMyList, MyListItem, removeFromMyList } from '../lib/myList';
import { WatchStatus } from '../types';
import MediaCard from '../components/MediaCard';

const filters: { value: WatchStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'watching', label: 'Watching' },
  { value: 'plan_to_watch', label: 'Up next' }, { value: 'completed', label: 'Finished' },
  { value: 'on_hold', label: 'Paused' }, { value: 'dropped', label: 'Dropped' }
];

const MyList: React.FC = () => {
  const [items, setItems] = useState<MyListItem[]>([]);
  const [filter, setFilter] = useState<WatchStatus | 'all'>('all');
  useEffect(() => setItems(getMyList()), []);
  const visible = useMemo(() => items.filter(item => filter === 'all' || item.watchStatus === filter || (!item.watchStatus && filter === 'plan_to_watch')), [items, filter]);

  return (
    <div className="list-page shell">
      <header className="browse-header"><div><div className="eyebrow"><Library size={13} /> Personal library</div><h1>My list</h1><p>{items.length ? `${items.length} saved ${items.length === 1 ? 'title' : 'titles'}, organized your way.` : 'Build a queue worth coming back to.'}</p></div></header>
      <div className="status-tabs" role="tablist" aria-label="Watch status">{filters.map(item => <button role="tab" aria-selected={filter === item.value} className={filter === item.value ? 'active' : ''} key={item.value} onClick={() => setFilter(item.value)}>{item.label}<span>{items.filter(x => item.value === 'all' || x.watchStatus === item.value).length}</span></button>)}</div>
      {visible.length ? <div className="media-grid">{visible.map((item, i) => <MediaCard key={`${item.type}-${item.id}`} item={item} index={i} onRemove={event => { event.preventDefault(); removeFromMyList(item.id, item.type); setItems(getMyList()); }} />)}</div> : <div className="empty-state"><Bookmark size={30} /><h2>Nothing here yet.</h2><p>Save a title or switch to another status.</p></div>}
    </div>
  );
};
export default MyList;
