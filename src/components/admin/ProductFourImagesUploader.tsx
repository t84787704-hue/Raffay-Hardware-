import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  Link as LinkIcon, 
  Check, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { compressAndConvert, formatImageSrc, formatBytes, getBase64SizeBytes, DEFAULT_FALLBACK_IMAGE } from '../../utils/imageUtils';

export interface ProductFourImagesUploaderProps {
  images: string[];
  onChange: (newImages: string[]) => void;
  sku: string;
  disabled?: boolean;
}

const IMAGE_BOX_LABELS = [
  { index: 0, label: 'Main - Front View (Optional)', required: false, hint: 'Cover image for catalog & listings' },
  { index: 1, label: 'Side View (Optional)', required: false, hint: 'Profile, projection & depth angle' },
  { index: 2, label: 'Back View (Optional)', required: false, hint: 'Reverse side, fixing holes & mechanism' },
  { index: 3, label: 'Detail / Size View (Optional)', required: false, hint: 'Close-up texture, size specs & finish' }
];

export function ProductFourImagesUploader({
  images,
  onChange,
  sku,
  disabled = false
}: ProductFourImagesUploaderProps) {
  const [compressingIndex, setCompressingIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [urlModalIndex, setUrlModalIndex] = useState<number | null>(null);
  const [urlInputVal, setUrlInputVal] = useState('');

  // Refs for 4 file inputs
  const fileInputRefs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null)
  ];

  // Helper to ensure we have a 4-element array
  const currentImages: string[] = [
    images[0] || '',
    images[1] || '',
    images[2] || '',
    images[3] || ''
  ];

  const handleFileSelected = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressingIndex(index);
      setErrorMsg(null);

      // Instant in-browser canvas compression to Base64 (<150KB JPEG)
      const base64Data = await compressAndConvert(file);

      const nextImages = [...currentImages];
      nextImages[index] = base64Data;
      onChange(nextImages);
    } catch (err: any) {
      console.error(`[ProductFourImagesUploader] Image processing error for box #${index + 1}:`, err);
      setErrorMsg(`Failed to process image for Box ${index + 1}: ${err?.message || 'Error'}`);
    } finally {
      setCompressingIndex(null);
      if (fileInputRefs[index].current) {
        fileInputRefs[index].current!.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextImages = [...currentImages];
    nextImages[index] = '';
    onChange(nextImages);
  };

  const handleOpenUrlModal = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setUrlModalIndex(index);
    setUrlInputVal(currentImages[index] || '');
  };

  const handleSaveUrlModal = () => {
    if (urlModalIndex !== null) {
      const nextImages = [...currentImages];
      nextImages[urlModalIndex] = urlInputVal.trim();
      onChange(nextImages);
      setUrlModalIndex(null);
      setUrlInputVal('');
    }
  };

  const uploadedCount = currentImages.filter(img => Boolean(img && img.trim().length > 0)).length;

  return (
    <div className="space-y-3">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="font-cinzel text-xs sm:text-sm font-bold text-[#0A2E24] flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-[#C8A165]" />
            <span>Product Images (Optional - 4 Angle Views)</span>
          </label>
          <p className="text-[11px] text-gray-500">
            Instant in-browser compression (<span className="text-[#0A2E24] font-semibold">&lt;150KB</span>) &amp; direct URL support. Optional to upload 1, 2, 3 or all 4 photos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            uploadedCount > 0 
              ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
              : 'text-gray-600 bg-gray-100 border-gray-200'
          }`}>
            {uploadedCount} of 4 Uploaded
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4 Boxes Grid: 2x2 on mobile, 4 in a row on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {IMAGE_BOX_LABELS.map((box) => {
          const imgUrl = currentImages[box.index];
          const isCompressing = compressingIndex === box.index;
          const hasImage = Boolean(imgUrl && imgUrl.trim().length > 0);
          const sizeBytes = hasImage ? getBase64SizeBytes(imgUrl) : 0;
          const isExternalLink = hasImage && (imgUrl.startsWith('http://') || imgUrl.startsWith('https://'));

          return (
            <div
              key={box.index}
              className={`relative flex flex-col rounded-2xl border-2 transition-all overflow-hidden text-left bg-white ${
                hasImage
                  ? 'border-[#0A2E24] shadow-xs'
                  : box.required
                  ? 'border-dashed border-[#C8A165] bg-amber-50/30 hover:bg-amber-50/60'
                  : 'border-dashed border-gray-300 hover:border-[#0A2E24]/60 bg-gray-50/50 hover:bg-gray-50'
              }`}
            >
              {/* Hidden File Input */}
              <input
                ref={fileInputRefs[box.index]}
                type="file"
                accept="image/*"
                disabled={disabled || isCompressing}
                onChange={(e) => handleFileSelected(box.index, e)}
                className="hidden"
              />

              {/* Box Header Label */}
              <div className="px-2.5 py-1.5 bg-gray-50/90 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8A165] flex-shrink-0" />
                  <span className="text-[11px] font-bold text-[#0A2E24] truncate">
                    {box.label}
                  </span>
                </div>
                {box.required && (
                  <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200 flex-shrink-0">
                    Required
                  </span>
                )}
              </div>

              {/* Box Image / Upload Trigger Area */}
              <div 
                onClick={() => {
                  if (!isCompressing && !disabled) {
                    fileInputRefs[box.index].current?.click();
                  }
                }}
                className="relative aspect-square w-full flex flex-col items-center justify-center p-2 cursor-pointer group bg-white overflow-hidden"
              >
                {isCompressing ? (
                  <div className="flex flex-col items-center justify-center text-center p-2 space-y-1.5">
                    <Loader2 className="w-6 h-6 text-[#C8A165] animate-spin" />
                    <span className="text-[10px] font-bold text-[#0A2E24]">Compressing...</span>
                    <span className="text-[9px] text-gray-500 font-mono">&lt; 150KB JPEG</span>
                  </div>
                ) : hasImage ? (
                  <>
                    <img
                      src={formatImageSrc(imgUrl, DEFAULT_FALLBACK_IMAGE)}
                      alt={box.label}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Delete Icon (X) */}
                    <button
                      type="button"
                      title="Remove image"
                      onClick={(e) => handleRemoveImage(box.index, e)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer z-10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Overlay on hover for Re-upload / Change */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity text-white">
                      <Upload className="w-4 h-4 text-[#E0C18B]" />
                      <span className="text-[10px] font-bold">Change Photo</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-2 space-y-1 text-gray-400 group-hover:text-[#0A2E24] transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-[#0A2E24]/10 flex items-center justify-center transition-colors">
                      <Camera className="w-5 h-5 text-gray-500 group-hover:text-[#0A2E24]" />
                    </div>
                    <span className="text-[11px] font-extrabold text-gray-700 group-hover:text-[#0A2E24]">
                      + Add Image
                    </span>
                    <span className="text-[9px] text-gray-400">Click or take photo</span>
                  </div>
                )}
              </div>

              {/* Box Footer / Paste URL toggle */}
              <div className="px-2 py-1 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between text-[10px]">
                <button
                  type="button"
                  onClick={(e) => handleOpenUrlModal(box.index, e)}
                  className="text-gray-500 hover:text-[#0A2E24] flex items-center gap-1 cursor-pointer font-medium"
                >
                  <LinkIcon className="w-2.5 h-2.5" />
                  <span>{hasImage ? 'Edit URL' : 'Paste URL'}</span>
                </button>

                {hasImage && (
                  <span className="text-emerald-700 font-bold text-[9px] flex items-center gap-0.5" title={isExternalLink ? 'External Web URL' : `Compressed (${formatBytes(sizeBytes)})`}>
                    <Check className="w-2.5 h-2.5" />
                    <span>{isExternalLink ? 'URL' : formatBytes(sizeBytes)}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* URL Input Modal Dialog */}
      {urlModalIndex !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setUrlModalIndex(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl p-5 border-2 border-[#C8A165] shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#0A2E24] text-sm flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#C8A165]" />
                <span>Enter Image URL for {IMAGE_BOX_LABELS[urlModalIndex]?.label}</span>
              </h4>
              <button 
                onClick={() => setUrlModalIndex(null)}
                className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">HTTP / HTTPS Image URL</label>
              <input
                type="url"
                value={urlInputVal}
                onChange={(e) => setUrlInputVal(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#C8A165] bg-white font-mono"
                autoFocus
              />
              <p className="text-[10px] text-gray-500">
                Pasting a direct web link uses no local storage and saves instantly.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUrlModalIndex(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUrlModal}
                className="px-4 py-1.5 rounded-lg bg-[#0A2E24] text-[#E0C18B] border border-[#C8A165] text-xs font-bold hover:bg-[#124A3B] cursor-pointer"
              >
                Set Image URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
