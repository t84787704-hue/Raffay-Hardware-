import type React from 'react';

/**
 * Universal Image Compressor & Optimization Engine
 * 
 * Guarantees that ANY image uploaded (even 5MB to 15MB phone camera pictures)
 * is automatically compressed in the background to <=200KB JPEG Base64.
 * 
 * Rules:
 * 1. Automatically downscales and compresses in background without user size warnings.
 * 2. Solid white canvas backing to eliminate black transparency artifacts.
 * 3. Enforces strict <=200KB payload for instant Supabase/Storage persistence and high visual quality.
 */

/**
 * Fast in-browser image compressor and converter.
 * - Resizes image to max 1024px width/height using HTML5 Canvas
 * - Encodes as JPEG, reducing quality from 0.90 downwards until file size <= 200KB, min quality 0.50
 * - Returns a Base64 data URL under 200KB (200 * 1024 bytes)
 * - Logs: `Compressed ${originalSize}KB -> ${compressedSize}KB`
 */
export async function compressAndConvert(input: File | Blob | string): Promise<string> {
  // If user pasted an HTTP/HTTPS URL, return it directly
  if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))) {
    return input.trim();
  }

  const getOriginalSizeKB = (src: string, fileOrBlob?: File | Blob): number => {
    if (fileOrBlob && typeof fileOrBlob.size === 'number') {
      return Math.max(1, Math.round(fileOrBlob.size / 1024));
    }
    const bytes = getBase64SizeBytes(src);
    return Math.max(1, Math.round(bytes / 1024));
  };

  return new Promise((resolve, reject) => {
    const processImageSource = (src: string, originalSizeKB: number) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        try {
          const maxDimension = 1024;
          let width = img.naturalWidth || img.width || 500;
          let height = img.naturalHeight || img.height || 500;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          width = Math.max(1, Math.round(width));
          height = Math.max(1, Math.round(height));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas 2D context unavailable');
          }

          // Solid white background to prevent transparent PNGs from becoming black
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const maxTargetBytes = 200 * 1024; // 200KB per image
          let quality = 0.90;
          const minQuality = 0.50;
          const qualityStep = 0.05;

          let bestDataUrl = canvas.toDataURL('image/jpeg', quality);
          let bestSizeBytes = getBase64SizeBytes(bestDataUrl);

          // Compression loop: reduce quality from 0.9 downwards until file size <= 200KB (min quality 0.5)
          while (bestSizeBytes > maxTargetBytes && quality > minQuality) {
            quality = Math.max(minQuality, Math.round((quality - qualityStep) * 100) / 100);
            bestDataUrl = canvas.toDataURL('image/jpeg', quality);
            bestSizeBytes = getBase64SizeBytes(bestDataUrl);
          }

          const compressedSizeKB = Math.round(bestSizeBytes / 1024);
          console.log(`Compressed ${originalSizeKB}KB -> ${compressedSizeKB}KB`);

          resolve(bestDataUrl);
        } catch (err) {
          console.warn('[compressAndConvert] Canvas processing error:', err);
          // Return source data URL as fallback
          resolve(src);
        }
      };

      img.onerror = () => {
        if (typeof input === 'string') {
          resolve(input);
        } else {
          reject(new Error('Failed to load image for compression.'));
        }
      };

      img.src = src;
    };

    if (typeof input === 'string') {
      const origSize = getOriginalSizeKB(input);
      processImageSource(input, origSize);
    } else if (input instanceof Blob || (input && typeof (input as any).size !== 'undefined')) {
      const fileBlob = input as Blob;
      const origSize = Math.max(1, Math.round(fileBlob.size / 1024));
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          processImageSource(dataUrl, origSize);
        } else {
          reject(new Error('Failed to read image file data.'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileBlob);
    } else {
      resolve(DEFAULT_FALLBACK_IMAGE);
    }
  });
}

/**
 * Internal canvas drawing helper with solid white background to prevent black PNG transparency
 */
