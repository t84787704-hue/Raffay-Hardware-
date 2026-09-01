import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Layers, 
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Category, ProductItem } from '../types';
import { useHardwareStore } from '../context/HardwareStoreContext';
import { Product3ImagesGalleryModal } from './Product3ImagesGalleryModal';
import { formatImageSrc, handleImageError, doesProductMatchCategory, DEFAULT_FALLBACK_IMAGE } from '../utils/imageUtils';

interface CategoryProductPageProps {
  category: Category;
  onBackToCategories: () => void;
  onSelectAnotherCategory: (category: Category) => void;
  onOpenQuoteModal: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export function CategoryProductPage({
  category,
  onBackToCategories,
  onSelectAnotherCategory,
  searchQuery: parentSearchQuery = '',
  setSearchQuery: setParentSearchQuery
}: CategoryProductPageProps) {
  const { 
    categories, 
    products
  } = useHardwareStore();

  const [localSearch, setLocalSearch] = useState('');

  // 4-Images Gallery Modal
  const [galleryProduct, setGalleryProduct] = useState<ProductItem | null>(null);

  // All products belonging to this category
  const categoryProducts = useMemo(() => {
    return products.filter(p => doesProductMatchCategory(p, category));
  }, [products, category]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const query = (localSearch || parentSearchQuery).toLowerCase().trim();

    return categoryProducts.filter(item => {
      const nameVal = item.productName || item.name || '';
      return !query || nameVal.toLowerCase().includes(query);
    });
  }, [categoryProducts, localSearch, parentSearchQuery]);

