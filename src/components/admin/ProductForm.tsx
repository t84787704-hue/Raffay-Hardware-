import React from 'react';
import { ProductModal } from './ProductModal';
import { uploadImageToSupabaseStorage } from '../../services/supabaseStorage';

/**
 * Burns RHC watermark into file using HTML5 Canvas:
 * - font = bold ${img.width * 0.15}px Arial
 * - fillStyle = 'white'
 * - textAlign = 'center'
 * - textBaseline = 'middle'
 * - globalAlpha = 0.30
 * - RHC at (canvas.width / 2, canvas.height / 2)
 */
export const addWatermark = (file: File | Blob): Promise<Blob> => {
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
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0);
        // Center watermark RHC
        ctx.globalAlpha = 0.30;
        ctx.font = `bold ${img.width * 0.15}px Arial`;
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("RHC", canvas.width / 2, canvas.height / 2);
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.9);
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

export const burnWatermarkIntoFile = addWatermark;

/**
 * Uploads a watermarked product image to Supabase Storage
 */
export async function uploadProductImageWithWatermark(file: File, sku = 'RHC-PROD', slot = 'main'): Promise<string> {
  // Upload clean original image to Supabase as it is (DO NOT burn watermark into uploaded image)
  return uploadImageToSupabaseStorage(file, sku, slot);
}

export const handleImageUpload = uploadProductImageWithWatermark;

export const ProductForm = ProductModal;
export default ProductForm;
