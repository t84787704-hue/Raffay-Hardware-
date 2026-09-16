import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, X, ShoppingBag, Eye, Layers, Sparkles } from 'lucide-react';
import { ProductItem, Category } from '../types';
import { useHardwareStore } from '../context/HardwareStoreContext';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { FeaturedProductsCarousel } from './FeaturedProductsCarousel';
import { Product3ImagesGalleryModal } from './Product3ImagesGalleryModal';
import { SearchPicsDropdown } from './SearchPicsDropdown';
import { useProductSearch } from '../utils/productSearch';
import { 
  formatImageSrc, 
  handleImageError, 
  doesProductMatchCategory, 
  DEFAULT_FALLBACK_IMAGE, 
  downloadWithWatermark 
} from '../utils/imageUtils';

interface HardwareCatalogProps {
  initialCategory?: string;
  onSelectProduct?: (product: ProductItem) => void;
  onOpenQuoteModal?: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

/**
 * HardwareCatalog Component / Page
 * Rendered when user clicks "Hardware Catalog" in header.
 * 
 * 1. FIRST SECTION: FeaturedProductsCarousel (auto-hidden if 0 featured products selected)
 * 2. SECOND SECTION: Full Catalog Grid & Category Filters
 */
export function HardwareCatalog({
  initialCategory = 'top-trending',
  onSelectProduct,
  onOpenQuoteModal,
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery
}: HardwareCatalogProps) {
  const { categories, products } = useHardwareStore();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [localSearchInput, setLocalSearchInput] = useState<string>(propSearchQuery ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState<string>(propSearchQuery ?? '');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [galleryProduct, setGalleryProduct] = useState<ProductItem | null>(null);

  // Sync external search query
  useEffect(() => {
    if (propSearchQuery !== undefined) {
      setLocalSearchInput(propSearchQuery);
      setDebouncedQuery(propSearchQuery);
    }
  }, [propSearchQuery]);

  // 200ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(localSearchInput);
      if (propSetSearchQuery) {
        propSetSearchQuery(localSearchInput);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [localSearchInput, propSetSearchQuery]);

  // Click outside listener to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProductClick = (prod: ProductItem) => {
    setGalleryProduct(prod);
    if (onSelectProduct) {
      onSelectProduct(prod);
    }
  };

  // Combine products from Supabase/Store or fallback to INITIAL_PRODUCTS
  const displayableProducts = useMemo(() => {
    const rawList = products.length > 0 ? products : INITIAL_PRODUCTS;

    // Filter out buggy placeholders
    return rawList.filter((item) => {
      const combined = `${item.id} ${item.sku || ''} ${item.name || ''} ${item.productName || ''} ${item.image || ''} ${item.description || ''}`.toLowerCase();
      if (combined.includes('5032') || combined.includes('bus') || combined.includes('vehicle')) {
        return false;
      }
      return true;
    });
  }, [products]);

  // 12 products where is_featured=true (or latest 12 if less selected)
  const trendingProducts = useMemo(() => {
    const featured = displayableProducts.filter(p => Boolean(p.is_featured || p.isFeatured));
    if (featured.length >= 12) {
      return featured.slice(0, 12);
    }
    const featuredIds = new Set(featured.map(f => f.id));
    const remaining = displayableProducts.filter(p => !featuredIds.has(p.id));
    return [...featured, ...remaining].slice(0, 12);
  }, [displayableProducts]);

  // Fuse.js fuzzy search with threshold 0.4 and 200ms debounce
  const { results: searchSuggestions } = useProductSearch(displayableProducts, localSearchInput, 200);

  // Filter products based on selected category & search query (Fuse.js fuzzy search with 0.4 threshold)
  const filteredProducts = useMemo(() => {
    let list = displayableProducts;

    // Filter by category if not 'all' or 'top-trending'
    if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'top-trending') {
      list = list.filter(item => doesProductMatchCategory(item, selectedCategory));
    }

    // If debounced query is present, use Fuse.js results
    if (debouncedQuery.trim()) {
      const matchedIds = new Set(searchSuggestions.map(p => p.id));
      return list.filter(item => matchedIds.has(item.id));
    }

    return list;
  }, [displayableProducts, selectedCategory, debouncedQuery, searchSuggestions]);

  // Arrange category pills so Kitchen Accessories comes immediately after Top Trending
  const categoryPillsList = useMemo(() => {
    const list = [...categories];
    const kitchenIdx = list.findIndex(
      c => c.id === 'kitchen-accessories' || c.name.toLowerCase().includes('kitchen accessories')
    );
    if (kitchenIdx > -1) {
      const [kitchenCat] = list.splice(kitchenIdx, 1);
      return [kitchenCat, ...list];
    }
    return list;
  }, [categories]);

