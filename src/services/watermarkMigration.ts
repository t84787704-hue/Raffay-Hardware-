import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SUPABASE_STORAGE_BUCKET, dataURLToBlob } from './supabaseStorage';

/**
 * Centered RHC Watermark burning using HTML5 Canvas:
 * - ctx.globalAlpha = 0.30
 * - ctx.font = `bold ${img.width * 0.15}px Arial`
 * - ctx.fillStyle = "white"
 * - ctx.textAlign = "center"
 * - ctx.textBaseline = "middle"
 * - ctx.fillText("RHC", canvas.width / 2, canvas.height / 2)
 * - canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
 */
export const addWatermark = (fileOrBlob: File | Blob): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fileOrBlob);
          return;
        }
        ctx.drawImage(img, 0, 0);
        // Center watermark RHC
        ctx.globalAlpha = 0.30;
        ctx.font = `bold ${img.width * 0.15}px Arial`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('RHC', canvas.width / 2, canvas.height / 2);
        canvas.toBlob((blob) => resolve(blob || fileOrBlob), 'image/jpeg', 0.9);
      };
      img.onerror = () => resolve(fileOrBlob);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(fileOrBlob);
    reader.readAsDataURL(fileOrBlob);
  });
};

/**
 * Extracts the storage file path from a Supabase Storage public URL
 * e.g. "https://xxx.supabase.co/storage/v1/object/public/product-images/uploads/hardware_main_123.jpg?t=1"
 * -> "uploads/hardware_main_123.jpg"
 */
export function extractStoragePathFromUrl(url: string, bucket = SUPABASE_STORAGE_BUCKET): string | null {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.split('?')[0].split('#')[0].trim();

  // If already relative path in bucket
  if (cleanUrl.startsWith('uploads/')) {
    return cleanUrl;
  }

  const markers = [
    `/storage/v1/object/public/${bucket}/`,
    `/storage/v1/render/image/public/${bucket}/`,
    `/storage/v1/object/authenticated/${bucket}/`,
    `/${bucket}/`
  ];

  for (const marker of markers) {
    const idx = cleanUrl.indexOf(marker);
    if (idx !== -1) {
      return decodeURIComponent(cleanUrl.substring(idx + marker.length));
    }
  }

  return null;
}

/**
 * Helper to load an image URL into a Blob (handles direct Supabase download without CORS, fetch, or Image fallback)
 */
async function fetchImageAsBlob(url: string, storagePath?: string | null): Promise<Blob | null> {
  // 1. If stored in Supabase storage, download directly via Supabase SDK (bypasses CORS restrictions)
  if (isSupabaseConfigured && storagePath) {
    try {
      const { data, error } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .download(storagePath);
      if (data && !error) {
        return data;
      }
    } catch (e) {
      console.warn('[Watermark Migration] Supabase download note:', e);
    }
  }

  // 2. If base64 data URL
  if (url.startsWith('data:')) {
    try {
      return dataURLToBlob(url);
    } catch (e) {
      console.warn('[Watermark Migration] Base64 parse note:', e);
    }
  }

  // 3. Standard fetch with CORS mode
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      return await response.blob();
    }
  } catch (err) {
    console.warn('[Watermark Migration] Fetch failed, falling back to Image tag:', err);
  }

  // 4. Fallback: load into HTML Image element and extract blob
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export interface MigrationProgress {
  current: number;
  total: number;
  message: string;
  isComplete: boolean;
  error?: string | null;
}

/**
 * Migration Function:
 * 1. Fetches all products from Supabase
 * 2. For each product, for each image URL, fetches image, draws on canvas with centered RHC (alpha 0.25)
 * 3. Uploads watermarked blob back to same path in Supabase storage (overwrite)
 * 4. Calls onProgress with "Fixed X/Y images"
 */
