import React from 'react';
import { ProductItem } from '../types';
import { formatImageSrc, handleImageError } from '../utils/imageUtils';

interface SearchPicsDropdownProps {
  products: ProductItem[];
  onSelectProduct: (product: ProductItem) => void;
  isLoading?: boolean;
}

export const SearchPicsDropdown: React.FC<SearchPicsDropdownProps> = ({
  products,
  onSelectProduct,
  isLoading = false
}) => {
  const displayProducts = products.slice(0, 12);
  const count = displayProducts.length;

  return (
    <div 
      className="absolute left-0 right-0 sm:left-auto sm:right-0 w-full sm:w-[380px] top-full mt-2 bg-white border-2 border-[#0a2e1f] rounded-2xl shadow-2xl overflow-hidden z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150"
      style={{ borderColor: '#0a2e1f' }}
    >
      {/* Minimal Header: Only show count */}
      <div className="px-3.5 py-2 border-b border-gray-100 flex items-center justify-between text-xs font-bold text-[#0a2e1f] bg-gray-50/80 select-none">
        <span>{isLoading ? 'Searching...' : `${count} ${count === 1 ? 'pic' : 'pics'} found`}</span>
      </div>

      {/* Grid of Product Pics: 4 columns, max 12 pics (3 rows), 80x80px white boxes, 8px padding, object-fit contain, rounded corners, NO text */}
      {count > 0 ? (
        <div className="p-3 grid grid-cols-4 gap-2.5 place-items-center bg-white">
          {displayProducts.map((prod) => {
            const imgSrc = formatImageSrc(prod.images?.front || prod.image);

            return (
              <button
                key={prod.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProduct(prod);
                }}
                className="w-[80px] h-[80px] min-w-[80px] min-h-[80px] max-w-[80px] max-h-[80px] bg-white rounded-xl p-[8px] border border-gray-200 hover:border-[#0a2e1f] hover:shadow-md hover:scale-[1.03] transition-all cursor-pointer flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#0a2e1f]"
                title=""
                aria-label="View 4-angle product pictures"
              >
                <img
                  src={imgSrc}
                  alt=""
                  className="w-full h-full object-contain object-center bg-white pointer-events-none"
                  onError={handleImageError}
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-gray-500 font-medium bg-white">
          No pics found
        </div>
      )}
    </div>
  );
};