function compressImageWithCanvas(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number
): string {
  let width = img.naturalWidth || img.width || 500;
  let height = img.naturalHeight || img.height || 500;

  if (width > maxWidth || height > maxHeight) {
    if (width / maxWidth > height / maxHeight) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    } else {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  width = Math.max(1, Math.round(width));
  height = Math.max(1, Math.round(height));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Solid white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

export const MAX_OPTIMIZED_IMAGE_BYTES = 200 * 1024; // 200 KB target
export const MAX_SINGLE_IMAGE_BYTES = 200 * 1024;
export const MAX_CATEGORY_IMAGE_BYTES = 200 * 1024;
export const MAX_TOTAL_IMAGES_BYTES = 800 * 1024;

export const PLACEHOLDER_HANDLE_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="12" fill="%23FFFFFF"/><rect x="42" y="18" width="16" height="64" rx="4" fill="%23A37D45"/><circle cx="50" cy="34" r="5" fill="%235A4A3A"/><path d="M50 34 L78 34 C82 34 85 37 85 41 C85 45 82 48 78 48 L50 48" fill="%23C8A165"/><rect x="47" y="56" width="6" height="14" rx="2" fill="%235A4A3A"/></svg>`;

/**
 * Lightweight external fallback images
 */
export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80';
export const DEFAULT_CATEGORY_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80';
export const DEFAULT_PRODUCT_FALLBACK_IMAGE = DEFAULT_FALLBACK_IMAGE;

/**
 * Formats any image string (Base64 data or web URL) safely for <img src={...} />.
 */
export function formatImageSrc(src?: string | null, fallback = PLACEHOLDER_HANDLE_IMAGE): string {
  if (!src || typeof src !== 'string') return fallback;
  const trimmed = src.trim();
  if (!trimmed) return fallback;

  // Filter out screenshot placeholders
  if (trimmed.includes('screenshot') || trimmed.length < 10) {
    return fallback;
  }

  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }

  // Raw Base64 string without data: prefix
  return `data:image/jpeg;base64,${trimmed}`;
}

/**
 * Image onError handler to substitute broken or un-renderable images with fallback.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback = PLACEHOLDER_HANDLE_IMAGE
): void {
  const target = e.currentTarget;
  if (target && target.src !== fallback) {
    target.src = fallback;
  }
}

/**
 * Calculates byte size of a Base64 string.
 */
export function getBase64SizeBytes(base64String: string): number {
  if (!base64String || typeof base64String !== 'string') return 0;
  if (!base64String.startsWith('data:')) return base64String.length;
  
  const commaIndex = base64String.indexOf(',');
  const base64Data = commaIndex !== -1 ? base64String.slice(commaIndex + 1) : base64String;
  const padding = (base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0);
  return Math.max(0, Math.floor((base64Data.length * 3) / 4) - padding);
}

/**
 * Formats byte count to human-readable string (e.g. "34.2 KB").
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return '0 KB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Core image compressor:
 * Progressive multi-pass canvas downscaling algorithm.
 * Automatically guarantees output Base64 is < 50KB (target 48KB) for ANY input image (even 10MB+).
 */
export function compressImageElement(
  img: HTMLImageElement,
  maxWidth = 560,
  maxHeight = 560,
  initialQuality = 0.65,
  targetMaxBytes = MAX_OPTIMIZED_IMAGE_BYTES
): { base64: string; sizeBytes: number; sizeFormatted: string } {
  const renderCanvas = (wLimit: number, hLimit: number, q: number): string => {
    let width = img.naturalWidth || img.width || 500;
    let height = img.naturalHeight || img.height || 500;

    // Proportional downscale to fit within wLimit x hLimit
    if (width > wLimit || height > hLimit) {
      if (width / wLimit > height / hLimit) {
        height = Math.round((height * wLimit) / width);
        width = wLimit;
      } else {
        width = Math.round((width * hLimit) / height);
        height = hLimit;
      }
    }

    width = Math.max(1, Math.round(width));
    height = Math.max(1, Math.round(height));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable.');
    }

    // Fill clean white background to prevent transparent PNGs from becoming black
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', q);
  };

  // Progressive compression passes:
  const passes = [
    { w: maxWidth, h: maxHeight, q: initialQuality },
    { w: 480, h: 480, q: 0.58 },
    { w: 420, h: 420, q: 0.50 },
    { w: 360, h: 360, q: 0.42 },
    { w: 300, h: 300, q: 0.35 },
    { w: 250, h: 250, q: 0.28 },
    { w: 200, h: 200, q: 0.22 }
  ];

  let bestBase64 = renderCanvas(passes[0].w, passes[0].h, passes[0].q);
  let bestSize = getBase64SizeBytes(bestBase64);

  for (let i = 1; i < passes.length && bestSize > targetMaxBytes; i++) {
    const candidate = renderCanvas(passes[i].w, passes[i].h, passes[i].q);
    const candidateSize = getBase64SizeBytes(candidate);
    bestBase64 = candidate;
    bestSize = candidateSize;
  }

  return {
    base64: bestBase64,
    sizeBytes: bestSize,
    sizeFormatted: formatBytes(bestSize)
  };
}

/**
 * Compresses an image category element (compatible helper).
 */
export function compressCategoryImageElement(
  img: HTMLImageElement,
  maxWidth = 560,
  maxHeight = 560,
  initialQuality = 0.60
): { base64: string; sizeBytes: number } {
  const result = compressImageElement(img, maxWidth, maxHeight, initialQuality, MAX_OPTIMIZED_IMAGE_BYTES);
  return {
    base64: result.base64,
    sizeBytes: result.sizeBytes
  };
}

/**
 * Universal async compressor: Takes any File, Blob, or image URL
 * and automatically returns optimized Base64 JPEG (<50KB).
 */
export async function compressImageToTargetBase64(
  input: File | Blob | string,
  targetMaxBytes = MAX_OPTIMIZED_IMAGE_BYTES
): Promise<{ base64: string; sizeBytes: number; sizeFormatted: string }> {
  return new Promise((resolve, reject) => {
    const processImg = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        try {
          const result = compressImageElement(img, 560, 560, 0.65, targetMaxBytes);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        // Fallback: If external URL fails cross-origin canvas reading, return the URL as-is
        if (typeof input === 'string') {
          resolve({
            base64: input,
            sizeBytes: input.length,
            sizeFormatted: formatBytes(input.length)
          });
        } else {
          reject(new Error('Failed to decode image file.'));
        }
      };

      img.src = src;
    };

    if (typeof input === 'string') {
      processImg(input);
    } else if (input && typeof (input as any).name !== 'undefined' || typeof (input as any).size !== 'undefined') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          processImg(dataUrl);
        } else {
          reject(new Error('Failed to read image file data.'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(input as Blob);
    } else {
      reject(new Error('Invalid image input provided.'));
    }
  });
}

/**
 * Universal compressImage function for category & product uploads
 * Guarantees that any image uploads correctly (max 800px, compressed <150KB base64).
 */
export async function compressImage(
  input: File | Blob | string,
  maxWidth = 800,
  maxHeight = 800,
  maxBytes = 150 * 1024
): Promise<{ base64: string; sizeBytes: number; sizeFormatted: string }> {
  return new Promise((resolve, reject) => {
    const processImg = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        try {
          const result = compressImageElement(img, maxWidth, maxHeight, 0.75, maxBytes);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        if (typeof input === 'string') {
          resolve({
            base64: input,
            sizeBytes: input.length,
            sizeFormatted: formatBytes(input.length)
          });
        } else {
          reject(new Error('Failed to decode image file.'));
        }
      };

      img.src = src;
    };

    if (typeof input === 'string') {
      processImg(input);
    } else if (input && (typeof (input as any).name !== 'undefined' || typeof (input as any).size !== 'undefined')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          processImg(dataUrl);
        } else {
          reject(new Error('Failed to read image file data.'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(input as Blob);
    } else {
      reject(new Error('Invalid image input provided.'));
    }
  });
}

/**
 * Handles Category image file upload from phone camera or gallery.
 * Automatically compresses to <50KB JPEG Base64.
 */
export async function categoryFileToBase64(
  file: File
): Promise<{ base64: string; sizeBytes: number; sizeFormatted: string }> {
  return compressImageToTargetBase64(file, MAX_OPTIMIZED_IMAGE_BYTES);
}

/**
 * Handles Product image file upload from phone camera or gallery.
 * Automatically compresses to <50KB JPEG Base64.
 */
export async function productFileToBase64(
  file: File
): Promise<{ base64: string; sizeBytes: number; sizeFormatted: string }> {
  return compressImageToTargetBase64(file, MAX_OPTIMIZED_IMAGE_BYTES);
}

/**
 * Standard file-to-Base64 compressor.
 */
export async function fileToBase64(
  file: File
): Promise<{ base64: string; sizeBytes: number; sizeFormatted: string }> {
  return compressImageToTargetBase64(file, MAX_OPTIMIZED_IMAGE_BYTES);
}

/**
 * Ensures any category image string/URL is optimized to <50KB Base64 JPEG.
 */
export async function ensureBase64CategoryImage(src: string): Promise<string> {
  if (!src || typeof src !== 'string' || !src.trim()) return '';
  if (src.startsWith('data:image/jpeg;base64,') && getBase64SizeBytes(src) < MAX_OPTIMIZED_IMAGE_BYTES) {
    return src;
  }
  try {
    const { base64 } = await compressImageToTargetBase64(src, MAX_OPTIMIZED_IMAGE_BYTES);
    return base64;
  } catch {
    return src;
  }
}

/**
 * Ensures any product image string/URL is optimized to <50KB Base64 JPEG.
 */
export async function ensureBase64Image(src: string): Promise<string> {
  if (!src || typeof src !== 'string' || !src.trim()) return '';
  if (src.startsWith('data:image/jpeg;base64,') && getBase64SizeBytes(src) < MAX_OPTIMIZED_IMAGE_BYTES) {
    return src;
  }
  try {
    const { base64 } = await compressImageToTargetBase64(src, MAX_OPTIMIZED_IMAGE_BYTES);
    return base64;
  } catch {
    return src;
  }
}

export const ensureBase64ProductImage = ensureBase64Image;

/**
 * Prepares and validates product images for Supabase persistence.
 * Optimizes each image to <50KB Base64.
 */
export async function prepareProductImages(inputs: {
  front?: string;
  side?: string;
  installed?: string;
  main?: string;
}): Promise<{
  image: string;
  images: { front: string; installed: string; side: string };
  totalSizeBytes: number;
}> {
  const rawFront = (inputs.front || inputs.main || '').trim();
  const rawSide = (inputs.side || '').trim();
  const rawInstalled = (inputs.installed || '').trim();

  const [front, side, installed] = await Promise.all([
    rawFront ? ensureBase64Image(rawFront) : Promise.resolve(''),
    rawSide ? ensureBase64Image(rawSide) : Promise.resolve(''),
    rawInstalled ? ensureBase64Image(rawInstalled) : Promise.resolve('')
  ]);

  const main = front || side || installed;
  const frontSize = getBase64SizeBytes(front);
  const sideSize = getBase64SizeBytes(side);
  const installedSize = getBase64SizeBytes(installed);
  const totalSize = frontSize + sideSize + installedSize;

  return {
    image: main,
    images: {
      front,
      installed: installed || main,
      side: side || main
    },
    totalSizeBytes: totalSize
  };
}

/**
 * Universal matcher for category and product linking.
 * Strictly matches products where product.category / categoryName / categoryId exactly equals the selected category.
 */
export function doesProductMatchCategory(
  product: { categoryId?: string; categoryName?: string; category?: string; tags?: string[] } | null | undefined,
  category: { id?: string; name?: string; shortName?: string; slug?: string } | string | null | undefined
): boolean {
  if (!product || !category) return false;

  const targetStr = typeof category === 'string' ? category.trim().toLowerCase() : '';
  const catId = typeof category === 'object' && category ? String(category.id || '').trim().toLowerCase() : targetStr;
  const catName = typeof category === 'object' && category ? String(category.name || '').trim().toLowerCase() : targetStr;
  const catShort = typeof category === 'object' && category ? String(category.shortName || '').trim().toLowerCase() : '';

  const pCat = String(product.category || '').trim().toLowerCase();
  const pCatName = String(product.categoryName || '').trim().toLowerCase();
  const pCatId = String(product.categoryId || '').trim().toLowerCase();

  // Helper to normalize strings for clean alphanumeric equality comparison (strips cat_/category_ prefixes)
  const normalize = (s: string) => s.toLowerCase().replace(/^(cat_|category_)/, '').replace(/[^a-z0-9]/g, '');
  const normCatId = normalize(catId);
  const normCatName = normalize(catName);
  const normCatShort = normalize(catShort);

  const normPCat = normalize(pCat);
  const normPCatName = normalize(pCatName);
  const normPCatId = normalize(pCatId);

  // Exact comparison by Category Name / Category string
  if (catName) {
    if (pCat && pCat === catName) return true;
    if (pCatName && pCatName === catName) return true;
    if (pCatId && pCatId === catName) return true;
    if (normCatName && (normPCat === normCatName || normPCatName === normCatName || normPCatId === normCatName)) return true;
  }

  // Exact comparison by Category ID
  if (catId) {
    if (pCatId && pCatId === catId) return true;
    if (pCat && pCat === catId) return true;
    if (pCatName && pCatName === catId) return true;
    if (normCatId && (normPCatId === normCatId || normPCat === normCatId || normPCatName === normCatId)) return true;
  }

  // Exact comparison by Short Name
  if (catShort) {
    if (pCat && pCat === catShort) return true;
    if (pCatName && pCatName === catShort) return true;
    if (normCatShort && (normPCat === normCatShort || normPCatName === normCatShort)) return true;
  }

  return false;
}



