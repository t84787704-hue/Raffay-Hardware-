import { compressAndConvert } from '../utils/imageUtils';

/**
 * In-browser Image Converter (Replaces Firebase Storage completely)
 * Immediately compresses images to Base64 (<150KB JPEG) or passes direct URLs.
 * Zero external storage dependency, zero CORS errors, zero upload lag.
 */
export async function uploadProductImageToStorage(
  file: File | Blob | string, 
  customPathOrSku?: string,
  viewIndex: number = 1
): Promise<string> {
  // Compress in browser instantly
  return compressAndConvert(file);
}

/**
 * No-op image deletion (since images are Base64/URLs directly in Firestore documents)
 */
export async function deleteProductImageFromStorage(imageUrl: string): Promise<void> {
  // Base64 images are automatically deleted when the product Firestore doc is deleted
}
