import { supabase } from '../lib/supabase';
import { getBase64SizeBytes, formatBytes } from '../utils/imageUtils';

export const DEFAULT_BRAND_LOGO = '/logo-v2.png';

export interface BrandingSettings {
  logoUrl: string | null;
  updatedAt?: any;
  updatedBy?: string;
}

/**
 * Compresses an uploaded logo file to Base64 data URL.
 */
export async function compressLogoFile(
  file: File,
  maxWidth = 360,
  maxHeight = 360
): Promise<{ base64: string; sizeBytes: number; sizeFormatted: string }> {
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Image file is too large. Maximum allowed size is 2MB.');
  }

  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error('Unsupported image format. Please upload .png, .jpg, .jpeg, or .webp.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return reject(new Error('Failed to read logo file.'));

      if (file.type === 'image/svg+xml' || file.size < 25 * 1024) {
        const sizeBytes = getBase64SizeBytes(src);
        return resolve({
          base64: src,
          sizeBytes,
          sizeFormatted: formatBytes(sizeBytes)
        });
      }

      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width || 300;
          let height = img.naturalHeight || img.height || 300;

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
          if (!ctx) return reject(new Error('Failed to initialize canvas.'));

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const isPng = file.type === 'image/png';
          let outputBase64 = isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85);
          let sizeBytes = getBase64SizeBytes(outputBase64);

          if (sizeBytes > 48 * 1024 && isPng) {
            outputBase64 = canvas.toDataURL('image/jpeg', 0.80);
            sizeBytes = getBase64SizeBytes(outputBase64);
          }

          resolve({
            base64: outputBase64,
            sizeBytes,
            sizeFormatted: formatBytes(sizeBytes)
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Could not decode uploaded logo.'));
      img.src = src;
    };

    reader.onerror = () => reject(new Error('Failed to read image.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Subscribes to branding settings
 */
export function subscribeToBranding(
  onUpdate: (settings: BrandingSettings) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const saved = localStorage.getItem('rhc_branding_logo');
    if (saved) {
      onUpdate({ logoUrl: saved });
    }
  } catch (err) {
    console.warn('LocalStorage error on branding:', err);
    if (onError) onError(err);
  }

  return () => {};
}

/**
 * Saves a new custom logo URL
 */
export async function saveLogoToSupabase(logoUrl: string, updatedBy = 'RHC Admin'): Promise<void> {
  return saveLogoToStorage(logoUrl, updatedBy);
}

export async function saveLogoToStorage(logoUrl: string, updatedBy = 'RHC Admin'): Promise<void> {
  if (!logoUrl || !logoUrl.trim()) {
    throw new Error('Please provide a valid logo image.');
  }
  try {
    localStorage.setItem('rhc_branding_logo', logoUrl.trim());
    console.log('[Branding] Website logo successfully saved.');
  } catch (err) {
    console.warn('[Branding] Error saving logo:', err);
  }
}

/**
 * Resets logo to default
 */
export async function resetLogoInSupabase(): Promise<void> {
  return resetLogoInStorage();
}

export async function resetLogoInStorage(): Promise<void> {
  try {
    localStorage.removeItem('rhc_branding_logo');
    console.log('[Branding] Website logo reset to default.');
  } catch (err) {
    console.warn('[Branding] Error resetting logo:', err);
  }
}
