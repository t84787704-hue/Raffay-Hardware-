/**
 * Cloudinary Client-Side Unsigned Image Upload Service
 * 
 * Uses Cloudinary REST API to upload images directly from the browser:
 * Endpoint: https://api.cloudinary.com/v1_1/${cloudName}/image/upload
 */

export const CLOUDINARY_CLOUD_NAME: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.CLOUDINARY_CLOUD_NAME) ||
  (typeof process !== 'undefined' && process.env?.VITE_CLOUDINARY_CLOUD_NAME) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) ||
  (typeof process !== 'undefined' && process.env?.CLOUDINARY_CLOUD_NAME) ||
  '';

export const CLOUDINARY_UPLOAD_PRESET: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.CLOUDINARY_UPLOAD_PRESET) ||
  (typeof process !== 'undefined' && process.env?.VITE_CLOUDINARY_UPLOAD_PRESET) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) ||
  (typeof process !== 'undefined' && process.env?.CLOUDINARY_UPLOAD_PRESET) ||
  '';

export const isCloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET
);

/**
 * Uploads a single image (File, Blob, Base64 data URL) to Cloudinary via unsigned upload.
 * Returns the secure_url string (https://res.cloudinary.com/...).
 * 
 * @param file - File | Blob | string (Base64 data URL or existing image URL)
 * @returns Promise<string> - The Cloudinary secure_url
 */
export async function uploadToCloudinary(file: File | Blob | string): Promise<string> {
  if (!file) {
    return '';
  }

  // If already an online URL (e.g. from Cloudinary or an existing hosted image), return directly
  if (typeof file === 'string' && (file.startsWith('http://') || file.startsWith('https://'))) {
    return file.trim();
  }

  // If Cloudinary environment variables are missing
  if (!isCloudinaryConfigured) {
    console.warn(
      '[Cloudinary] Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET.',
      'Falling back to local data URL.'
    );

    if (typeof file === 'string') {
      return file;
    }

    // Convert File / Blob to Base64 data URL as fallback
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    console.log(`[Cloudinary] Uploading image to ${CLOUDINARY_CLOUD_NAME}...`);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.secure_url) {
      const errorMessage = data?.error?.message || `Cloudinary upload failed (HTTP ${response.status})`;
      console.error('[Cloudinary Upload Error]', errorMessage, data);
      throw new Error(`Cloudinary Error: ${errorMessage}`);
    }

    console.log('[Cloudinary] Upload successful! secure_url:', data.secure_url);
    return data.secure_url as string;
  } catch (error: any) {
    console.error('[Cloudinary] Upload exception:', error);

    // If input is already a string (e.g. Base64), return it as fallback if network fails
    if (typeof file === 'string') {
      return file;
    }

    throw error;
  }
}

/**
 * Uploads an array of images (up to 4 angles) to Cloudinary in parallel.
 * Returns array of secure_url strings in matching order.
 */
export async function uploadMultipleToCloudinary(
  files: (File | Blob | string)[]
): Promise<string[]> {
  return Promise.all(
    files.map(async (f) => {
      if (!f || (typeof f === 'string' && !f.trim())) {
        return '';
      }
      return uploadToCloudinary(f);
    })
  );
}
