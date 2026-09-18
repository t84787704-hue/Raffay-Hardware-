import React, { useState, useRef } from 'react';
import { 
  Star, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  X, 
  AlertCircle, 
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { Brand } from '../../types';
import { useHardwareStore } from '../../context/HardwareStoreContext';

interface BrandManagementSectionProps {
  onViewStorefront?: () => void;
  onBrandClick?: (brand: Brand) => void;
}

export function BrandManagementSection({ onViewStorefront, onBrandClick }: BrandManagementSectionProps) {
  const { brands, addBrand, updateBrand, deleteBrand, resetBrands, isRHCAdmin, isAdmin, isAuthenticated } = useHardwareStore();
  const hasAdminAccess = isRHCAdmin || isAdmin || isAuthenticated;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandWebsite, setBrandWebsite] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingBrand(null);
    setBrandName('');
    setBrandDescription('');
    setBrandLogo('');
    setBrandWebsite('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandName(brand.name);
    setBrandDescription(brand.description || '');
    setBrandLogo(brand.logo || '');
    setBrandWebsite(brand.website || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    // Convert file to square canvas dataUrl
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 500;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, size, size);

          // Fit image inside square maintaining aspect ratio
          const scale = Math.min((size - 40) / img.width, (size - 40) / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (size - w) / 2;
          const y = (size - h) / 2;
          ctx.drawImage(img, x, y, w, h);
          setBrandLogo(canvas.toDataURL('image/jpeg', 0.9));
          setFormError(null);
        } else {
          setBrandLogo(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      setFormError('Company / Brand Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, {
          name: brandName.trim(),
          description: brandDescription.trim(),
          logo: brandLogo.trim(),
          website: brandWebsite.trim() || undefined,
        });
        showNotification(`Brand "${brandName.trim()}" updated successfully.`);
      } else {
        await addBrand({
          name: brandName.trim(),
          description: brandDescription.trim(),
          logo: brandLogo.trim(),
          website: brandWebsite.trim() || undefined,
        });
        showNotification(`Brand "${brandName.trim()}" added to catalog.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save brand.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!brandToDelete) return;
    try {
      await deleteBrand(brandToDelete.id);
      showNotification(`Brand "${brandToDelete.name}" removed.`);
      setBrandToDelete(null);
    } catch (err: any) {
      showNotification('Failed to delete brand.');
    }
  };

  const getBrandInitials = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return 'BR';
    const words = trimmed.split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, 3).toUpperCase();
    }
    if (words[0].length >= 2 && words[0] === words[0].toUpperCase()) {
      return words[0];
    }
    return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
  };

  return (
    <div id="brand-management-section" className="space-y-6 text-left">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-[#0A2E24] text-white border border-[#C8A165] rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-[#C8A165]" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* Brand Management Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0A2E24] flex items-center justify-center text-[#C8A165]">
                <Star className="w-5 h-5 fill-[#C8A165]" />
              </div>
              <div>
                <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[#0A2E24]">
                  Brand Management ({brands.length} Companies)
                </h2>
                <p className="text-xs text-gray-500">
                  Manage authorized brands, partner companies, square logos, and product catalog filters.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Reset to initial dummy brands button */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset brands to default 8 partner brands? Any custom additions will be reverted.')) {
                  resetBrands();
                  showNotification('Brands reset to initial 8 partner companies.');
                }
              }}
              className="px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-[#0A2E24] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset to default brands"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            {/* Button "+ Add Brand Logo" visible only for admin */}
            {hasAdminAccess && (
              <button
                type="button"
                id="btn-add-brand-logo"
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 rounded-xl bg-[#C8A165] hover:bg-[#d4a574] text-[#0A2E24] text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Brand Logo</span>
              </button>
            )}
          </div>
        </div>

        {/* Brands Grid inside Admin */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {brands.map((brand) => {
            const initials = getBrandInitials(brand.name);
            return (
              <div 
                key={brand.id}
                className="group relative bg-white border border-gray-200 hover:border-[#d4a574] rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center justify-between aspect-square"
              >
                {/* Admin action overlays */}
                {hasAdminAccess && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/90 backdrop-blur-xs p-1 rounded-lg shadow-sm border border-gray-200">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(brand);
                      }}
                      className="p-1 rounded text-gray-600 hover:text-[#0A2E24] hover:bg-gray-100"
                      title="Edit Brand"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBrandToDelete(brand);
                      }}
                      className="p-1 rounded text-red-600 hover:bg-red-50"
                      title="Delete Brand"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Logo Area */}
                <div 
                  className="flex-1 w-full flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => onBrandClick?.(brand)}
                >
                  {brand.logo ? (
                    <img 
                      src={brand.logo} 
                      alt={brand.name} 
                      className="max-h-20 w-auto max-w-full object-contain group-hover:scale-105 transition-transform" 
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#0a2e1f] flex items-center justify-center text-[#E0C18B] font-cinzel font-bold text-sm sm:text-base shadow-inner">
                      {initials}
                    </div>
                  )}
                </div>

                {/* Company Name below logo */}
                <div className="w-full pt-2 border-t border-gray-100">
                  <p className="text-xs font-bold text-[#0A2E24] truncate group-hover:text-[#C8A165] transition-colors" title={brand.name}>
                    {brand.name}
                  </p>
                  {brand.description && (
                    <p className="text-[10px] text-gray-500 truncate" title={brand.description}>
                      {brand.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {brands.length === 0 && (
          <div className="py-12 text-center text-gray-500 space-y-3">
            <Star className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-semibold">No brand logos uploaded yet.</p>
            {hasAdminAccess && (
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-[#C8A165] text-[#0A2E24] text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                + Add First Brand Logo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4.5 bg-[#0A2E24] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-[#C8A165] fill-[#C8A165]" />
                <h3 className="font-cinzel text-base font-bold">
                  {editingBrand ? 'Edit Brand Logo & Details' : 'Add Brand Logo'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="p-6 space-y-4 text-left">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Logo Preview & Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Brand Logo Image (Square Box)
                </label>
                
                <div className="flex items-center gap-4">
                  {/* Square Box Preview */}
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50 shrink-0 relative group">
                    {brandLogo ? (
                      <img src={brandLogo} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="w-full h-full bg-[#0a2e1f] flex flex-col items-center justify-center text-[#E0C18B]">
                        <span className="font-cinzel font-bold text-sm">
                          {getBrandInitials(brandName || 'Brand')}
                        </span>
                        <span className="text-[8px] text-gray-300 mt-0.5">Initials</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-[#0A2E24] hover:bg-[#124A3B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#C8A165]" />
                      <span>Upload Square Image</span>
                    </button>

                    {brandLogo && (
                      <button
                        type="button"
                        onClick={() => setBrandLogo('')}
                        className="text-[11px] text-red-600 hover:underline font-semibold block text-center w-full"
                      >
                        Remove Logo (Use Initials)
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  <span className="text-[11px] text-gray-500 block mb-1">Or paste logo image URL:</span>
                  <input
                    type="url"
                    value={brandLogo}
                    onChange={(e) => setBrandLogo(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#C8A165]"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Company / Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Hettich Master, Khas Extreme"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#C8A165]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description / Dealings
                </label>
                <textarea
                  rows={2}
                  value={brandDescription}
                  onChange={(e) => setBrandDescription(e.target.value)}
                  placeholder="e.g. Telescopic drawer channels, hydraulic hinges, mortise locks"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#C8A165]"
                />
              </div>

              {/* Website (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Official Website (Optional)
                </label>
                <input
                  type="url"
                  value={brandWebsite}
                  onChange={(e) => setBrandWebsite(e.target.value)}
                  placeholder="https://brand.com"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#C8A165]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#C8A165] hover:bg-[#d4a574] text-[#0A2E24] text-xs font-extrabold shadow cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingBrand ? 'Update Brand' : 'Save Brand Logo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {brandToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-gray-200 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-cinzel text-base font-bold text-[#0A2E24]">Delete Brand Logo?</h4>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete <strong className="text-gray-800">{brandToDelete.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBrandToDelete(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow"
              >
                Delete Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
