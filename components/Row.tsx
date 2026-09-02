import React, { useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaItem } from '../types';
import MediaCard from './MediaCard';

interface Props {
  title: string;
  items?: MediaItem[];
  kicker?: string;
  featured?: boolean;
  isLarge?: boolean;
  onRemoveItem?: (item: MediaItem, event: React.MouseEvent) => void;
  onExplore?: () => void;
  explorePath?: string;
}

const Row: React.FC<Props> = ({
  title,
  items = [],
  kicker,
  featured = false,
  isLarge = false,
  onRemoveItem,
  onExplore,
  explorePath
}) => {
  const rail = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items.length) return null;

  const move = (direction: number) =>
    rail.current?.scrollBy({
      left: direction * Math.min(rail.current.clientWidth * 0.82, 900),
      behavior: 'smooth'
    });

  const handleExploreClick = () => {
    if (onExplore) {
      onExplore();
    } else if (!explorePath) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <section className={`media-row shell ${featured || isLarge ? 'featured' : ''}`}>
      <header className="row-heading">
        <div>
          {kicker && <div className="eyebrow">{kicker}</div>}
          <h2>{title}</h2>
        </div>
        <div className="row-actions">
          {!isExpanded && (
            <>
              <button onClick={() => move(-1)} aria-label="Scroll left" className="scroll-arrow">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => move(1)} aria-label="Scroll right" className="scroll-arrow">
                <ChevronRight size={18} />
              </button>
            </>
          )}
          {explorePath && !isExpanded ? <Link className="explore" to={explorePath}>Explore <ArrowRight size={15} /></Link> : <button className="explore" onClick={handleExploreClick}>
            {isExpanded ? (
              <>
                Collapse <ArrowUp size={15} />
              </>
            ) : (
              <>
                Explore <ArrowRight size={15} />
              </>
            )}
          </button>}
        </div>
      </header>

      {isExpanded ? (
        <div className="media-grid py-2">
          {items.map((item, index) => (
            <MediaCard
              key={`${item.type}-${item.id}`}
              item={item}
              index={index}
              onRemove={onRemoveItem ? event => onRemoveItem(item, event) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="media-rail" ref={rail}>
          {items.map((item, index) => (
            <MediaCard
              key={`${item.type}-${item.id}`}
              item={item}
              index={index}
              onRemove={onRemoveItem ? event => onRemoveItem(item, event) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Row;
