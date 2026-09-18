import React, { useState, useRef } from 'react';
import { 
  Star, 
  Upload, 
  X, 
  AlertCircle, 
  Globe, 
  Sparkles,
  Building2,
  Check
} from 'lucide-react';
import { Brand } from '../types';

interface AddBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (brand: Brand) => void;
}

export function AddBrandModal({ isOpen, onClose, onSave }: AddBrandModalProps) {
  const [brandName, setBrandName] = useState('');
  const [brandWebsite, setBrandWebsite] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Generate fallback initials for preview
  const getInitials = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return 'BR';
    const words = trimmed.split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }

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

          // Center and fit maintaining aspect ratio with 24px padding
          const scale = Math.min((size - 48) / img.width, (size - 48) / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (size - w) / 2;
          const y = (size - h) / 2;
          ctx.drawImage(img, x, y, w, h);
          setBrandLogo(canvas.toDataURL('image/jpeg', 0.92));
          setFormError(null);
        } else {
          setBrandLogo(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      setFormError('Brand Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newBrand: Brand = {
        id: `brand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: brandName.trim(),
        description: brandDescription.trim() || undefined,
        logo: brandLogo.trim() || '',
        website: brandWebsite.trim() || undefined,
        order: 0,
      };

      onSave(newBrand);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save brand.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="add-brand-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div 
        id="add-brand-modal-content"
        className="bg-white rounded-3xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-left"
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-[#0A2E24] text-white flex items-center justify-between border-b border-[#C8A165]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#124A3B] flex items-center justify-center text-[#E0C18B]">
              <Star className="w-4 h-4 fill-[#C8A165] text-[#C8A165]" />
            </div>
            <div>
              <h3 className="font-cinzel text-base font-bold text-white">
                Add Brand Logo
              </h3>
              <p className="text-[11px] text-[#E0C18B]">
                Unlimited partner companies &amp; authorized dealerships
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Upload Logo (file input) */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Upload Logo (Square Box)
            </label>
            
            <div className="flex items-center gap-4">
              {/* Square Preview */}
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50 shrink-0 relative shadow-inner">
                {brandLogo ? (
                  <img src={brandLogo} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="w-full h-full bg-[#0a2e1f] flex flex-col items-center justify-center text-[#E0C18B]">
                    <span className="font-cinzel font-bold text-base">
                      {getInitials(brandName || 'Brand')}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-gray-300 mt-0.5">Preview</span>
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
                  id="btn-upload-brand-logo-file"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3.5 rounded-xl bg-[#0A2E24] hover:bg-[#124A3B] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm border border-[#C8A165]/30"
                >
                  <Upload className="w-3.5 h-3.5 text-[#C8A165]" />
                  <span>Choose Image File</span>
                </button>

                {brandLogo ? (
                  <button
                    type="button"
                    onClick={() => setBrandLogo('')}
                    className="text-[11px] text-red-600 hover:underline font-semibold block text-center w-full cursor-pointer"
                  >
                    Remove Logo (Use Initials)
                  </button>
                ) : (
                  <p className="text-[10px] text-gray-500 text-center">
                    PNG, JPG, or SVG. Auto-centered square.
                  </p>
                )}
              </div>
            </div>

            {/* Optional Image URL */}
            <div className="mt-2.5">
              <span className="text-[10px] text-gray-500 font-semibold block mb-1">Or paste image URL:</span>
              <input
                type="url"
                value={brandLogo}
                onChange={(e) => setBrandLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#C8A165]"
              />
            </div>
          </div>

          {/* Brand Name Input */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-brand-name"
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Master Locks, Architech Pro, Yale"
                required
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#C8A165] focus:ring-1 focus:ring-[#C8A165]"
              />
            </div>
          </div>

          {/* Website Optional */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center justify-between">
              <span>Website</span>
              <span className="text-gray-400 font-normal text-[10px]">(Optional)</span>
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-brand-website"
                type="url"
                value={brandWebsite}
                onChange={(e) => setBrandWebsite(e.target.value)}
                placeholder="https://brandwebsite.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#C8A165] focus:ring-1 focus:ring-[#C8A165]"
              />
            </div>
          </div>

          {/* Description Optional */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center justify-between">
              <span>Dealings / Description</span>
              <span className="text-gray-400 font-normal text-[10px]">(Optional)</span>
            </label>
            <textarea
              id="input-brand-description"
              rows={2}
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              placeholder="e.g. Architectural door locksets, telescopic drawer channels, concealed hinges"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#C8A165] focus:ring-1 focus:ring-[#C8A165]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-save-brand-modal"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#C8A165] hover:bg-[#d4a574] text-[#0A2E24] text-xs font-extrabold shadow transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Brand Logo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