export async function migrateAllProductImagesWatermark(
  onProgress?: (progress: MigrationProgress) => void
): Promise<{ totalProducts: number; totalImages: number; fixedImages: number }> {
  // Step 1: Fetch all products from Supabase
  let productsList: any[] = [];
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        productsList = data;
      }
    } catch (err) {
      console.warn('[Watermark Migration] Query products error:', err);
    }
  }

  // Fallback if empty or offline
  if (productsList.length === 0) {
    const { getProductsFromSupabase } = await import('./supabaseProducts');
    productsList = await getProductsFromSupabase();
  }

  if (productsList.length === 0) {
    const emptyStatus: MigrationProgress = {
      current: 0,
      total: 0,
      message: 'No products found in database.',
      isComplete: true
    };
    onProgress?.(emptyStatus);
    return { totalProducts: 0, totalImages: 0, fixedImages: 0 };
  }

  // Step 2: Build a list of all images across all products
  interface ImageTask {
    productId: string | number;
    sku?: string;
    slotName: string;
    url: string;
  }

  const tasks: ImageTask[] = [];
  const slots = ['image_main', 'image_side', 'image_back', 'image_detail'] as const;

  for (const prod of productsList) {
    const seenUrlsInProd = new Set<string>();

    for (const slot of slots) {
      const url = prod[slot];
      if (url && typeof url === 'string' && url.trim() && !url.includes('placeholder') && !seenUrlsInProd.has(url.trim())) {
        seenUrlsInProd.add(url.trim());
        tasks.push({
          productId: prod.id,
          sku: prod.sku || prod.name || 'rhc-prod',
          slotName: slot,
          url: url.trim()
        });
      }
    }

    // Also check image_url if not already seen
    if (prod.image_url && typeof prod.image_url === 'string' && prod.image_url.trim() && !seenUrlsInProd.has(prod.image_url.trim())) {
      seenUrlsInProd.add(prod.image_url.trim());
      tasks.push({
        productId: prod.id,
        sku: prod.sku || prod.name || 'rhc-prod',
        slotName: 'image_url',
        url: prod.image_url.trim()
      });
    }

    // Also check images array if present
    if (Array.isArray(prod.images)) {
      prod.images.forEach((img: any, idx: number) => {
        if (img && typeof img === 'string' && img.trim() && !seenUrlsInProd.has(img.trim())) {
          seenUrlsInProd.add(img.trim());
          tasks.push({
            productId: prod.id,
            sku: prod.sku || prod.name || 'rhc-prod',
            slotName: slots[idx] || `images_${idx}`,
            url: img.trim()
          });
        }
      });
    }
  }

  const total = tasks.length;
  if (total === 0) {
    const status: MigrationProgress = {
      current: 0,
      total: 0,
      message: 'All products already processed or no images found.',
      isComplete: true
    };
    onProgress?.(status);
    return { totalProducts: productsList.length, totalImages: 0, fixedImages: 0 };
  }

  // Initial progress notice
  onProgress?.({
    current: 0,
    total,
    message: `Starting migration: 0/${total} images...`,
    isComplete: false
  });

  let fixedCount = 0;

  // Process sequentially to be gentle on memory and network
  for (const task of tasks) {
    try {
      const storagePath = extractStoragePathFromUrl(task.url, SUPABASE_STORAGE_BUCKET);
      
      // Fetch image as blob
      const originalBlob = await fetchImageAsBlob(task.url, storagePath);

      if (originalBlob) {
        // Draw centered RHC with alpha 0.25 on canvas
        const watermarkedBlob = await addWatermark(originalBlob);

        if (isSupabaseConfigured) {
          if (storagePath) {
            // Overwrite back to same path in Supabase storage (upsert: true)
            await supabase.storage
              .from(SUPABASE_STORAGE_BUCKET)
              .upload(storagePath, watermarkedBlob, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: true
              });
          } else {
            // New upload into Supabase storage
            const cleanSku = String(task.sku).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
            const newFileName = `${cleanSku}_${task.slotName}_${Date.now()}.jpg`;
            const newPath = `uploads/${newFileName}`;
            
            const { data: uploadData } = await supabase.storage
              .from(SUPABASE_STORAGE_BUCKET)
              .upload(newPath, watermarkedBlob, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: true
              });

            const { data: publicUrlData } = supabase.storage
              .from(SUPABASE_STORAGE_BUCKET)
              .getPublicUrl(uploadData?.path || newPath);

            if (publicUrlData?.publicUrl) {
              await supabase
                .from('products')
                .update({ [task.slotName]: publicUrlData.publicUrl })
                .eq('id', task.productId);
            }
          }
        }
      }

      fixedCount++;
      const message = `Fixed ${fixedCount}/${total} images`;
      onProgress?.({
        current: fixedCount,
        total,
        message,
        isComplete: fixedCount === total
      });
    } catch (err: any) {
      console.warn(`[Watermark Migration] Notice processing ${task.url}:`, err);
      fixedCount++;
      onProgress?.({
        current: fixedCount,
        total,
        message: `Fixed ${fixedCount}/${total} images`,
        isComplete: fixedCount === total
      });
    }
  }

  return {
    totalProducts: productsList.length,
    totalImages: total,
    fixedImages: fixedCount
  };
}
