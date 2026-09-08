import React from 'react';
import { ProductModal } from './ProductModal';
import { uploadImageToSupabaseStorage } from '../../services/supabaseStorage';

/**
 * Burns RHC watermark into file using HTML5 Canvas:
 * - font = bold ${img.width * 0.15}px Arial
 * - fillStyle = 'white'
 * - textAlign = 'center'
 * - textBaseline = 'middle'
 * - globalAlpha = 0.25
 * - RHC at (canvas.width / 2, canvas.height / 2)
 */
export async function burnWatermarkIntoFile(originalFile: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(originalFile);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(img.src);
        resolve(originalFile);
        return;
      }
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = 0.25;
      ctx.font = `bold ${img.width * 0.13}px Arial`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('RHC', canvas.width / 2, canvas.height / 2);
      canvas.toBlob((b) => {
        URL.revokeObjectURL(img.src);
        resolve(b || originalFile);
      }, 'image/jpeg', 0.9);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(originalFile);
    };
  });
}

/**
 * Uploads a watermarked product image to Supabase Storage
 */
export async function uploadProductImageWithWatermark(file: File, sku = 'RHC-PROD', slot = 'main'): Promise<string> {
  const watermarkedBlob = await burnWatermarkIntoFile(file);
  return uploadImageToSupabaseStorage(watermarkedBlob, sku, slot);
}

export const handleImageUpload = uploadProductImageWithWatermark;

export const ProductForm = ProductModal;
export default ProductForm;
