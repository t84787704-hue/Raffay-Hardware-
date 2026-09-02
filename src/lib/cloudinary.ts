const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadToCloudinary(file: File | Blob | string): Promise<string> {
  if (!file) return '';

  // If already a hosted URL, return as-is
  if (typeof file === 'string' && (file.startsWith('http://') || file.startsWith('https://'))) {
    return file.trim();
  }

  if (!CLOUD_NAME || !PRESET) {
    throw new Error('Cloudinary env missing');
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', PRESET);

  const res = await fetch(url, { method: 'POST', body: fd });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || 'Upload failed');
  }

  return data.secure_url;
}

export const uploadMultipleToCloudinary = (files: (File | Blob | string)[]) =>
  Promise.all(files.map(uploadToCloudinary));
