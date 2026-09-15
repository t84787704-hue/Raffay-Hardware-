import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Layers, 
  Pause, 
  Play,
  Star
} from 'lucide-react';
import { ProductItem } from '../types';
import { useHardwareStore } from '../context/HardwareStoreContext';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { formatImageSrc, handleImageError, DEFAULT_FALLBACK_IMAGE, downloadWithWatermark } from '../utils/imageUtils';

export interface FeaturedProductsCarouselProps {
  products?: ProductItem[];
  onSelectProduct: (product: ProductItem) => void;
}

const CARD_WIDTH = 200; // Fixed 200px width per user requirement
const CARD_GAP = 16;   // Gap between cards in pixels
const SLOT_WIDTH = CARD_WIDTH + CARD_GAP; // 216px total slot
const LOOP_DURATION_SEC = 28; // Exact 28s linear auto-scroll per user requirement

export function FeaturedProductsCarousel({ products: propProducts, onSelectProduct }: FeaturedProductsCarouselProps) {
  const { products: storeProducts } = useHardwareStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isManualPause, setIsManualPause] = useState(false);

  // 12 products where is_featured = true (or latest 12 if less selected)
  const baseItems = useMemo(() => {
    if (propProducts && propProducts.length > 0) {
      return propProducts.slice(0, 12);
    }
    const sourceList = (storeProducts && storeProducts.length > 0) ? storeProducts : INITIAL_PRODUCTS;
    const cleanList = sourceList.filter((item) => {
      const combined = `${item.id} ${item.sku || ''} ${item.name || ''} ${item.productName || ''}`.toLowerCase();
      return !combined.includes('5032') && !combined.includes('bus') && !combined.includes('vehicle');
    });

    const featured = cleanList.filter(p => Boolean(p.is_featured || p.isFeatured));
    if (featured.length >= 12) {
      return featured.slice(0, 12);
    }
    const featuredIds = new Set(featured.map(f => f.id));
    const remaining = cleanList.filter(p => !featuredIds.has(p.id));
    return [...featured, ...remaining].slice(0, 12);
  }, [propProducts, storeProducts]);

  // Triple the items for infinite, seamless looping without blank gaps
  const displayItems = useMemo(() => {
    if (baseItems.length === 0) return [];
    return [...baseItems, ...baseItems, ...baseItems];
  }, [baseItems]);

  const totalBaseCount = baseItems.length;
  const totalSetWidth = totalBaseCount * SLOT_WIDTH;

  // Refs for high-performance 60fps linear scrolling without React re-render lags
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef<number>(0);
  const isHoveredRef = useRef<boolean>(false);
  const isManualPauseRef = useRef<boolean>(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchLastXRef = useRef<number | null>(null);

  // Synchronize ref flags
  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    isManualPauseRef.current = isManualPause;
  }, [isManualPause]);

  // Infinite 28s linear right-to-left auto-scroll with pause on hover
  useEffect(() => {
    if (totalBaseCount === 0 || totalSetWidth === 0) return;

    let animId: number;
    let lastTime = performance.now();
    const speed = totalSetWidth / LOOP_DURATION_SEC; // pixels per second

    const animate = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (!isHoveredRef.current && !isManualPauseRef.current && trackRef.current) {
        offsetRef.current = (offsetRef.current + speed * dt) % totalSetWidth;
        trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [totalBaseCount, totalSetWidth]);

  // Left arrow to nudge (nudge backwards by 1 card)
  const handleNudgeLeft = useCallback(() => {
    if (totalSetWidth === 0) return;
    offsetRef.current = (offsetRef.current - SLOT_WIDTH + totalSetWidth) % totalSetWidth;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
    }
  }, [totalSetWidth]);

  // Right arrow to nudge (nudge forwards by 1 card)
  const handleNudgeRight = useCallback(() => {
    if (totalSetWidth === 0) return;
    offsetRef.current = (offsetRef.current + SLOT_WIDTH) % totalSetWidth;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
    }
  }, [totalSetWidth]);

  // Touch drag support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    isHoveredRef.current = true;
    setIsHovered(true);
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchLastXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchLastXRef.current === null) return;
    const currentX = e.targetTouches[0].clientX;
    const deltaX = touchLastXRef.current - currentX;
    touchLastXRef.current = currentX;

    if (totalSetWidth > 0) {
      offsetRef.current = (offsetRef.current + deltaX + totalSetWidth) % totalSetWidth;
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
      }
    }
  };

  const handleTouchEnd = () => {
    isHoveredRef.current = false;
    setIsHovered(false);
    touchStartXRef.current = null;
    touchLastXRef.current = null;
  };

  if (baseItems.length === 0) {
    return null;
  }

  return (
    <div 
      id="top-trending-carousel"
      className="w-full bg-[#0a2e1f] border-2 sm:border-3 border-[#C8A165] rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden text-white my-2"
    >
      {/* Background Subtle Luxury Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C8A165]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C8A165]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-[#C8A165]/70 text-[#E0C18B] text-xs font-bold uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C8A165] animate-pulse" />
              <span>HANDPICKED FACTORY SELECTION</span>
            </div>

            {/* Title exact as requested: TOP TRENDING • AUTO-SCROLLING • 12 ITEMS */}
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#E0C18B] font-cinzel tracking-wider">
                TOP TRENDING • AUTO-SCROLLING • 12 ITEMS
              </h2>
            </div>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
              Continuous 28s live showcase of top-rated architectural hardware. Hover on any item to pause, use arrows to nudge, or click to inspect 4-angle views.
            </p>
          </div>

          {/* Navigation Controls: Nudge Arrows & Pause Indicator */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={() => setIsManualPause(!isManualPause)}
              className="px-3 py-2 rounded-xl bg-black/50 border border-[#C8A165]/60 text-[#E0C18B] text-xs font-bold flex items-center gap-1.5 hover:border-[#E0C18B] hover:bg-black/70 transition-all cursor-pointer shadow-md"
              title={isManualPause ? 'Resume auto-scroll' : 'Pause auto-scroll'}
            >
              {isManualPause || isHovered ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-[#C8A165]" />
                  <span>Paused</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#C8A165]" />
                  <span>28s Linear</span>
                </>
              )}
            </button>

            {/* Left Nudge Arrow */}
            <button
              type="button"
              onClick={handleNudgeLeft}
              className="w-10 h-10 rounded-xl bg-black/50 border border-[#C8A165]/70 hover:bg-[#C8A165] hover:text-[#0a2e1f] text-[#E0C18B] flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
              aria-label="Nudge left"
              title="Nudge Left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Nudge Arrow */}
            <button
              type="button"
              onClick={handleNudgeRight}
              className="w-10 h-10 rounded-xl bg-black/50 border border-[#C8A165]/70 hover:bg-[#C8A165] hover:text-[#0a2e1f] text-[#E0C18B] flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
              aria-label="Nudge right"
              title="Nudge Right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= CAROUSEL TRACK (INFINITE 28s SCROLL) ================= */}
        <div 
          className="relative overflow-hidden rounded-2xl py-3 select-none"
          onMouseEnter={() => {
            isHoveredRef.current = true;
            setIsHovered(true);
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
            setIsHovered(false);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            ref={trackRef}
            className="flex will-change-transform"
            style={{ 
              gap: `${CARD_GAP}px`,
              width: `${displayItems.length * SLOT_WIDTH}px`
            }}
          >
            {displayItems.map((prod, idx) => {
              // Primary image extraction
              let primaryImg = DEFAULT_FALLBACK_IMAGE;
              if (Array.isArray(prod.images) && prod.images.length > 0 && prod.images[0]) {
                primaryImg = prod.images[0];
              } else if (prod.image_main) {
                primaryImg = prod.image_main;
              } else if (prod.image) {
                primaryImg = prod.image;
              } else if (prod.imageBase64) {
                primaryImg = prod.imageBase64;
              }

              const formattedImg = formatImageSrc(primaryImg, DEFAULT_FALLBACK_IMAGE);
              const displayName = prod.productName || prod.name || 'Hardware Product';
              const displayCategory = prod.categoryName || prod.category || 'Architectural';
              const displaySku = prod.sku || `RHC-${prod.id.slice(-4)}`;
              const imagesCount = Array.isArray(prod.images) && prod.images.length > 0 ? prod.images.length : 4;

              return (
                <div 
                  key={`${prod.id}-${idx}`}
                  style={{ width: `${CARD_WIDTH}px`, minWidth: `${CARD_WIDTH}px`, maxWidth: `${CARD_WIDTH}px`, flexShrink: 0 }}
                  className="flex-shrink-0"
                >
                  <div
                    onClick={() => onSelectProduct(prod)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      const safeTitle = displayName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                      downloadWithWatermark(formattedImg, `${displaySku}-${safeTitle}.jpg`);
                    }}
                    className="w-[200px] h-full bg-[#0a2e1f] border-2 border-[#C8A165]/60 hover:border-[#E0C18B] rounded-2xl overflow-hidden p-0 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1 relative select-none"
                    title={`${displayName} - Click to view 4 photos`}
                  >
                    {/* Top Hardware Image Display: aspect-[4/5], overflow-hidden, p-0, bg-[#f5f3ef], rounded-t-2xl */}
                    <div 
                      className="w-full aspect-[4/5] bg-[#f5f3ef] rounded-t-2xl flex items-center justify-center p-0 overflow-hidden relative group-hover:border-[#E0C18B] transition-colors"
                      style={{
                        width: '100%',
                        aspectRatio: '4 / 5',
                        backgroundColor: '#f5f3ef',
                        padding: 0,
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={formattedImg}
                        alt={displayName}
                        onError={(e) => handleImageError(e, DEFAULT_FALLBACK_IMAGE)}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center'
                        }}
                        className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-300 pointer-events-none"
                        loading="lazy"
                      />

                      {/* Top Badges (SKU & Category Floating over image) */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none z-10">
                        <span className="text-[10px] font-mono font-bold text-[#E0C18B] bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded border border-[#C8A165]/40 truncate max-w-[95px]">
                          {displaySku}
                        </span>
                        <span className="text-[10px] font-bold text-[#E0C18B] bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded border border-[#C8A165]/40 uppercase tracking-wider truncate max-w-[90px]">
                          {displayCategory}
                        </span>
                      </div>

                      {/* 4 Views Pill Badge */}
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-black/80 text-[#E0C18B] text-[9px] font-bold pointer-events-none z-10 border border-[#C8A165]/40 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5 text-[#C8A165]" />
                        <span>{imagesCount} VIEWS</span>
                      </div>

                      {/* Hover Overlay Action */}
                      <div className="absolute inset-0 bg-[#0A2E24]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                        <span className="px-2.5 py-1 rounded-lg bg-[#0A2E24] text-[#E0C18B] text-[11px] font-bold border border-[#C8A165] flex items-center gap-1 shadow-md">
                          <Eye className="w-3 h-3" />
                          <span>View Detail</span>
                        </span>
                      </div>
                    </div>

                    {/* Product Name & Footer */}
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <h3 className="font-bold text-white text-xs line-clamp-2 min-h-[2rem] leading-snug group-hover:text-[#E0C18B] transition-colors text-left">
                        {displayName}
                      </h3>

                      <div className="pt-2 border-t border-[#C8A165]/30 flex items-center justify-between text-[10px] text-[#E0C18B]">
                        <span className="font-semibold text-gray-300 group-hover:text-white transition-colors">
                          High Durability
                        </span>
                        <span className="text-[#C8A165] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          <span>4 Angles</span>
                          <span>&rarr;</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carousel Footer Indicator */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#C8A165] animate-pulse" />
            <span>Hover on any card to pause auto-scroll &bull; Click to open 4-angle views &bull; Right-click to download</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#E0C18B] font-mono text-[11px]">
            <span>12 Featured Items &bull; Infinite 28s Loop</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default FeaturedProductsCarousel;
