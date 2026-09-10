import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Layers, 
  TrendingUp, 
  Pause, 
  Play,
  Star
} from 'lucide-react';
import { ProductItem } from '../types';
import { useHardwareStore } from '../context/HardwareStoreContext';
import { getFeaturedProducts } from '../services/supabaseProducts';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { formatImageSrc, handleImageError, DEFAULT_FALLBACK_IMAGE, downloadWithWatermark } from '../utils/imageUtils';

interface FeaturedProductsCarouselProps {
  onSelectProduct: (product: ProductItem) => void;
}

export function FeaturedProductsCarousel({ onSelectProduct }: FeaturedProductsCarouselProps) {
  const { products: storeProducts } = useHardwareStore();
  // Always initialize with featured products (don't auto-fill with latest non-featured products)
  const [products, setProducts] = useState<ProductItem[]>(() => {
    if (storeProducts && storeProducts.length > 0) {
      const feat = storeProducts.filter(p => Boolean(p.is_featured || p.isFeatured)).slice(0, 12);
      if (feat.length > 0) return feat;
    }
    return INITIAL_PRODUCTS.filter(p => Boolean(p.is_featured || p.isFeatured)).slice(0, 12);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isManualPause, setIsManualPause] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch from products where is_featured = true limit 12 order by updated_at desc
  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedProducts() {
      try {
        const featured = await getFeaturedProducts(12);
        
        if (!isMounted) return;

        if (featured && featured.length > 0) {
          // If less than 12 featured selected, show ONLY those selected (don't auto-fill with latest)
          setProducts(featured.slice(0, 12));
        } else if (storeProducts && storeProducts.length > 0) {
          const storeFeatured = storeProducts.filter(p => Boolean(p.is_featured || p.isFeatured)).slice(0, 12);
          if (storeFeatured.length > 0) {
            setProducts(storeFeatured);
          } else {
            setProducts(INITIAL_PRODUCTS.filter(p => Boolean(p.is_featured || p.isFeatured)).slice(0, 12));
          }
        } else {
          setProducts(INITIAL_PRODUCTS.filter(p => Boolean(p.is_featured || p.isFeatured)).slice(0, 12));
        }
      } catch (err) {
        console.warn('[FeaturedProductsCarousel] Fetch notice, using fallback featured products:', err);
        if (isMounted) {
          const storeFeatured = (storeProducts || []).filter(p => Boolean(p.is_featured || p.isFeatured)).slice(0, 12);
          if (storeFeatured.length > 0) {
            setProducts(storeFeatured);
          } else {
            setProducts(INITIAL_PRODUCTS.filter(p => Boolean(p.is_featured || p.isFeatured)).slice(0, 12));
          }
        }
      }
    }

    loadFeaturedProducts();

    return () => {
      isMounted = false;
    };
  }, [storeProducts]);

  // 2. Responsive items per view: mobile 1, tablet 2, desktop 4
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setItemsPerView(1);
      } else if (width < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show only selected featured products (max 12)
  const baseItems = useMemo(() => {
    return products.slice(0, 12);
  }, [products]);

  // Seamless infinite loop helper
  const displayItems = useMemo(() => {
    if (baseItems.length === 0) return [];
    if (baseItems.length < 4) {
      const quad = [...baseItems, ...baseItems, ...baseItems, ...baseItems];
      return [...quad, ...quad];
    }
    return [...baseItems, ...baseItems, ...baseItems];
  }, [baseItems]);

  const totalBaseCount = baseItems.length;

  // Initialize starting index in the middle set for seamless looping
  useEffect(() => {
    if (totalBaseCount > 0) {
      setCurrentIndex(totalBaseCount);
    }
  }, [totalBaseCount]);

  // Advance next card
  const handleNext = useCallback(() => {
    if (totalBaseCount === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, [totalBaseCount]);

  // Go to previous card
  const handlePrev = useCallback(() => {
    if (totalBaseCount === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, [totalBaseCount]);

  // 3. Infinite loop boundary reset: seamlessly jump without animation
  useEffect(() => {
    if (totalBaseCount === 0) return;

    if (currentIndex >= totalBaseCount * 2) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(currentIndex - totalBaseCount);
      }, 700);
      return () => clearTimeout(timer);
    }

    if (currentIndex <= 0) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(currentIndex + totalBaseCount);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, totalBaseCount]);

  // 4. Auto-scroll right to left every 2 seconds, pause on hover or manual pause
  useEffect(() => {
    if (isHovered || isManualPause || totalBaseCount === 0) return;

    const interval = setInterval(() => {
      handleNext();
    }, 2000);

    return () => clearInterval(interval);
  }, [isHovered, isManualPause, totalBaseCount, handleNext]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsHovered(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Calculate slide offset percentage
  const cardWidthPercent = 100 / itemsPerView;
  const transformStyle = {
    transform: `translateX(-${currentIndex * cardWidthPercent}%)`,
    transition: isTransitioning ? 'transform 700ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
  };

  return (
    <section 
      id="featured-products"
      className="w-full py-8 sm:py-12 px-3 sm:px-6 lg:px-8 bg-[#0a2e1f] text-white border-y-4 border-[#C8A165] shadow-2xl relative overflow-hidden my-0"
    >
      {/* Background Subtle Luxury Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C8A165]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C8A165]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-[#C8A165]/70 text-[#E0C18B] text-xs font-bold uppercase tracking-widest mb-2">
              <Star className="w-3.5 h-3.5 fill-[#C8A165] text-[#C8A165]" />
              <span>Trending Now • {baseItems.length} Featured Product{baseItems.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Main Title - Prominent Heading */}
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#E0C18B] font-cinzel tracking-wide">
                Featured Products
              </h2>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-[#C8A165] text-[#0A2E24] uppercase tracking-wider">
                Trending Now
              </span>
            </div>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
              Engineered for endurance and luxury aesthetics. Explore top-selling hardware straight from our manufacturing line.
            </p>
          </div>

          {/* Navigation Controls & Hover Hint */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Play/Pause indicator */}
            <button
              type="button"
              onClick={() => setIsManualPause(!isManualPause)}
              className="px-3 py-1.5 rounded-lg bg-black/40 border border-[#C8A165]/40 text-[#E0C18B] text-xs font-medium flex items-center gap-1.5 hover:border-[#C8A165] transition-all cursor-pointer"
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
                  <span>Auto-Moving</span>
                </>
              )}
            </button>

            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrev}
              className="w-10 h-10 rounded-xl bg-black/40 border border-[#C8A165]/60 hover:bg-[#C8A165] hover:text-[#0A2E24] text-[#E0C18B] flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
              aria-label="Previous product"
              title="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              className="w-10 h-10 rounded-xl bg-black/40 border border-[#C8A165]/60 hover:bg-[#C8A165] hover:text-[#0A2E24] text-[#E0C18B] flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
              aria-label="Next product"
              title="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= CAROUSEL TRACK (INFINITE MARQUEE) ================= */}
        <div 
          ref={containerRef}
          className="relative overflow-hidden rounded-2xl py-2 select-none"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="flex"
            style={transformStyle}
          >
            {displayItems.map((prod, idx) => {
              // Extract primary clean image (4-angles first image)
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
              const displayCategory = prod.categoryName || prod.category || 'Architectural Hardware';
              const displaySku = prod.sku || `RHC-${prod.id.slice(-4)}`;
              const imagesCount = Array.isArray(prod.images) && prod.images.length > 0 ? prod.images.length : 4;

              return (
                <div 
                  key={`${prod.id}-${idx}`}
                  style={{ width: `${cardWidthPercent}%`, flexShrink: 0 }}
                  className="px-2 sm:px-2.5"
                >
                  <div
                    onClick={() => onSelectProduct(prod)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      const safeTitle = displayName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                      downloadWithWatermark(formattedImg, `${displaySku}-${safeTitle}.jpg`);
                    }}
                    className="h-full bg-[#0a2e1f] border-2 border-[#C8A165]/50 hover:border-[#E0C18B] rounded-2xl p-3.5 sm:p-4 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1 relative"
                    title={`${displayName} - Click to view 4 photos`}
                  >
                    {/* Top Meta: SKU Badge & Category */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#E0C18B] bg-black/50 px-2 py-0.5 rounded border border-[#C8A165]/40 truncate max-w-[120px]">
                        {displaySku}
                      </span>

                      <span className="text-[10px] sm:text-[11px] font-bold text-[#C8A165] uppercase tracking-wider truncate max-w-[120px]">
                        {displayCategory}
                      </span>
                    </div>

                    {/* Clean Product Image Container (White Background) */}
                    <div className="relative aspect-square w-full bg-white rounded-xl p-3 flex items-center justify-center overflow-hidden border border-[#C8A165]/30 mb-3 shadow-inner group-hover:border-[#C8A165] transition-colors">
                      <img
                        src={formattedImg}
                        alt={displayName}
                        onError={(e) => handleImageError(e, DEFAULT_FALLBACK_IMAGE)}
                        className="w-full h-full object-contain bg-white group-hover:scale-108 transition-transform duration-300 pointer-events-none"
                        loading="lazy"
                      />

                      {/* 4 Views / Clean Pill Badge */}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[#E0C18B] text-[10px] font-bold pointer-events-none z-10 border border-[#C8A165]/30 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5 text-[#C8A165]" />
                        <span>{imagesCount} VIEWS</span>
                      </div>

                      {/* Hover Overlay Action */}
                      <div className="absolute inset-0 bg-[#0A2E24]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                        <span className="px-3 py-1.5 rounded-lg bg-[#0A2E24] text-[#E0C18B] text-xs font-bold border border-[#C8A165] flex items-center gap-1.5 shadow-lg">
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Detail</span>
                        </span>
                      </div>
                    </div>

                    {/* Product Name & Footer Action */}
                    <div className="space-y-2 flex-1 flex flex-col justify-between">
                      <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-[#E0C18B] transition-colors min-h-[2.5rem]">
                        {displayName}
                      </h3>

                      <div className="pt-2 border-t border-[#C8A165]/30 flex items-center justify-between text-xs text-[#E0C18B]">
                        <span className="font-semibold text-[11px] text-gray-300 group-hover:text-white transition-colors">
                          High Durability
                        </span>
                        <span className="text-[#C8A165] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
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
        <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#C8A165] animate-pulse" />
            <span>Hover on any card to pause auto-scroll • Right-click or open to download</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[#E0C18B] font-mono">
            <span>Showing latest {baseItems.length} items</span>
          </div>
        </div>

      </div>
    </section>
  );
}
export default FeaturedProductsCarousel;
