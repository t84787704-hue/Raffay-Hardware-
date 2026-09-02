/**
 * Cloudinary Direct Unsigned Image Upload Service
 * 
 * Uploads images directly to Cloudinary using unsigned upload presets:
 * POST https://api.cloudinary.com/v1_1/${cloudName}/image/upload
 * Body: FormData with 'file' and 'upload_preset' ONLY (No api_key, no signature)
 */

export async function uploadToCloudinary(file: File | Blob | string): Promise<string> {
  if (!file) {
    return '';
  }

  // If already an online URL (http/https), return directly
  if (typeof file === 'string' && (file.startsWith('http://') || file.startsWith('https://'))) {
    return file.trim();
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() || '';
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim() || '';

  // If environment variables are not set, fallback to local Base64
  if (!cloudName || !preset) {
    console.warn(
      '[Cloudinary] Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET.'
    );

    if (typeof file === 'string') {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.secure_url) {
      let errorMessage = data?.error?.message || `HTTP ${response.status}`;
      
      // Provide clear guidance if Cloudinary says "Unknown API key" (happens when preset is set to Signed instead of Unsigned in Cloudinary console)
      if (errorMessage.toLowerCase().includes('unknown api key') || errorMessage.toLowerCase().includes('api key')) {
        errorMessage = `${errorMessage} - In Cloudinary Settings > Upload, make sure your upload preset "${preset}" Signing Mode is set to "Unsigned".`;
      }

      console.error('[Cloudinary Upload Error]', errorMessage, data);
      throw new Error(`Cloudinary Error: ${errorMessage}`);
    }

    return data.secure_url as string;
  } catch (error: any) {
    console.error('[Cloudinary] Upload failed:', error);

    // If input is already a string (Base64 data URL), return it as safe fallback
    if (typeof file === 'string') {
      return file;
    }

    throw error;
  }
}

/**
 * Uploads an array of image files/strings in parallel
 */
export async function uploadMultipleToCloudinary(
  files: (File | Blob | string)[]
): Promise<string[]> {
  return Promise.all(
    files.map(async (f) => {
      if (!f || (typeof f === 'string' && !f.trim())) return '';
      return uploadToCloudinary(f);
    })
  );
}
