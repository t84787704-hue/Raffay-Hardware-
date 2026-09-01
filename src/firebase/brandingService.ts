import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from './config';
import { getBase64SizeBytes, formatBytes } from '../utils/imageUtils';

export const BRANDING_COLLECTION = 'settings';
export const BRANDING_DOC_ID = 'branding';
export const DEFAULT_BRAND_LOGO = '/logo-v2.png';

export interface BrandingSettings {
  logoUrl: string | null;
  updatedAt?: any;
  updatedBy?: string;
}

/**
 * Subscribes to Firestore settings/branding in real-time.
 */
export function subscribeToBranding(
  onUpdate: (settings: BrandingSettings) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, BRANDING_COLLECTION, BRANDING_DOC_ID);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          logoUrl: data.logoUrl ? String(data.logoUrl).trim() : null,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        });
      } else {
        onUpdate({ logoUrl: null });
      }
    },
    (err) => {
      console.warn('[Firebase Firestore] Branding subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * One-time fetch of branding settings from Firestore.
 */
export async function getBrandingFromFirestore(): Promise<BrandingSettings> {
  try {
    const docRef = doc(db, BRANDING_COLLECTION, BRANDING_DOC_ID);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        logoUrl: data.logoUrl ? String(data.logoUrl).trim() : null,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy
      };
    }
  } catch (err) {
    console.warn('[Firebase Firestore] Failed to fetch branding settings:', err);
  }
  return { logoUrl: null };
}

/**
 * Saves a new custom logo URL (Base64 string or HTTPS URL) to Firestore settings/branding.
 */
export async function saveLogoToFirestore(logoUrl: string, updatedBy = 'RHC Admin'): Promise<void> {
  if (!logoUrl || !logoUrl.trim()) {
    throw new Error('Please provide a valid logo image.');
  }

  const docRef = doc(db, BRANDING_COLLECTION, BRANDING_DOC_ID);
  await setDoc(
    docRef, 
    {
      logoUrl: logoUrl.trim(),
      updatedAt: serverTimestamp(),
      updatedBy
    }, 
    { merge: true }
  );
  console.log('[Firebase Firestore] Website logo successfully saved to settings/branding doc.');
}

/**
 * Resets logo to default by removing custom logoUrl in Firestore settings/branding.
 */
export async function resetLogoInFirestore(): Promise<void> {
  const docRef = doc(db, BRANDING_COLLECTION, BRANDING_DOC_ID);
  await setDoc(
    docRef,
    {
      logoUrl: null,
      updatedAt: serverTimestamp(),
      updatedBy: 'RHC Admin (Reset)'
    },
    { merge: true }
  );
  console.log('[Firebase Firestore] Website logo reset to default in settings/branding.');
}

/**
 * Compresses an uploaded logo file (PNG, JPG, JPEG, WEBP) to an optimized Base64 data URL.
 * Preserves transparency for PNG/WEBP when possible, or sets clean background.
 */
export async function compressLogoFile(
  file: File,
  maxWidth = 360,
  maxHeight = 360
): Promise<{ base64: string; sizeBytes: number; sizeFormatted: string }> {
  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Image file is too large. Maximum allowed size is 2MB.');
  }

  // Validate format
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error('Unsupported image format. Please upload .png, .jpg, .jpeg, or .webp.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        return reject(new Error('Failed to read logo file.'));
      }

      // If already an SVG or very small image, return directly
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
          if (!ctx) {
            return reject(new Error('Failed to initialize canvas for logo processing.'));
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // If PNG, keep PNG format if under 45KB, else convert to crisp JPEG
          const isPng = file.type === 'image/png';
          let outputBase64 = isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85);
          let sizeBytes = getBase64SizeBytes(outputBase64);

          // If output PNG is too large (>48KB), fall back to high quality JPEG with dark green or white backing
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

      img.onerror = () => reject(new Error('Could not decode the uploaded logo image.'));
      img.src = src;
    };

    reader.onerror = () => reject(new Error('Failed to read image file data.'));
    reader.readAsDataURL(file);
  });
}
