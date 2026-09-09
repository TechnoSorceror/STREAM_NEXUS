import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaItem } from '../types';
import MediaCard from './MediaCard';
import { useReducedMotion } from 'motion/react';

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
  const [edges, setEdges] = useState({ left: false, right: false });
  const contentId = useId();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = rail.current;
    if (!element || isExpanded) return;
    const updateEdges = () => setEdges({
      left: element.scrollLeft > 4,
      right: element.scrollLeft + element.clientWidth < element.scrollWidth - 4
    });
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(element);
    element.addEventListener('scroll', updateEdges, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', updateEdges);
    };
  }, [items.length, isExpanded]);

  if (!items.length) return null;

  const move = (direction: number) =>
    rail.current?.scrollBy({
      left: direction * Math.min(rail.current.clientWidth * 0.82, 900),
      behavior: reduceMotion ? 'instant' : 'smooth'
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
              <button onClick={() => move(-1)} disabled={!edges.left} aria-label={`Scroll ${title} left`} aria-controls={contentId} className="scroll-arrow">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => move(1)} disabled={!edges.right} aria-label={`Scroll ${title} right`} aria-controls={contentId} className="scroll-arrow">
                <ChevronRight size={18} />
              </button>
            </>
          )}
          {explorePath && !isExpanded ? <Link className="explore" to={explorePath} aria-label={`Explore ${title}`}>Explore <ArrowRight size={15} /></Link> : <button className="explore" onClick={handleExploreClick} aria-label={`${isExpanded ? 'Collapse' : 'Explore'} ${title}`} aria-expanded={onExplore ? undefined : isExpanded} aria-controls={onExplore ? undefined : contentId}>
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

      <div id={contentId} className={isExpanded ? 'media-grid py-2' : 'media-rail'} ref={rail}>
        {items.map((item, index) => (
          <MediaCard
            key={`${item.type}-${item.id}`}
            item={item}
            index={index}
            onRemove={onRemoveItem ? event => onRemoveItem(item, event) : undefined}
          />
        ))}
      </div>
    </section>
  );
};

export default Row;
