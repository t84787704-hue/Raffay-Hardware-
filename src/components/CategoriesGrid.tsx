import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Category } from '../types';
import { useHardwareStore } from '../context/HardwareStoreContext';
import { 
  formatImageSrc, 
  handleImageError,
  PLACEHOLDER_HANDLE_IMAGE
} from '../utils/imageUtils';

interface CategoriesGridProps {
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  onViewCategorySKUs?: (category: Category) => void;
  onOpenQuoteModalWithCategory?: (categoryName: string) => void;
}

export function CategoriesGrid({
  selectedCategory,
  onSelectCategory,
  onViewCategorySKUs,
  onOpenQuoteModalWithCategory
}: CategoriesGridProps) {
  const navigate = useNavigate();
  const { categories } = useHardwareStore();

  // Show ALL categories from Firestore / store (all categories, sorted by custom order)
  const allCategories = React.useMemo(() => {
    return categories
      .filter(c => {
        const name = (c.name || '').toLowerCase().trim();
        const id = (c.id || '').toLowerCase().trim();
        if (name.includes('my shop') || id.includes('my shop') || name.includes('myshop')) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : 9999;
        const orderB = typeof b.order === 'number' ? b.order : 9999;
        return orderA - orderB;
      });
  }, [categories]);

  const handleCardClick = (cat: Category) => {
    if (onViewCategorySKUs) {
      onViewCategorySKUs(cat);
    } else if (onSelectCategory) {
      onSelectCategory(cat.id);
      navigate(`/category/${encodeURIComponent(cat.id)}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(`/category/${encodeURIComponent(cat.id)}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="categories" 
      className="bg-[#E8D5B7] flex justify-center w-full min-w-0 overflow-hidden py-3 sm:py-6"
    >
      {/* Outer wrapper: padding: 12px (8px on <380px), max-width: 100%, margin: 0 auto */}
      <div className="w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto px-2 sm:px-3 box-border min-w-0">
        
        {/* Category Grid: 2 columns, gap: 12px (8px on <380px), width: 100% */}
        <div className="grid grid-cols-2 gap-2 min-[380px]:gap-3 w-full min-w-0 box-border">
          {allCategories.map((cat) => {
            const displayName = cat.name || cat.shortName || 'Hardware Category';
            const catImage = cat.image || cat.icon || PLACEHOLDER_HANDLE_IMAGE;

            return (
              <div
                key={cat.id}
                id={`category-card-${cat.id}`}
                onClick={() => handleCardClick(cat)}
                style={{
                  backgroundColor: '#5C4A3A',
                  border: '4px solid #5C4A3A',
                  borderRadius: '16px',
                  aspectRatio: '1 / 1.2',
                  minWidth: 0,
                  width: '100%',
                  overflow: 'hidden'
                }}
                className="shadow-sm hover:shadow-md transition-transform duration-200 active:scale-95 hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-between box-border"
              >
                {/* Card image container: height 70%, background white, object-fit contain, rounded */}
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
                    src={formatImageSrc(catImage, PLACEHOLDER_HANDLE_IMAGE)}
                    alt={displayName}
                    onError={(e) => handleImageError(e, PLACEHOLDER_HANDLE_IMAGE)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                    className="rounded-md bg-white block"
                    loading="lazy"
                  />
                </div>

                {/* Card text: font-size: clamp(10px, 2.8vw, 12px), padding: 6px, text-center, white-space: normal, line-height: 1.2 */}
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
                    {displayName}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
