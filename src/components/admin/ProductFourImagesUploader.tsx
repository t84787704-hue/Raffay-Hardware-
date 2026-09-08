import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  Link as LinkIcon, 
  Check, 
  Sparkles,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Star
} from 'lucide-react';
import { compressAndConvert, formatImageSrc, formatBytes, getBase64SizeBytes, DEFAULT_FALLBACK_IMAGE, addWatermarkToImage } from '../../utils/imageUtils';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { uploadImageToSupabaseStorage } from '../../services/supabaseStorage';

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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);

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

      // TASK 1: Add RHC Watermark on upload via canvas
      const watermarkedFile = await addWatermarkToImage(file);

      // Upload watermarked file keeping original upload logic
      let secureUrl = '';
      try {
        secureUrl = await uploadToCloudinary(watermarkedFile);
      } catch (cloudErr) {
        // Fallback to Supabase Storage if Cloudinary is not configured
        secureUrl = await uploadImageToSupabaseStorage(watermarkedFile, sku || 'rhc-prod', `angle-${index + 1}`);
      }

      const nextImages = [...currentImages];
      nextImages[index] = secureUrl;
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

  // Move image left / up or right / down by step
  const handleMoveStep = (index: number, direction: 'prev' | 'next', e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= 4) return;

    const nextImages = [...currentImages];
    while (nextImages.length < 4) nextImages.push('');

    const temp = nextImages[index];
    nextImages[index] = nextImages[targetIndex];
    nextImages[targetIndex] = temp;

    onChange(nextImages);
  };

  // Set any photo directly as 1st Main Thumbnail
  const handleSetMainThumbnail = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (index === 0) return;

    const nextImages = [...currentImages];
    while (nextImages.length < 4) nextImages.push('');

    const [selected] = nextImages.splice(index, 1);
    nextImages.unshift(selected);
    if (nextImages.length > 4) nextImages.length = 4;

    onChange(nextImages);
  };

  // Drag and drop handlers to reorder images
  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const nextImages = [...currentImages];
    const [draggedItem] = nextImages.splice(draggedIndex, 1);
    nextImages.splice(targetIndex, 0, draggedItem);

    // Maintain 4 elements with index 0 as main thumbnail
    while (nextImages.length < 4) nextImages.push('');
    if (nextImages.length > 4) nextImages.length = 4;

    onChange(nextImages);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Mobile Touch Drag Support
  const handleTouchStart = (index: number) => {
    setTouchDragIndex(index);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchDragIndex === null) return;
    const touch = e.changedTouches[0];
    if (touch) {
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetBox = element?.closest('[data-image-box-index]');
      if (targetBox) {
        const targetIndexStr = targetBox.getAttribute('data-image-box-index');
        if (targetIndexStr !== null) {
          const targetIndex = parseInt(targetIndexStr, 10);
          if (!isNaN(targetIndex) && targetIndex !== touchDragIndex && targetIndex >= 0 && targetIndex < 4) {
            const nextImages = [...currentImages];
            const [draggedItem] = nextImages.splice(touchDragIndex, 1);
            nextImages.splice(targetIndex, 0, draggedItem);
            while (nextImages.length < 4) nextImages.push('');
            if (nextImages.length > 4) nextImages.length = 4;
            onChange(nextImages);
          }
        }
      }
    }
    setTouchDragIndex(null);
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
            Instant in-browser compression (<span className="text-[#0A2E24] font-semibold">&lt;200KB</span>) &amp; direct URL support. Optional to upload 1, 2, 3 or all 4 photos.
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
              data-image-box-index={box.index}
              draggable={hasImage}
              onDragStart={(e) => hasImage && handleDragStart(box.index, e)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(box.index, e)}
              onDragEnd={handleDragEnd}
              className={`relative flex flex-col rounded-2xl border-2 transition-all overflow-hidden text-left bg-white ${
                draggedIndex === box.index || touchDragIndex === box.index ? 'opacity-50 scale-95 border-[#C8A165] ring-2 ring-[#C8A165]' : ''
              } ${
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
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${
                    box.index === 0 ? 'bg-[#0A2E24] text-[#E0C18B]' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {box.index + 1}
                  </span>
                  <span className="text-[11px] font-bold text-[#0A2E24] truncate">
                    {box.index === 0 ? 'Main Thumbnail' : box.label.replace(' (Optional)', '')}
                  </span>
                </div>

                {/* Quick Step Buttons in Header */}
                {hasImage ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      disabled={box.index === 0}
                      onClick={(e) => handleMoveStep(box.index, 'prev', e)}
                      title="Move Up / Earlier (اوپر کریں)"
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-[#0A2E24] hover:text-white border border-gray-300 text-gray-700 disabled:opacity-25 disabled:pointer-events-none flex items-center gap-0.5 text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      <ArrowUp className="w-3 h-3" />
                      <span>Up</span>
                    </button>
                    <button
                      type="button"
                      disabled={box.index === 3}
                      onClick={(e) => handleMoveStep(box.index, 'next', e)}
                      title="Move Down / Later (نیچے کریں)"
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-[#0A2E24] hover:text-white border border-gray-300 text-gray-700 disabled:opacity-25 disabled:pointer-events-none flex items-center gap-0.5 text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      <span>Down</span>
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                ) : box.required ? (
                  <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200 flex-shrink-0">
                    Required
                  </span>
                ) : null}
              </div>

              {/* Box Image / Upload Trigger Area */}
              <div 
                onClick={() => {
                  if (!isCompressing && !disabled && draggedIndex === null && touchDragIndex === null) {
                    fileInputRefs[box.index].current?.click();
                  }
                }}
                className="relative aspect-square w-full flex flex-col items-center justify-center p-2 cursor-pointer group bg-white overflow-hidden"
              >
                {isCompressing ? (
                  <div className="flex flex-col items-center justify-center text-center p-2 space-y-1.5">
                    <Loader2 className="w-6 h-6 text-[#C8A165] animate-spin" />
                    <span className="text-[10px] font-bold text-[#0A2E24]">Uploading...</span>
                    <span className="text-[9px] text-gray-500 font-mono">Processing &amp; Upload</span>
                  </div>
                ) : hasImage ? (
                  <>
                    <img
                      src={formatImageSrc(imgUrl, DEFAULT_FALLBACK_IMAGE)}
                      alt={box.label}
                      draggable={false}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                    />

                    {/* RHC Watermark overlay in bottom-right corner (bold 24px semi-transparent white with black shadow) */}
                    <div 
                      className="absolute bottom-6 right-2 px-1 rounded text-[14px] font-black tracking-wider text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] pointer-events-none select-none z-10 font-sans"
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.95), -1px -1px 2px rgba(0,0,0,0.8)' }}
                    >
                      RHC
                    </div>

                    {/* Touch / Mouse Drag Handle Indicator */}
                    <div 
                      onTouchStart={() => handleTouchStart(box.index)}
                      onTouchEnd={handleTouchEnd}
                      title="Hold & drag to reorder"
                      className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold flex items-center gap-0.5 cursor-grab active:cursor-grabbing z-10"
                    >
                      <GripVertical className="w-3 h-3 text-[#C8A165]" />
                      <span>Drag</span>
                    </div>

                    {/* Make Main Thumbnail Button if not index 0 */}
                    {box.index !== 0 && (
                      <button
                        type="button"
                        title="Set as 1st Main Thumbnail"
                        onClick={(e) => handleSetMainThumbnail(box.index, e)}
                        className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[#0A2E24] hover:bg-[#124A3B] text-[#E0C18B] border border-[#C8A165] text-[9px] font-bold flex items-center gap-1 shadow-sm cursor-pointer z-10 transition-transform active:scale-95"
                      >
                        <Star className="w-2.5 h-2.5 fill-[#E0C18B]" />
                        <span>Set Main</span>
                      </button>
                    )}

                    {/* Delete Icon (X) */}
                    <button
                      type="button"
                      title="Remove image"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleRemoveImage(box.index, e)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer z-10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Overlay on hover for Re-upload / Change */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity text-white pointer-events-none">
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
                {hasImage ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={box.index === 0}
                        onClick={(e) => handleMoveStep(box.index, 'prev', e)}
                        className="px-1.5 py-0.5 rounded bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-0.5 text-[9px] font-bold cursor-pointer"
                        title="Move Up (اوپر)"
                      >
                        <ArrowUp className="w-2.5 h-2.5" />
                        <span>Up</span>
                      </button>
                      <button
                        type="button"
                        disabled={box.index === 3}
                        onClick={(e) => handleMoveStep(box.index, 'next', e)}
                        className="px-1.5 py-0.5 rounded bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-0.5 text-[9px] font-bold cursor-pointer"
                        title="Move Down (نیچے)"
                      >
                        <span>Down</span>
                        <ArrowDown className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleOpenUrlModal(box.index, e)}
                      className="text-gray-500 hover:text-[#0A2E24] flex items-center gap-1 cursor-pointer font-medium text-[9px]"
                    >
                      <LinkIcon className="w-2.5 h-2.5" />
                      <span>URL</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleOpenUrlModal(box.index, e)}
                      className="text-gray-500 hover:text-[#0A2E24] flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <LinkIcon className="w-2.5 h-2.5" />
                      <span>Paste URL</span>
                    </button>
                  </>
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
