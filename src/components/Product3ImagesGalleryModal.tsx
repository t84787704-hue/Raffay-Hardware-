import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Eye,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ArrowLeft
} from 'lucide-react';
import { ProductItem } from '../types';
import { formatImageSrc, handleImageError, DEFAULT_FALLBACK_IMAGE } from '../utils/imageUtils';

interface Product3ImagesGalleryModalProps {
  product: ProductItem | null;
  onClose: () => void;
}

const VIEW_LABELS = [
  'Main - Front View',
  'Side View',
  'Back View',
  'Detail View'
];

export function Product3ImagesGalleryModal({ product, onClose }: Product3ImagesGalleryModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Reset selected index & zoom when product changes
  useEffect(() => {
    setSelectedIndex(0);
    setIsZoomed(false);
  }, [product?.id]);

  if (!product) return null;

  // Extract all valid images from product (up to 4)
  let rawImages: string[] = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    rawImages = product.images.filter(Boolean);
  } else if (typeof product.images === 'object' && product.images !== null) {
    rawImages = [
      (product.images as any).front,
      (product.images as any).side,
      (product.images as any).installed,
      (product.images as any).back
    ].filter(Boolean);
  }

  if (rawImages.length === 0) {
    const single = product.image || product.imageBase64;
    if (single) rawImages = [single];
  }

  if (rawImages.length === 0) {
    rawImages = [DEFAULT_FALLBACK_IMAGE];
  }

  // Format all images
  const imagesList = rawImages.map((img) => formatImageSrc(img, DEFAULT_FALLBACK_IMAGE));
  const activeImage = imagesList[selectedIndex] || imagesList[0] || DEFAULT_FALLBACK_IMAGE;

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % imagesList.length);
    setIsZoomed(false);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
    setIsZoomed(false);
  };

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const prodName = product.productName || product.name || 'Hardware Product';
  const catName = product.categoryName || product.category || 'Hardware';

  return (
    <div 
      id="product-gallery-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl border-2 border-[#C8A165] shadow-2xl overflow-hidden my-auto text-left flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Ribbon */}
        <div className="bg-[#0A2E24] px-4 sm:px-5 py-3 flex items-center justify-between border-b border-[#C8A165]/30 text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C8A165] animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-[#E0C18B] uppercase tracking-wider font-cinzel">
              {catName}
            </span>
          </div>
          
          <button
            id="btn-close-gallery-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#C8A165] hover:text-[#0A2E24] text-white flex items-center justify-center transition-all cursor-pointer text-base font-bold"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Simplified Single-Column Flow with Clean Visuals */}
        <div className="overflow-y-auto p-4 sm:p-6 flex flex-col space-y-4">
          
          {/* ================= 4-IMAGE GALLERY STAGE ================= */}
          <div className="bg-[#061D17] p-3.5 sm:p-4 rounded-2xl border border-[#C8A165]/30 flex flex-col space-y-3">
            
            {/* View Indicator Pill */}
            <div className="flex items-center justify-between text-white px-1">
              <div className="flex items-center gap-1.5 bg-[#0A2E24] px-3 py-1 rounded-xl border border-[#C8A165]/40 shadow-xs">
                <Eye className="w-3.5 h-3.5 text-[#C8A165]" />
                <span className="text-xs font-bold text-[#E0C18B]">
                  {VIEW_LABELS[selectedIndex] || `Image ${selectedIndex + 1}`}
                </span>
              </div>

              <span className="text-xs font-mono font-bold text-gray-300">
                {selectedIndex + 1} of {imagesList.length}
              </span>
            </div>

            {/* Main Stage Big Image with Swipe & Zoom */}
            <div 
              className="relative aspect-square sm:aspect-[4/3] rounded-xl overflow-hidden bg-white border-2 border-[#C8A165]/40 flex items-center justify-center group shadow-inner touch-pan-y select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={activeImage}
                alt={`${prodName} - View ${selectedIndex + 1}`}
                onError={(e) => handleImageError(e, DEFAULT_FALLBACK_IMAGE)}
                className={`w-full h-full object-contain bg-white transition-all duration-300 ${
                  isZoomed ? 'scale-175 cursor-zoom-out z-10' : 'group-hover:scale-105 cursor-zoom-in'
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
              />

              {/* Prev & Next Arrow Buttons */}
              {imagesList.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrev();
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-[#C8A165] hover:text-[#0A2E24] text-white flex items-center justify-center transition-all opacity-85 hover:opacity-100 cursor-pointer shadow-lg z-20"
                    title="Previous Image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-[#C8A165] hover:text-[#0A2E24] text-white flex items-center justify-center transition-all opacity-85 hover:opacity-100 cursor-pointer shadow-lg z-20"
                    title="Next Image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Zoom Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(!isZoomed);
                }}
                className="absolute bottom-2.5 right-2.5 bg-black/70 hover:bg-black text-white px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5 backdrop-blur-sm transition-all cursor-pointer z-20 shadow-md border border-white/20"
              >
                {isZoomed ? (
                  <>
                    <ZoomOut className="w-3.5 h-3.5 text-[#C8A165]" />
                    <span>Reset</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-3.5 h-3.5 text-[#C8A165]" />
                    <span>Zoom</span>
                  </>
                )}
              </button>

              {/* Mobile Swipe Hint */}
              <div className="absolute bottom-2.5 left-2.5 sm:hidden bg-black/60 text-white/80 text-[10px] px-2 py-0.5 rounded-md pointer-events-none">
                Swipe &larr; &rarr;
              </div>
            </div>

            {/* ================= 4 THUMBNAILS IN A ROW ================= */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {Array.from({ length: 4 }).map((_, idx) => {
                const img = imagesList[idx];
                const isActive = selectedIndex === idx;
                const label = VIEW_LABELS[idx] || `View ${idx + 1}`;

                if (!img) {
                  return (
                    <div
                      key={idx}
                      className="aspect-square rounded-xl bg-[#0A2E24]/30 border border-white/10 flex flex-col items-center justify-center p-1 opacity-40 text-center"
                    >
                      <span className="text-[9px] text-gray-400 font-medium">Slot {idx + 1}</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedIndex(idx);
                      setIsZoomed(false);
                    }}
                    className={`relative aspect-square rounded-xl overflow-hidden p-1 transition-all cursor-pointer bg-white border-2 flex flex-col items-center justify-center ${
                      isActive
                        ? 'border-[#C8A165] ring-2 ring-[#C8A165] shadow-lg scale-102'
                        : 'border-white/20 opacity-70 hover:opacity-100 hover:border-white/50'
                    }`}
                  >
                    <img
                      src={img}
                      alt={label}
                      className="w-full h-full object-contain"
                    />

                    {isActive && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C8A165]" />
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-[#0A2E24]/90 text-[8px] font-bold text-[#E0C18B] text-center py-0.5 truncate px-0.5">
                      {idx === 0 ? '1. Front' : idx === 1 ? '2. Side' : idx === 2 ? '3. Back' : '4. Detail'}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

          {/* ================= PRODUCT NAME & ESSENTIAL ACTIONS ================= */}
          <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#D8C4A5] space-y-3">
            
            {/* Category Tag */}
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#0A2E24] bg-[#C8A165]/20 px-2.5 py-0.5 rounded-md border border-[#C8A165]/30">
              {catName}
            </span>

            {/* Product Title (Clean, Bold, Prominent) */}
            <h2 className="text-xl sm:text-2xl font-black text-[#0A2E24] leading-snug font-cinzel">
              {prodName}
            </h2>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="button"
                id="btn-back-to-products"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-[#0A2E24] text-[#E0C18B] border border-[#C8A165] hover:bg-[#124A3B] transition-all cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-[#C8A165]" />
                <span>Back to Products</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