  return (
    <div id="category-product-page" className="min-h-screen bg-[#E8D5B7] text-[#1E2923] pb-20">
      
      {/* 1. TOP BREADCRUMB NAVIGATION */}
      <div className="bg-[#E8D5B7] border-b border-[#D8C4A5] sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
          
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 font-medium">
            <button
              id="breadcrumb-home-link"
              onClick={onBackToCategories}
              className="hover:text-[#0A2E24] hover:underline cursor-pointer font-bold"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <button
              id="breadcrumb-categories-link"
              onClick={onBackToCategories}
              className="hover:text-[#0A2E24] hover:underline cursor-pointer font-bold"
            >
              Categories
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <span className="font-bold text-[#0A2E24] truncate max-w-[200px] sm:max-w-md">
              {category.name}
            </span>
          </nav>

        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        
        {/* 1. TOP CATEGORY PIC & TITLE CARD */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#DCC9A8] border border-[#C5B08F] shadow-sm text-left">
          <div className="flex flex-col items-center gap-4">
            
            {/* Category Cover Image: object-fit contain, background white, centered */}
            <div 
              style={{
                height: '240px',
                width: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px'
              }}
              className="w-full max-w-xl h-[200px] sm:h-[240px] md:h-[280px] rounded-2xl bg-white border border-gray-100 overflow-hidden flex items-center justify-center p-3 shadow-xs mx-auto"
            >
              <img
                src={formatImageSrc(category.image, DEFAULT_FALLBACK_IMAGE)}
                alt={`${category.name} Cover`}
                onError={(e) => handleImageError(e, DEFAULT_FALLBACK_IMAGE)}
                style={{
                  objectFit: 'contain',
                  height: '100%',
                  width: '100%',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF'
                }}
                className="w-full h-full object-contain rounded-xl bg-white"
                loading="eager"
              />
            </div>

            {/* Title & Listed Badge (Directly below Main Pic) */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#C5B08F]/50 pt-3">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-[#0A2E24] font-cinzel text-center sm:text-left tracking-wide">
                {category.name}
              </h1>
              <span className="text-xs font-bold text-[#0A2E24] bg-white/80 border border-[#0A2E24]/20 px-3 py-1 rounded-full whitespace-nowrap shadow-xs">
                {categoryProducts.length} {categoryProducts.length === 1 ? 'Product Listed' : 'Products Listed'}
              </span>
            </div>

          </div>
        </div>

        {/* 2. SEARCH BAR & SHOWING PRODUCTS COUNT (Directly below Main Pic / Title) */}
        <div className="sticky top-[53px] z-10 p-3 sm:p-4 rounded-xl bg-[#DCC9A8] border border-[#C5B08F] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              id="category-search-input"
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={`Search in ${category.name}...`}
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-white border border-[#C5B08F] text-xs text-[#0A2E24] placeholder-gray-500 focus:outline-none focus:border-[#0A2E24] focus:ring-1 focus:ring-[#0A2E24]"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          <div className="text-xs text-[#0A2E24] font-bold">
            Showing {filteredProducts.length} of {categoryProducts.length} products
          </div>
        </div>

        {/* 3. PRODUCTS GRID */}
        {filteredProducts.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#DCC9A8] border border-[#C5B08F] text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#0A2E24]/5 text-[#0A2E24] flex items-center justify-center mx-auto border border-[#C8A165]/30">
              <Package className="w-7 h-7 text-[#C8A165]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-cinzel text-base sm:text-lg font-bold text-[#0A2E24]">
                {localSearch || parentSearchQuery 
                  ? "No matching products found" 
                  : `No products in ${category.name.toUpperCase()} yet`}
              </h3>
              <p className="text-gray-500 text-xs max-w-md mx-auto">
                {localSearch || parentSearchQuery 
                  ? `No hardware found for "${localSearch || parentSearchQuery}". Try clearing your search filter.`
                  : `Please check back soon for updates or explore other wholesale categories.`}
              </p>
            </div>
            
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {(localSearch || parentSearchQuery) && (
                <button
                  onClick={() => {
                    setLocalSearch('');
                    if (setParentSearchQuery) setParentSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0A2E24] text-white font-bold text-xs hover:bg-[#124A3B] transition-colors cursor-pointer shadow-sm"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
            {filteredProducts.map((prod) => {
              const prodImg = (Array.isArray(prod.images) && prod.images.length > 0) 
                ? prod.images[0] 
                : (prod.image || prod.imageBase64 || (typeof prod.images === 'object' && prod.images ? (prod.images as any).front : ''));
              const prodDisplayName = prod.productName || prod.name;
              const imagesCount = Array.isArray(prod.images) ? prod.images.filter(Boolean).length : 1;

              return (
                <div
                  key={prod.id}
                  id={`product-card-${prod.id}`}
                  onClick={() => setGalleryProduct(prod)}
                  className="group rounded-2xl bg-[#DCC9A8] border border-[#C5B08F] hover:border-[#0A2E24] hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden text-left shadow-sm cursor-pointer relative"
                >
                  {/* Single Solid Product Image Container (White Background) */}
                  <div className="relative w-full aspect-square bg-white flex items-center justify-center p-3 overflow-hidden border-b border-[#C5B08F]/60">
                    <img
                      src={formatImageSrc(prodImg, DEFAULT_FALLBACK_IMAGE)}
                      alt={prodDisplayName}
                      onError={(e) => handleImageError(e, DEFAULT_FALLBACK_IMAGE)}
                      className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* 4 VIEWS Badge */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[#E0C18B] text-[10px] font-bold">
                      {imagesCount > 1 ? `${imagesCount} VIEWS` : '4 VIEWS'}
                    </div>
                  </div>

                  {/* Product Card Body: Product Name (Clean & Bold) */}
                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <h3 className="font-bold text-xs sm:text-sm text-[#0A2E24] line-clamp-2 leading-snug group-hover:text-black transition-colors">
                      {prodDisplayName}
                    </h3>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGalleryProduct(prod);
                      }}
                      className="w-full py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-[#FAF7F2] hover:bg-[#0A2E24] text-[#0A2E24] hover:text-white border border-[#C5B08F] transition-all cursor-pointer shadow-xs"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>View 4 Photos</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. DESCRIPTION & ABOUT SECTION AT VERY END / BOTTOM */}
        {(category.description || category.tagline || category.material || (category.popularFinishes && category.popularFinishes.length > 0) || (category.keyFeatures && category.keyFeatures.length > 0) || category.badge) && (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#DCC9A8] border border-[#C5B08F] shadow-sm text-left space-y-3.5">
            <div className="border-b border-[#C5B08F]/60 pb-2 flex items-center justify-between">
              <h3 className="font-cinzel text-sm sm:text-base font-bold text-[#0A2E24] uppercase tracking-wide">
                About {category.name}
              </h3>
              {category.badge && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#0A2E24] text-[#E0C18B] font-bold text-[10px] sm:text-[11px] border border-[#C8A165]/50">
                  {category.badge}
                </span>
              )}
            </div>

            {/* Description Paragraph */}
            {category.description && (
              <p className="text-gray-800 text-xs sm:text-sm leading-relaxed font-medium">
                {category.description}
              </p>
            )}

            {/* Tagline quote */}
            {category.tagline && (
              <p className="text-xs sm:text-sm text-[#0A2E24] font-medium italic bg-white/70 p-3 rounded-xl border-l-4 border-[#0A2E24]">
                "{category.tagline}"
              </p>
            )}

            {/* Key Features Points */}
            {category.keyFeatures && category.keyFeatures.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A2E24] block">
                  Key Specifications:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-800">
                  {category.keyFeatures.filter(Boolean).map((kf, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#0A2E24] font-bold">&bull;</span>
                      <span>{kf}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chips & Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#C5B08F]/60">
              {category.material && (
                <span className="px-2.5 py-1 rounded-lg bg-white/80 text-gray-900 font-semibold text-[11px] border border-gray-300">
                  Material: {category.material}
                </span>
              )}
              {category.popularFinishes && category.popularFinishes.length > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100/90 text-emerald-900 font-semibold text-[11px] border border-emerald-300">
                  Finishes: {category.popularFinishes.join(', ')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* EXPLORE OTHER CATEGORIES FOOTER */}
        <div className="p-5 rounded-2xl bg-[#DCC9A8] border border-[#C5B08F] space-y-3 text-left shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-cinzel text-sm sm:text-base font-bold text-[#0A2E24] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C8A165]" />
              <span>Other Hardware Categories</span>
            </h4>
            <button
              onClick={onBackToCategories}
              className="text-xs text-[#0A2E24] hover:underline font-bold cursor-pointer"
            >
              All Categories &rarr;
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((c) => {
              const isActive = c.id === category.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectAnotherCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-[#0A2E24] text-white border-[#0A2E24]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4-IMAGES GALLERY MODAL (Pure View-Only) */}
      <Product3ImagesGalleryModal
        product={galleryProduct}
        onClose={() => setGalleryProduct(null)}
      />

    </div>
  );
}

