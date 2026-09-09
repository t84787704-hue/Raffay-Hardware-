import React from 'react';
import { ProductModal } from './ProductModal';
import { uploadImageToSupabaseStorage } from '../../services/supabaseStorage';

/**
 * Uploads clean original product image to Supabase Storage as it is (no RHC watermark burning).
 */
export async function uploadProductImage(file: File, sku = 'RHC-PROD', slot = 'main'): Promise<string> {
  return uploadImageToSupabaseStorage(file, sku, slot);
}

export const uploadProductImageWithWatermark = uploadProductImage;
export const handleImageUpload = uploadProductImage;

// Canvas watermark burning is completely removed.
// Original file is returned as-is.
export const addWatermark = async (file: File | Blob): Promise<Blob> => file;
export const burnWatermarkIntoFile = addWatermark;

export const ProductForm = ProductModal;
export default ProductForm;
