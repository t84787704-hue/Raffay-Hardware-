import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Layers, 
  Sparkles, 
  Image as ImageIcon, 
  Upload, 
  Check, 
  Plus, 
  Camera, 
  Trash2,
  Tag,
  ShieldCheck,
  Smartphone,
  Loader2,
  Package,
  Pencil,
  Eye,
  Maximize2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { Category, ProductItem } from '../../types';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { CategoryProductModal } from '../CategoryProductModal';
import { Product3ImagesGalleryModal } from '../Product3ImagesGalleryModal';
import { 
  compressImage, 
  ensureBase64CategoryImage,
  formatBytes, 
  getBase64SizeBytes,
  formatImageSrc,
  handleImageError,
  doesProductMatchCategory,
  DEFAULT_CATEGORY_FALLBACK_IMAGE,
  DEFAULT_FALLBACK_IMAGE
} from '../../utils/imageUtils';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Partial<Category>) => void | Promise<void>;
  initialData?: Category | null;
}

export function CategoryModal({ isOpen, onClose, onSave, initialData }: CategoryModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { products, addProduct, updateProduct, deleteProduct } = useHardwareStore();

  // Form Fields
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [badge, setBadge] = useState('Heavy Duty');
  const [itemCount, setItemCount] = useState('50+ SKUs');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [material, setMaterial] = useState('Solid Brass / High Pressure Zinc Alloy');
  const [finishes, setFinishes] = useState('Matt Black, Antique Brass, Gold Polish, Satin Chrome');
  const [feature1, setFeature1] = useState('Factory tested mechanism with smooth operation');
  const [feature2, setFeature2] = useState('Corrosion resistant multi-layer electroplating');
  const [tagline, setTagline] = useState('High grade architectural wholesale fitting.');

  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Sub-Modals for Category Products Management
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [isDeletingProd, setIsDeletingProd] = useState(false);
  const [galleryProduct, setGalleryProduct] = useState<ProductItem | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setShortName(initialData.shortName || '');
      setBadge(initialData.badge || 'Heavy Duty');
      setItemCount(initialData.itemCount || '50+ SKUs');
      setImage(initialData.image || '');
      setDescription(initialData.description || '');
      setMaterial(initialData.material || 'Solid Brass / Zinc Alloy');
      setFinishes((initialData.popularFinishes || []).join(', '));
      setFeature1((initialData.keyFeatures && initialData.keyFeatures[0]) || 'Factory tested heavy-duty mechanism');
      setFeature2((initialData.keyFeatures && initialData.keyFeatures[1]) || 'Corrosion resistant electroplated finish');
      setTagline(initialData.tagline || '');
    } else {
      setName('');
      setShortName('');
      setBadge('Heavy Duty');
      setItemCount('40+ SKUs');
      setImage('');
      setDescription('Precision architectural hardware component available in wholesale cartons with direct factory rates.');
      setMaterial('Solid Brass / High Pressure Zinc Alloy');
      setFinishes('Matt Black, Antique Brass, Gold Polish, Satin Chrome');
      setFeature1('Industrial grade durability with smooth cycle testing');
      setFeature2('Rust-resistant electroplating for humid climates');
      setTagline('High grade wholesale architectural hardware component.');
    }
  }, [initialData, isOpen]);

  // Current category object for passing dynamically to product modal
  const currentCategoryObject: Category = useMemo(() => {
    return {
      id: initialData?.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: name.trim() || initialData?.name || 'Category',
      shortName: shortName.trim() || name.trim() || initialData?.shortName || '',
      badge: badge.trim() || 'Heavy Duty',
      itemCount: itemCount.trim() || '50+ SKUs',
      image: image || DEFAULT_CATEGORY_FALLBACK_IMAGE,
      description: description.trim(),
      material: material.trim(),
      popularFinishes: finishes.split(',').map(s => s.trim()).filter(Boolean),
      keyFeatures: [feature1.trim(), feature2.trim()].filter(Boolean),
      tagline: tagline.trim()
    };
  }, [initialData, name, shortName, badge, itemCount, image, description, material, finishes, feature1, feature2, tagline]);

  // Dynamically filter products belonging to this category
  const categoryProducts = useMemo(() => {
    if (!initialData) return [];
    return products.filter((p) => doesProductMatchCategory(p, initialData));
  }, [products, initialData]);

  if (!isOpen) return null;

  // Handle Mobile / Desktop Gallery or Camera Upload (Auto compressed to <200KB)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const { base64, sizeFormatted, sizeBytes } = await compressImage(file, 800, 800, 180 * 1024);
      console.log(`[Category Image] Optimized image: ${sizeFormatted} (${sizeBytes} bytes, <200KB)`);
      setImage(base64);
    } catch (err) {
      console.error('Failed to compress category image:', err);
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const popularFinishes = finishes ? finishes.split(',').map(s => s.trim()).filter(Boolean) : [];
    const keyFeatures = [feature1.trim(), feature2.trim()].filter(Boolean);

    let finalImage = image.trim();

    if (finalImage && !finalImage.startsWith('data:')) {
      try {
        finalImage = await ensureBase64CategoryImage(finalImage);
      } catch (e) {
        console.warn('Fallback using URL for category:', e);
      }
    }

    if (!finalImage) {
      finalImage = DEFAULT_CATEGORY_FALLBACK_IMAGE;
    }

    await onSave({
      name: name.trim(),
      shortName: shortName.trim() || name.trim(),
      badge: badge.trim() || '',
      itemCount: itemCount.trim() || '',
      image: finalImage,
      description: description.trim() || '',
      material: material.trim() || '',
      popularFinishes: popularFinishes,
      keyFeatures: keyFeatures,
      tagline: tagline.trim() || '',
      ...(initialData?.order !== undefined ? { order: initialData.order } : {})
    });

    onClose();
  };

  // Product CRUD inside Category Modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: ProductItem) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleSaveCategoryProduct = async (productData: Partial<ProductItem>) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          ...productData,
          categoryId: initialData?.id || currentCategoryObject.id,
          categoryName: initialData?.name || currentCategoryObject.name,
          category: initialData?.name || currentCategoryObject.name
        });
      } else {
        await addProduct({
          ...productData,
          categoryId: initialData?.id || currentCategoryObject.id,
          categoryName: initialData?.name || currentCategoryObject.name,
          category: initialData?.name || currentCategoryObject.name
        } as any);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('[CategoryModal] Failed to save product:', err);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      setIsDeletingProd(true);
      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
    } catch (err) {
      console.error('[CategoryModal] Failed to delete product:', err);
    } finally {
      setIsDeletingProd(false);
    }
  };

  return (
    <>
      <div 
        id="category-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl border-2 border-[#C8A165] shadow-2xl overflow-hidden my-auto text-left flex flex-col max-h-[94vh]"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Modal Header */}
          <div className="bg-[#0A2E24] px-5 py-4 border-b border-[#C8A165]/30 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-[#C8A165]" />
              <div>
                <h3 className="font-cinzel text-base sm:text-lg font-bold text-[#E0C18B]">
                  {initialData ? `Edit Category: ${initialData.name}` : 'Add New Category'}
                </h3>
                <p className="text-[11px] text-gray-300">
                  {initialData ? `Category ID: ${initialData.id} • Dynamic Products Linkage` : 'Create new category & assign products'}
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

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
            
            {/* 1. Category Name & Short Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-[#0A2E24] block">
                  Category Name * (e.g. Tower Bolt, Door Lock, Aldrop, etc.)
                </label>
                <input
                  id="input-category-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tower Bolt"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#C8A165] focus:outline-none font-medium bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0A2E24] block">
                  Short Name for Filter Tabs
                </label>
                <input
                  id="input-category-short-name"
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="e.g. Tower Bolt"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#C8A165] focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* 2. Top Badge & SKU Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-[#0A2E24] block">Top Badge (Optional)</label>
                <input
                  id="input-category-badge"
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. Heavy Duty"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#C8A165] focus:outline-none font-bold text-[#0A2E24] bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#0A2E24] block">SKU Display Count (Optional)</label>
                <input
                  id="input-category-item-count"
                  type="text"
                  value={itemCount}
                  onChange={(e) => setItemCount(e.target.value)}
                  placeholder="e.g. 50+ SKUs"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#C8A165] focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* 3. Main Image Upload */}
            <div className="p-4 rounded-2xl bg-[#0A2E24]/5 border-2 border-dashed border-[#C8A165] space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-[#0A2E24] text-xs flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#C8A165]" />
                  <span>Category Cover Photo (Optional)</span>
                </label>
                {isProcessingImage && (
                  <span className="text-[11px] text-[#0A2E24] font-extrabold flex items-center gap-1 bg-[#C8A165]/20 px-2 py-0.5 rounded-full border border-[#C8A165]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C8A165]" />
                    <span>Optimizing image &lt;200KB...</span>
                  </span>
                )}
              </div>

              {/* Explicit Upload Instruction */}
              <div className="px-3 py-2 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 animate-pulse" />
                <span>Upload clean 800x600 photo with white background, full product visible</span>
              </div>

              {/* Upload Controls & URL */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-[#0A2E24] hover:bg-[#124A3B] disabled:opacity-50 text-[#E0C18B] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition-all border border-[#C8A165]"
                  >
                    <Upload className="w-4 h-4 text-[#C8A165]" />
                    <span>Upload Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="py-2 px-3 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 text-[#0A2E24] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-gray-300"
                  >
                    <Camera className="w-4 h-4 text-[#C8A165]" />
                    <span>Camera</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </div>

                {image && image.startsWith('data:') ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-[11px] text-emerald-800">
                    <div className="space-y-0.5">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                        Image Ready &lt;200KB ({formatBytes(getBase64SizeBytes(image))})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="px-2 py-0.5 rounded-lg bg-emerald-200 hover:bg-red-100 hover:text-red-700 text-emerald-900 text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      id="input-category-image-url"
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="Or paste web image URL..."
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-[11px] focus:border-[#C8A165] focus:outline-none bg-white"
                    />
                    {image && (
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 cursor-pointer"
                        title="Clear photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Live Website Preview (Auto Crop & Contain Preview before Save) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#0A2E24]">Website Display Preview (Contain, White Background, 16px Radius)</span>
                  {image && (
                    <span className="text-[10px] text-gray-500 font-medium">Centered &bull; Uncropped</span>
                  )}
                </div>

                <div 
                  style={{
                    height: '160px',
                    width: '100%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px'
                  }}
                  className="rounded-2xl bg-white border-2 border-[#C8A165]/50 overflow-hidden flex items-center justify-center p-3 relative shadow-inner"
                >
                  {image ? (
                    <img 
                      src={image} 
                      alt="Website Preview" 
                      style={{
                        objectFit: 'contain',
                        height: '100%',
                        width: '100%',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px'
                      }}
                      className="w-full h-full object-contain rounded-2xl bg-white" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                      <span className="text-xs font-semibold">No category photo selected</span>
                      <span className="text-[10px] text-gray-400">Preview will display here exactly as seen on the live website</span>
                    </div>
                  )}

                  {image && image.startsWith('data:') && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-[#0A2E24] text-[#E0C18B] text-[9px] font-bold border border-[#C8A165] shadow-xs">
                      {formatBytes(getBase64SizeBytes(image))}
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* 4. Category Description */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="input-category-description" className="font-extrabold text-[#0A2E24] block">
                  Category Description (Optional)
                </label>
                <span className="text-[11px] text-gray-500 font-medium">Specific details for {name || 'this category'}</span>
              </div>
              <textarea
                id="input-category-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Architectural wholesale hardware component engineered for durability, consistent manufacturing tolerances, and pan-Pakistan freight distribution."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#C8A165] focus:outline-none bg-white text-xs leading-relaxed"
              />
            </div>

            {/* 5. Material & Finishes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="input-category-material" className="font-bold text-[#0A2E24] block">
                  Material (Optional)
                </label>
                <input
                  id="input-category-material"
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g. Solid Brass / High Pressure Die-Cast Zinc"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#C8A165] focus:outline-none font-medium bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="input-category-finishes" className="font-bold text-[#0A2E24] block">
                  Finishes (Optional) (Comma separated)
                </label>
                <input
                  id="input-category-finishes"
                  type="text"
                  value={finishes}
                  onChange={(e) => setFinishes(e.target.value)}
                  placeholder="e.g. Matt Black, Antique Brass, Gold Polish, Satin Chrome"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#C8A165] focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 6. DYNAMIC PRODUCTS INSIDE THIS CATEGORY (Universal for ALL categories)    */}
            {/* ========================================================================= */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/40 border-2 border-[#C8A165]/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-cinzel text-sm sm:text-base font-bold text-[#0A2E24] flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#C8A165]" />
                    <span>
                      Products in this Category: {name || initialData?.name || 'Category'} ({categoryProducts.length})
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Manage and add 4-angle products specifically assigned to this category.
                  </p>
                </div>

                {initialData ? (
                  <button
                    type="button"
                    id="btn-add-product-to-category"
                    onClick={handleOpenAddProduct}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A2E24] hover:bg-[#124A3B] text-[#E0C18B] border border-[#C8A165] font-extrabold text-xs shadow transition-all cursor-pointer flex-shrink-0"
                  >
                    <Plus className="w-4 h-4 text-[#C8A165]" />
                    <span>+ Add Product to {name || initialData.name}</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200">
                    Save category first to add products
                  </span>
                )}
              </div>

              {/* Product Grid / Table inside Category Modal */}
              {initialData && (
                <div className="space-y-3">
                  {categoryProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {categoryProducts.map((prod) => {
                        const prodImg = (Array.isArray(prod.images) && prod.images.length > 0) 
                          ? prod.images[0] 
                          : (prod.image || prod.imageBase64 || (typeof prod.images === 'object' && prod.images ? (prod.images as any).front : ''));
                        const prodSku = prod.sku || `RHC-${prod.id.slice(0, 4).toUpperCase()}`;
                        const prodPrice = prod.wholesalePrice || prod.price || 0;
                        const prodCount = Array.isArray(prod.images) ? prod.images.filter(Boolean).length : 1;

                        return (
                          <div
                            key={prod.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-200 shadow-xs hover:border-[#C8A165] transition-all gap-3"
                          >
                            {/* Thumbnail & Gallery Click */}
                            <div 
                              onClick={() => setGalleryProduct(prod)}
                              className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-200 p-1 flex-shrink-0 relative cursor-pointer group overflow-hidden"
                              title="Click to view 4-angle gallery"
                            >
                              <img
                                src={formatImageSrc(prodImg, DEFAULT_FALLBACK_IMAGE)}
                                alt={prod.productName || prod.name}
                                onError={(e) => handleImageError(e, DEFAULT_FALLBACK_IMAGE)}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[7px] text-[#E0C18B] font-bold text-center py-0.2">
                                {prodCount} {prodCount > 1 ? 'VIEWS' : 'VIEW'}
                              </div>
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-[#0A2E24] text-xs truncate" title={prod.productName || prod.name}>
                                {prod.productName || prod.name}
                              </h5>
                              <span className="text-[10px] text-gray-500 font-medium block">
                                {prod.categoryName || name || 'Product'} &bull; {prodCount} Photos
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#0A2E24] hover:text-white text-gray-700 transition-colors cursor-pointer"
                                title="Edit Product"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingProduct(prod)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 px-4 rounded-xl bg-white border border-dashed border-gray-300 text-center space-y-2">
                      <Package className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-xs font-semibold text-gray-600">
                        No products added to <strong>{name || initialData.name}</strong> yet.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenAddProduct}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A2E24] text-[#E0C18B] border border-[#C8A165] font-bold text-xs hover:bg-[#124A3B] transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#C8A165]" />
                        <span>+ Add First Product to {name || initialData.name}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 7. 2 Features Points */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-gray-200 space-y-3">
              <span className="font-extrabold text-[#0A2E24] text-xs block">
                2 Key Feature Points (Optional)
              </span>
              
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 text-[11px] block">Feature Point 1 (Optional)</label>
                  <input
                    id="input-category-feature-1"
                    type="text"
                    value={feature1}
                    onChange={(e) => setFeature1(e.target.value)}
                    placeholder="e.g. Factory tested mechanism with smooth 500k cycle operation"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:border-[#C8A165] focus:outline-none bg-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 text-[11px] block">Feature Point 2 (Optional)</label>
                  <input
                    id="input-category-feature-2"
                    type="text"
                    value={feature2}
                    onChange={(e) => setFeature2(e.target.value)}
                    placeholder="e.g. Corrosion resistant electroplated coating with export carton packing"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:border-[#C8A165] focus:outline-none bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-save-category"
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#0A2E24] text-[#E0C18B] border border-[#C8A165] font-extrabold hover:bg-[#124A3B] transition-colors cursor-pointer shadow-md flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-[#C8A165]" />
                <span>{initialData ? 'Save Category Changes' : 'Publish Category'}</span>
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* Sub-Modal: Add / Edit Product for this specific category */}
      {isProductModalOpen && (
        <CategoryProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveCategoryProduct}
          category={currentCategoryObject}
          initialData={editingProduct}
        />
      )}

      {/* Sub-Modal: View 4-Images Gallery */}
      {galleryProduct && (
        <Product3ImagesGalleryModal
          product={galleryProduct}
          onClose={() => setGalleryProduct(null)}
        />
      )}

      {/* Sub-Modal: Delete Product Confirmation Dialog */}
      {deletingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 border border-red-200 shadow-2xl text-left">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold text-sm text-[#0A2E24]">Delete Product?</h4>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete <strong>{deletingProduct.productName || deletingProduct.name}</strong> from {name || initialData?.name}?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingProd}
                onClick={handleConfirmDeleteProduct}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow cursor-pointer disabled:opacity-50"
              >
                {isDeletingProd ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
