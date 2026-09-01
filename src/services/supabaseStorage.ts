import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { compressAndConvert } from '../utils/imageUtils';

export const SUPABASE_STORAGE_BUCKET = 'product-images';

/**
 * Converts a base64 data URL into a Blob
 */
export function dataURLToBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Compresses an image in-browser to <150KB JPEG, then uploads it to the Supabase Storage bucket 'product-images'.
 * Returns the public URL of the uploaded image (or compressed base64 fallback).
 */
export async function uploadImageToSupabaseStorage(
  fileOrBase64: File | Blob | string,
  imageNamePrefix = 'product',
  slotName = 'main'
): Promise<string> {
  try {
    if (!fileOrBase64) return '';

    // If it's already an external public URL, return directly
    if (typeof fileOrBase64 === 'string' && (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://'))) {
      return fileOrBase64;
    }

    // Step 1: Compress in-browser to <150KB Base64 JPEG
    const compressedBase64 = await compressAndConvert(fileOrBase64);

    // If compressedBase64 is an external URL, return directly
    if (compressedBase64.startsWith('http://') || compressedBase64.startsWith('https://')) {
      return compressedBase64;
    }

    // If Supabase is not configured or in offline preview, retain high-efficiency compressed base64
    if (!isSupabaseConfigured) {
      console.log(`[Supabase Storage] Supabase credentials pending. Saved compressed ${slotName} image locally (<150KB).`);
      return compressedBase64;
    }

    // Step 2: Convert compressed base64 to Blob
    const blob = dataURLToBlob(compressedBase64);
    const fileName = `${imageNamePrefix}_${slotName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
    const filePath = `uploads/${fileName}`;

    // Step 3: Upload to Supabase Storage 'product-images'
    const { data, error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn(`[Supabase Storage] Storage note for bucket "${SUPABASE_STORAGE_BUCKET}":`, error.message);
      // If bucket doesn't exist or network error, return the compressed base64 (<150KB) so image is still saved
      return compressedBase64;
    }

    // Step 4: Retrieve public URL
    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(data?.path || filePath);

    const publicUrl = publicUrlData?.publicUrl;
    if (publicUrl) {
      console.log(`[Supabase Storage] Uploaded ${slotName} image successfully:`, publicUrl);
      return publicUrl;
    }

    return compressedBase64;
  } catch (err: any) {
    console.warn('[Supabase Storage] Note on image processing:', err?.message || err);
    if (typeof fileOrBase64 === 'string') {
      return fileOrBase64;
    }
    return '';
  }
}

/**
 * Uploads all 4 angles (main, side, back, detail) to Supabase Storage bucket 'product-images'.
 */
export async function uploadFourProductImagesToSupabase(
  images: string[],
  productNameSlug = 'hardware'
): Promise<{
  image_main: string;
  image_side: string;
  image_back: string;
  image_detail: string;
  image_url: string;
}> {
  const slots = ['main', 'side', 'back', 'detail'] as const;
  const urls = await Promise.all(
    slots.map(async (slot, idx) => {
      const img = images[idx] || '';
      if (!img || !img.trim()) return '';
      return uploadImageToSupabaseStorage(img, productNameSlug, slot);
    })
  );

  const image_main = urls[0] || '';
  const image_side = urls[1] || '';
  const image_back = urls[2] || '';
  const image_detail = urls[3] || '';
  const image_url = image_main || image_side || image_back || image_detail || '';

  return {
    image_main,
    image_side,
    image_back,
    image_detail,
    image_url
  };
}
