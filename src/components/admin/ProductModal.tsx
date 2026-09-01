import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Check, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { ProductItem, Category } from '../../types';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { ProductFourImagesUploader } from './ProductFourImagesUploader';
import { uploadFourProductImagesToSupabase } from '../../services/supabaseStorage';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<ProductItem> & Record<string, any>) => Promise<void> | void;
  initialData?: ProductItem | null;
  categories?: Category[];
  defaultCategoryId?: string;
}

export function ProductModal({ isOpen, onClose, onSave, initialData, defaultCategoryId }: ProductModalProps) {
  const { categories } = useHardwareStore();

  // Simplified Form States: Name, Category, 4 Images (Main-Front, Side, Back, Detail)
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<string[]>(['', '', '', '']);

  // Submission State
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.productName || initialData.name || '');
      const matchedCatInit = categories.find(c => 
        c.id === initialData.categoryId || 
        c.name.toLowerCase() === (initialData.category || initialData.categoryName || '').toLowerCase()
      );
      setCategoryId(initialData.categoryId || matchedCatInit?.id || defaultCategoryId || (categories[0]?.id || 'cat_lock_bearing'));

      // Initialize 4-image array with backward compatibility
      let initialImgs: string[] = [];
      if (Array.isArray(initialData.images) && initialData.images.length > 0) {
        initialImgs = [...initialData.images];
      } else if (typeof initialData.images === 'object' && initialData.images !== null) {
        initialImgs = [
          (initialData.images as any).front || (initialData.images as any).image_main,
          (initialData.images as any).side || (initialData.images as any).image_side,
          (initialData.images as any).back || (initialData.images as any).image_back,
          (initialData.images as any).detail || (initialData.images as any).installed || (initialData.images as any).image_detail
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
      setName('');
      setCategoryId(defaultCategoryId || categories[0]?.id || 'cat_lock_bearing');
      setImages(['', '', '', '']);
    }

    setFormError(null);
    setIsSaving(false);
  }, [initialData, isOpen, categories, defaultCategoryId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Please enter a product name (e.g. Imperial Mortise Handle Bearing Set).');
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);

      const matchedCat = categories.find(c => c.id === categoryId || c.name === categoryId);
      const catDisplayName = matchedCat ? matchedCat.name : categoryId;
      const catIdValue = matchedCat ? matchedCat.id : (categoryId || 'cat_lock_bearing');

      // Step 1: Process and compress the 4 angle images (<=200KB) and upload if Supabase is connected
      const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'prod';
      const {
        image_main,
        image_side,
        image_back,
        image_detail,
        image_url
      } = await uploadFourProductImagesToSupabase(images, slug);

      const validImages = [image_main, image_side, image_back, image_detail].filter(Boolean);
      const primaryImage = image_main || image_url || validImages[0] || images[0] || '';

      // Step 2: Save product via store context (updates live storefront immediately & syncs with Supabase)
      await onSave({
        name: trimmedName,
        productName: trimmedName,
        categoryId: catIdValue,
        categoryName: catDisplayName,
        category: catDisplayName,
        images: validImages.length > 0 ? validImages : [images[0] || ''],
        image: primaryImage,
        imageBase64: primaryImage,
        image_main: image_main || primaryImage,
        image_side: image_side || undefined,
        image_back: image_back || undefined,
        image_detail: image_detail || undefined,
        image_url: image_url || primaryImage
      });

      onClose();
    } catch (err: any) {
      console.warn('[Supabase] Submission note:', err);
      setFormError(`Notice: ${err?.message || 'Could not complete product save. Please retry.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      id="product-modal-backdrop"
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
                {initialData ? `Edit Product: ${initialData.name || initialData.productName}` : 'Add New Hardware Product'}
              </h3>
              <p className="text-[11px] text-[#E0C18B]/80">
                Product Name is required. 4-angle views uploaded to Supabase Storage &amp; database.
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
          
          {/* ================= SECTION 1: 4-IMAGES UPLOAD ================= */}
          <div className="p-4 rounded-2xl bg-[#0A2E24]/5 border-2 border-[#C8A165]/50 space-y-3">
            <ProductFourImagesUploader
              images={images}
              onChange={setImages}
              sku="RHC-PROD"
            />
          </div>

          {/* ================= SECTION 2: BASIC PRODUCT INFORMATION ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Name */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-[#0A2E24] text-xs sm:text-sm block">
                Product Name * (e.g. Imperial Mortise Bearing Lock Set)
              </label>
              <input
                id="input-product-name"
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Imperial Mortise Handle Bearing Set"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-[#C8A165] focus:outline-none font-bold text-sm bg-white"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-[#0A2E24] block">Hardware Category *</label>
              <select
                id="select-product-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#C8A165] focus:outline-none font-semibold bg-white text-xs cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

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
              id="btn-save-product"
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#0A2E24] text-[#E0C18B] border border-[#C8A165] font-extrabold hover:bg-[#124A3B] transition-colors cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 text-[#C8A165] animate-spin" />
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#C8A165]" />
                  <span>{initialData ? 'Save Product Changes' : 'Publish Product to Supabase'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
