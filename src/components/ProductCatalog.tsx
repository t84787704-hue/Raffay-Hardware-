import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ProductItem } from '../types';
import { useHardwareStore } from '../context/HardwareStoreContext';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { Product3ImagesGalleryModal } from './Product3ImagesGalleryModal';
import { formatImageSrc, handleImageError, doesProductMatchCategory, DEFAULT_FALLBACK_IMAGE } from '../utils/imageUtils';

interface ProductCatalogProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenQuoteModal?: () => void;
}

export function ProductCatalog({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  setSearchQuery,
  onOpenQuoteModal
}: ProductCatalogProps) {
  const { categories, products } = useHardwareStore();
  const [galleryProduct, setGalleryProduct] = useState<ProductItem | null>(null);

  // Use Firestore products if available; otherwise fallback to baseline INITIAL_PRODUCTS
  const displayableProducts = useMemo(() => {
    const rawList = products.length > 0 ? products : INITIAL_PRODUCTS;

    // Filter out buggy placeholders (like 5032, bus/car, or non-hardware placeholder entries)
    return rawList.filter((item) => {
      const combined = `${item.id} ${item.sku || ''} ${item.name || ''} ${item.productName || ''} ${item.image || ''} ${item.description || ''}`.toLowerCase();
      if (combined.includes('5032') || combined.includes('bus') || combined.includes('vehicle')) {
        return false;
      }
      return true;
    });
  }, [products]);

  // Filter products based on selected category & search query
  const filteredProducts = useMemo(() => {
    return displayableProducts.filter((item) => {
      const matchesCategory = 
        !selectedCategory || selectedCategory === 'all' || doesProductMatchCategory(item, selectedCategory);
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (item.productName || item.name || '').toLowerCase().includes(q) ||
        (item.categoryName || '').toLowerCase().includes(q) ||
        (item.sku || '').toLowerCase().includes(q) ||
        (item.material || '').toLowerCase().includes(q) ||
        (item.finish || '').toLowerCase().includes(q) ||
        (item.tags || []).some(t => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [displayableProducts, selectedCategory, searchQuery]);

  return (
    <section id="products" className="py-4 sm:py-6 bg-[#E8D5B7] flex justify-center text-left">
      
      {/* Main container: Matching Wabi style light beige #D8C4A5, responsive padding and width */}
      <div 
        style={{ backgroundColor: '#D8C4A5', borderRadius: '20px' }}
        className="w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto px-3 py-3.5 sm:px-4 sm:py-4 shadow-md border border-[#C5B08F] flex flex-col gap-3 min-w-0 box-border"
      >
        
        {/* Section Header / Active Filter status */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#0A2E24] flex-shrink-0" />
            <h3 className="font-cinzel text-xs sm:text-sm font-black text-[#0A2E24] tracking-wider uppercase truncate">
              {searchQuery ? `Search: "${searchQuery}"` : selectedCategory && selectedCategory !== 'all' ? 'Category Items' : 'All Products'}
            </h3>
          </div>

          {(selectedCategory !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                onSelectCategory('all');
                setSearchQuery('');
              }}
              className="text-[10px] font-bold text-[#0A2E24] hover:underline cursor-pointer flex-shrink-0 ml-2"
            >
              Show All
            </button>
          )}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 bg-white/70 rounded-2xl border border-dashed border-[#5A4A3A]/30 space-y-2 p-4">
            <div className="w-8 h-8 rounded-full bg-[#0A2E24]/10 text-[#0A2E24] flex items-center justify-center mx-auto">
              <Search className="w-4 h-4" />
            </div>
            <p className="text-[#0A2E24] text-xs font-bold">No products found</p>
            <p className="text-[#0A2E24]/80 text-[10px]">
              Try a different keyword or reset filters.
            </p>
            <button
              onClick={() => {
                onSelectCategory('all');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-lg bg-[#0A2E24] text-[#E0C18B] text-[10px] font-bold shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Product Grid: 2 columns, responsive gap */
          <div className="grid grid-cols-2 gap-2 min-[380px]:gap-3 w-full min-w-0 box-border">
            {filteredProducts.map((prod) => {
              const displayImage = (Array.isArray(prod.images) && prod.images.length > 0)
                ? prod.images[0]
                : (prod.images?.front || prod.image || prod.imageBase64 || DEFAULT_FALLBACK_IMAGE);

              return (
                <div
                  key={prod.id}
                  id={`product-card-${prod.id}`}
                  onClick={() => setGalleryProduct(prod)}
                  style={{
                    backgroundColor: '#5C4A3A',
                    border: '4px solid #5C4A3A',
                    borderRadius: '16px',
                    aspectRatio: '1 / 1.2',
                    minWidth: 0,
                    width: '100%',
                    overflow: 'hidden'
                  }}
                  className="shadow hover:shadow-lg transition-transform duration-200 active:scale-95 hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-between box-border"
                >
                  {/* Inner white box: white bg, object-fit contain */}
                  <div 
                    style={{
                      height: '70%',
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      padding: '4px'
                    }}
                    className="flex items-center justify-center shadow-inner"
                  >
                    <img
                      src={formatImageSrc(displayImage, DEFAULT_FALLBACK_IMAGE)}
                      alt={prod.productName || prod.name}
                      onError={(e) => handleImageError(e, DEFAULT_FALLBACK_IMAGE)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                      className="rounded-md bg-white block"
                      loading="lazy"
                    />
                  </div>

                  {/* Below: Product name in white clamp typography */}
                  <div 
                    style={{
                      height: '30%',
                      width: '100%',
                      padding: '4px 6px',
                      lineHeight: '1.2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center'
                    }}
                    className="w-full box-border"
                  >
                    <span 
                      style={{
                        fontSize: 'clamp(10px, 2.8vw, 12px)',
                        whiteSpace: 'normal',
                        lineHeight: '1.2',
                        wordBreak: 'break-word'
                      }}
                      className="text-white font-bold text-center line-clamp-2 uppercase tracking-tight"
                    >
                      {prod.productName || prod.name}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Product Detail Modal on click */}
      <Product3ImagesGalleryModal
        product={galleryProduct}
        onClose={() => setGalleryProduct(null)}
      />

    </section>
  );
}
