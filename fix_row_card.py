import re

with open("components/Row.tsx", "r") as f:
    row_content = f.read()

target_row = r"interface RowProps \{.*export default Row;"

replacement_row = r"""interface RowProps {
  title: string;
  items: MediaItem[];
  isLarge?: boolean;
  kicker?: string;
  onRemoveItem?: (item: MediaItem, e: React.MouseEvent) => void;
}

const Row: React.FC<RowProps> = ({ title, items, kicker, isLarge = false, onRemoveItem }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const slide = (offset: number) => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="mt-[68px] shell group relative">
      <div className="flex items-end justify-between mb-5">
        <div>
          {kicker && <div className="text-nexus-lime uppercase tracking-[0.14em] text-[0.67rem]">{kicker}</div>}
          <h2 className="font-sans text-[clamp(1.7rem,3vw,2.6rem)] tracking-[-0.045em] mt-1.5 mb-0 text-nexus-text">
            {title}
          </h2>
        </div>
        <button className="text-nexus-muted text-[0.72rem] uppercase tracking-[0.1em] hover:text-nexus-lime bg-transparent border-none cursor-pointer">
          Explore all →
        </button>
      </div>
      
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <button 
          onClick={() => slide(-500)}
          className="absolute -left-4 sm:-left-12 top-0 bottom-0 z-20 w-10 sm:w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div className="bg-nexus-base/80 backdrop-blur border border-nexus-line rounded-full w-8 h-8 flex items-center justify-center text-nexus-lime hover:bg-nexus-lime hover:text-nexus-ink"><ChevronLeft size={20} /></div>
        </button>

        <div 
          ref={rowRef}
          className="grid grid-flow-col auto-cols-[minmax(170px,210px)] gap-[18px] overflow-x-auto pb-6 pt-1 scroll-smooth snap-x snap-proximity custom-scrollbar"
        >
          {items.map((item, i) => (
            <div key={`${item.type}-${item.id}`} className="snap-start relative transition-transform duration-240 hover:-translate-y-[7px]">
              <MediaCard 
                 item={item} 
                 index={i}
                 onRemove={onRemoveItem ? (e) => onRemoveItem(item, e) : undefined}
              />
            </div>
          ))}
        </div>

        <button 
          onClick={() => slide(500)}
          className="absolute -right-4 sm:-right-12 top-0 bottom-0 z-20 w-10 sm:w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div className="bg-nexus-base/80 backdrop-blur border border-nexus-line rounded-full w-8 h-8 flex items-center justify-center text-nexus-lime hover:bg-nexus-lime hover:text-nexus-ink"><ChevronRight size={20} /></div>
        </button>
      </div>
    </section>
  );
};

export default Row;"""

row_content = re.sub(target_row, replacement_row, row_content, flags=re.DOTALL)
with open("components/Row.tsx", "w") as f:
    f.write(row_content)


with open("components/MediaCard.tsx", "r") as f:
    card_content = f.read()

target_card = r"interface MediaCardProps \{.*export default MediaCard;"

replacement_card = r"""import { Play } from 'lucide-react';

interface MediaCardProps {
  item: MediaItem & { progress?: { season?: number, episode?: number, chapter?: number } };
  index?: number;
  onRemove?: (e: React.MouseEvent) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, index = 0, onRemove }) => {
  const navigate = useNavigate();

  const getPath = () => {
    return `/${item.type}/${item.id}`;
  };

  const getStatusText = () => {
    if (item.progress) {
      if (item.type === 'tv' || item.type === 'anime') {
        return `S${item.progress.season || 1} E${item.progress.episode || 1}`;
      }
      if (item.type === 'manga') {
        return `Chapter ${item.progress.chapter || 1}`;
      }
      return 'Continue';
    }
    return item.releaseDate ? item.releaseDate.substring(0, 4) : '';
  };

  return (
    <Link to={getPath()} className="block h-full group">
      <div className="aspect-[2/3] overflow-hidden rounded-[8px] bg-nexus-raised border border-nexus-line relative">
        <img 
          src={item.poster} 
          alt={item.title} 
          loading="lazy"
          className="w-full h-full object-cover transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:saturate-[1.12]"
        />
        
        {/* Rank/Rating Badge */}
        <span className="absolute left-2 top-2 bg-nexus-ink border border-nexus-line rounded-[4px] px-[7px] py-[3px] text-nexus-lime text-[0.65rem] font-mono z-10 shadow-sm">
           #{String(index + 1).padStart(2, '0')} · {item.rating ? item.rating.toFixed(1) : 'NR'}
        </span>
        
        {/* Remove button (if continue watching) */}
        {onRemove && (
          <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(e); }}
             className="absolute right-2 top-2 bg-nexus-ink/80 hover:bg-nexus-accent border border-nexus-line hover:border-nexus-accent rounded-[4px] w-6 h-6 flex items-center justify-center text-nexus-text text-xs z-10 backdrop-blur-sm transition-colors"
             aria-label="Remove from Continue Watching"
          >
             ×
          </button>
        )}

        {/* Play Button */}
        <div className="absolute right-[9px] bottom-[9px] w-[40px] h-[40px] rounded-full bg-nexus-lime text-nexus-ink grid place-items-center opacity-0 translate-y-2 transition-all duration-220 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-hover:translate-y-0 z-10 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
          <Play size={18} fill="currentColor" className="ml-0.5" />
        </div>
      </div>
      
      <h3 className="font-sans text-[0.94rem] mt-[11px] mb-1 whitespace-nowrap overflow-hidden text-ellipsis text-nexus-text">
        {item.title}
      </h3>
      
      <div className="text-[0.68rem] text-nexus-muted uppercase font-mono flex items-center justify-between">
        <span className="truncate">{getStatusText()} {item.genres?.[0] ? `· ${item.genres[0].name}` : ''}</span>
      </div>

      {item.progress && (
        <div className="h-[3px] bg-nexus-line mt-[9px] rounded-full overflow-hidden w-full">
           <span className="block h-full bg-nexus-lime w-1/2"></span>
        </div>
      )}
    </Link>
  );
};

export default MediaCard;"""

card_content = re.sub(target_card, replacement_card, card_content, flags=re.DOTALL)
with open("components/MediaCard.tsx", "w") as f:
    f.write(card_content)

print("Row and Card updated")
