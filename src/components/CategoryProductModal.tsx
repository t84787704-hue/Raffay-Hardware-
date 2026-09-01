import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Check, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { Category, ProductItem } from '../types';
import { ProductFourImagesUploader } from './admin/ProductFourImagesUploader';

interface CategoryProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<ProductItem>) => Promise<void> | void;
  category: Category;
  initialData?: ProductItem | null;
}

export function CategoryProductModal({
  isOpen,
  onClose,
  onSave,
  category,
  initialData
}: CategoryProductModalProps) {
  // Only 2 user input states: Product Name + 4 Images
  const [productName, setProductName] = useState('');
  const [images, setImages] = useState<string[]>(['', '', '', '']);

  // Submission State
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setProductName(initialData.name || initialData.productName || '');

      // Initialize 4-image array with backward compatibility
      let initialImgs: string[] = [];
      if (Array.isArray(initialData.images) && initialData.images.length > 0) {
        initialImgs = [...initialData.images];
      } else if (typeof initialData.images === 'object' && initialData.images !== null) {
        initialImgs = [
          (initialData.images as any).front,
          (initialData.images as any).side,
          (initialData.images as any).installed,
          (initialData.images as any).back
        ].filter(Boolean);
      }
      if (initialImgs.length === 0 && (initialData.image || initialData.imageBase64)) {
        initialImgs = [String(initialData.image || initialData.imageBase64)];
      }

      setImages([
        initialImgs[0] || '',
        initialImgs[1] || '',
        initialImgs[2] || '',
        initialImgs[3] || ''
      ]);
    } else {
      setProductName('');
      setImages(['', '', '', '']);
    }

    setFormError(null);
    setIsSaving(false);
  }, [initialData, isOpen, category]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = productName.trim();
    if (!trimmedName) {
      setFormError('Please enter a product name (e.g. Pro Door Lock).');
      return;
    }

    const validImages = images.filter((img) => typeof img === 'string' && img.trim().length > 0);

    try {
      setIsSaving(true);
      setFormError(null);

      // Save simplified payload to Firestore: name, categoryId, categoryName, images
      await onSave({
        name: trimmedName,
        productName: trimmedName,
        categoryId: category.id,
        categoryName: category.name,
        category: category.name,
        images: validImages, // Array of Base64 strings or URLs
        image: validImages[0] || '', // Cover image
        imageBase64: validImages[0] || ''
      });

      onClose();
    } catch (err: any) {
      console.error('[CategoryProductModal] Failed to save product:', err);
      setFormError(`Failed to save product: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      id="category-product-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl border-2 border-[#C8A165] shadow-2xl overflow-hidden my-auto text-left flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0A2E24] px-5 py-4 border-b border-[#C8A165]/30 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-[#C8A165]" />
            <div>
              <h3 className="font-cinzel text-lg font-bold text-[#E0C18B]">
                {initialData ? `Edit ${initialData.name || initialData.productName}` : `Add Product to ${category.name}`}
              </h3>
              <p className="text-[11px] text-[#E0C18B]/80">
                Product Name is required. Photos are optional (10-second instant save)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#C8A165] hover:text-[#0A2E24] text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Assigned Category Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">Category:</span>
              <span className="font-bold text-[#0A2E24] text-xs sm:text-sm">{category.name}</span>
            </div>
            <span className="text-[10px] font-mono text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded">
              ID: {category.id}
            </span>
          </div>

          {/* Product Name Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#0A2E24] text-xs sm:text-sm block">
              Product Name *
            </label>
            <input
              id="input-cat-product-name"
              type="text"
              required
              autoFocus
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={`e.g. Pro ${category.name} Imperial Model`}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-[#C8A165] focus:outline-none font-bold text-sm bg-white shadow-xs"
            />
            <p className="text-[11px] text-gray-500">
              Enter the clean display title for this hardware piece.
            </p>
          </div>

          {/* 4-Images Uploader */}
          <div className="p-4 rounded-2xl bg-[#0A2E24]/5 border-2 border-[#C8A165]/40 space-y-3">
            <ProductFourImagesUploader
              images={images}
              onChange={setImages}
              sku="RHC-PROD"
            />
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-cat-save-product"
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#0A2E24] text-[#E0C18B] border border-[#C8A165] font-extrabold hover:bg-[#124A3B] transition-colors cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 text-[#C8A165] animate-spin" />
                  <span>Saving Product...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#C8A165]" />
                  <span>{initialData ? 'Save Product Changes' : `Save Product to ${category.name}`}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