  // Clean active category name
  const activeCategoryName = useMemo(() => {
    if (selectedCategory === 'top-trending') return 'Top Trending';
    if (!selectedCategory || selectedCategory === 'all') return 'All Architectural Products';
    const found = categories.find(c => 
      c.id.toLowerCase() === selectedCategory.toLowerCase() ||
      c.name.toLowerCase() === selectedCategory.toLowerCase()
    );
    return found ? found.name : selectedCategory;
  }, [selectedCategory, categories]);

  return (
    <div className="w-full flex flex-col">
      {/* ============================================================ */}
      {/* HARDWARE CATALOG SECTION                                     */}
      {/* ============================================================ */}
      <section id="products" className="py-8 sm:py-12 bg-[#E8D5B7] text-left px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header & Controls Bar */}
          <div className="bg-[#0A2E24] p-5 sm:p-6 rounded-3xl border-2 border-[#C8A165] shadow-xl text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-[#C8A165]/50 text-[#E0C18B] text-xs font-bold uppercase tracking-wider mb-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#C8A165]" />
                  <span>Wholesale Catalog &bull; {displayableProducts.length} Items</span>
                </div>
                <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-[#E0C18B]">
                  Hardware Catalog
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
                  Browse complete architectural inventory. Click any item to inspect 4-angle views, wholesale specs, or right-click to download high-resolution photos.
                </p>
              </div>

              {/* Instant Search Bar */}
              <div ref={searchContainerRef} className="w-full md:w-80 relative">
                <Search className="w-4 h-4 text-[#C8A165] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={localSearchInput}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setLocalSearchInput(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  placeholder="Search SKU, name, material..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-[#C8A165]/50 text-white placeholder-gray-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#C8A165]"
                />
                {localSearchInput && (
                  <button
                    onClick={() => {
                      setLocalSearchInput('');
                      setDebouncedQuery('');
                      if (propSetSearchQuery) propSetSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Search Suggestions Dropdown: ONLY product pics, max 12, 4 columns, 80x80 uniform white boxes, click opens 4-angle modal */}
                {isSearchFocused && localSearchInput.trim().length > 0 && (
                  <SearchPicsDropdown
                    products={searchSuggestions}
                    onSelectProduct={(prod) => {
                      setIsSearchFocused(false);
                      handleProductClick(prod);
                    }}
                  />
                )}
              </div>
            </div>

            {/* Category Filter Pills Row */}
            <div className="mt-5 pt-4 border-t border-[#C8A165]/30">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#C8A165]">
                {/* 1. All Hardware Pill */}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-[#C8A165] text-[#0A2E24] shadow-md scale-105 font-extrabold'
                      : 'bg-black/30 text-gray-200 hover:bg-black/50 hover:text-[#E0C18B] border border-white/10'
                  }`}
                >
                  All Hardware ({displayableProducts.length})
                </button>

                {/* 2. 🔥 Top Trending (12) Pill - Inserted right after All Hardware and before Kitchen Accessories */}
                <button
                  onClick={() => setSelectedCategory('top-trending')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === 'top-trending'
                      ? 'bg-[#d4a574] text-[#0a2e1f] border-2 border-[#C8A165] shadow-[0_0_18px_rgba(212,165,116,0.9)] ring-2 ring-[#d4a574]/80 scale-105 font-extrabold'
                      : 'bg-[#d4a574] text-[#0a2e1f] hover:brightness-105 border border-[#d4a574] opacity-90 hover:opacity-100 hover:shadow-md'
                  }`}
                >
                  🔥 Top Trending (12)
                </button>

                {/* 3. Category Pills (Kitchen Accessories immediately after Top Trending, followed by other categories) */}
                {categoryPillsList.map((cat) => {
                  const isSelected = selectedCategory === cat.id || selectedCategory === cat.name;
                  const isKitchen = cat.id === 'kitchen-accessories' || cat.name.toLowerCase().includes('kitchen accessories');
                  const displayName = isKitchen ? 'Kitchen Accessories' : (cat.shortName || cat.name);

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#C8A165] text-[#0A2E24] shadow-md scale-105 font-extrabold'
                          : 'bg-black/30 text-gray-200 hover:bg-black/50 hover:text-[#E0C18B] border border-white/10'
                      }`}
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* VIEW SWITCHER: TOP TRENDING CAROUSEL vs NORMAL 3-COL GRID   */}
          {/* ============================================================ */}
          {selectedCategory === 'top-trending' ? (
            /* TOP TRENDING VIEW: ONLY FeaturedProductsCarousel with 12 items, auto-scrolling 28s */
            /* No static grid, no other content in this view - Sirf aur sirf scrolling pics */
            <FeaturedProductsCarousel 
              products={trendingProducts}
              onSelectProduct={handleProductClick} 
            />
          ) : (
            /* NORMAL CATEGORY VIEW: 3-column product grid with uniform size boxes */
            <>
              {/* Active Filter Indicator */}
              <div className="flex items-center justify-between px-2 text-xs font-bold text-[#0A2E24]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0A2E24]" />
                  <span className="uppercase tracking-wide">{activeCategoryName}</span>
                  <span className="text-gray-600 font-normal">({filteredProducts.length} items found)</span>
                </div>

                {(selectedCategory !== 'all' || debouncedQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('top-trending');
                      setLocalSearchInput('');
                      setDebouncedQuery('');
                      if (propSetSearchQuery) propSetSearchQuery('');
                    }}
                    className="text-[#0A2E24] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reset to Top Trending</span>
                  </button>
                )}
              </div>

              {/* Empty State */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-white/80 rounded-3xl border-2 border-dashed border-[#C5B08F] p-8 space-y-3 shadow-inner">
                  <div className="w-12 h-12 rounded-full bg-[#0A2E24]/10 text-[#0A2E24] flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-cinzel text-base font-bold text-[#0A2E24]">No Products Found</h3>
                  <p className="text-xs text-gray-600 max-w-sm mx-auto">
                    No items match your current category or search criteria. Try a different keyword or browse Top Trending.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('top-trending');
                      setLocalSearchInput('');
                      setDebouncedQuery('');
                      if (propSetSearchQuery) propSetSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0A2E24] text-[#E0C18B] text-xs font-bold hover:bg-[#124A3B] transition-colors cursor-pointer shadow-md"
                  >
                    View Top Trending
                  </button>
                </div>
              ) : (
                /* Normal 3-column Product Grid with Uniform Size Boxes */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                  {filteredProducts.map((prod) => {
                    const displayImage = (Array.isArray(prod.images) && prod.images.length > 0)
                      ? prod.images[0]
                      : (prod.images?.front || prod.image || prod.imageBase64 || DEFAULT_FALLBACK_IMAGE);

                    const safeTitle = (prod.productName || prod.name || 'rhc-product').toLowerCase().replace(/[^a-z0-9]/g, '-');

                    return (
                      <div
                        key={prod.id}
                        id={`product-card-${prod.id}`}
                        onClick={() => handleProductClick(prod)}
                        style={{ backgroundColor: '#5C4A3A' }}
                        className="rounded-2xl p-2.5 sm:p-3 border-2 border-[#5C4A3A] shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group text-white"
                      >
                        {/* Inner White Box for Hardware Display: aspect-[4/3] p-2.5 bg-white overflow-hidden */}
                        <div 
                          className="w-full aspect-[4/3] p-2.5 bg-white rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner"
                          style={{
                            width: '100%',
                            aspectRatio: '4 / 3',
                            backgroundColor: '#FFFFFF',
                            padding: '10px'
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            downloadWithWatermark(formatImageSrc(displayImage, DEFAULT_FALLBACK_IMAGE), `${safeTitle}.jpg`);
                          }}
                          title="Right-click to download image with RHC watermark"
                        >
                          <img
                            src={formatImageSrc(displayImage, DEFAULT_FALLBACK_IMAGE)}
                            alt={prod.productName || prod.name}
                            onError={(e) => handleImageError(e, DEFAULT_FALLBACK_IMAGE)}
                            style={{
                              width: '100%',
                              height: '100%',
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              objectPosition: 'center',
                              backgroundColor: '#FFFFFF'
                            }}
                            className="w-full h-full object-contain object-center bg-white group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />

                          {/* 4 Views Badge */}
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-bold text-[#E0C18B] border border-[#C8A165]/50 flex items-center gap-1 pointer-events-none">
                            <Layers className="w-3 h-3" />
                            <span>4 VIEWS</span>
                          </div>

                          {/* Quick Inspect Eye Overlay */}
                          <div className="absolute inset-0 bg-[#0A2E24]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1 rounded-full bg-[#0A2E24] text-[#E0C18B] text-[11px] font-bold border border-[#C8A165] shadow-lg flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-[#C8A165]" />
                              Inspect Specs
                            </span>
                          </div>
                        </div>

                        {/* Product Metadata */}
                        <div className="pt-2.5 pb-1 flex flex-col justify-between flex-1">
                          <div>
                            {prod.sku && (
                              <div className="text-[10px] font-mono font-bold text-[#E0C18B] tracking-wider uppercase mb-0.5 truncate">
                                SKU: {prod.sku}
                              </div>
                            )}
                            <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-2 uppercase tracking-tight group-hover:text-[#E0C18B] transition-colors leading-tight">
                              {prod.productName || prod.name}
                            </h3>
                          </div>

                          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-300">
                            <span className="truncate">{prod.material || prod.finish || 'Solid Alloy'}</span>
                            <span className="text-[#E0C18B] font-bold flex-shrink-0 ml-1">View Details &rarr;</span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </section>

      {/* 4-Images Modal Gallery on click */}
      <Product3ImagesGalleryModal
        product={galleryProduct}
        onClose={() => setGalleryProduct(null)}
      />
    </div>
  );
}

export default HardwareCatalog;
