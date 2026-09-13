import React from 'react';
import { ProductModal } from './ProductModal';
import { uploadImageToSupabaseStorage } from '../../services/supabaseStorage';
import { standardizeImageTo800x800 } from '../../utils/imageUtils';

/**
 * Standardizes uploaded product image to 800x800 white canvas with max 700x700 centered product,
 * keeping aspect ratio, and saves standardized image to Supabase Storage.
 */
export async function uploadProductImage(file: File, sku = 'RHC-PROD', slot = 'main'): Promise<string> {
  const standardizedFile = await standardizeImageTo800x800(file);
  return uploadImageToSupabaseStorage(standardizedFile, sku, slot);
}

export const uploadProductImageWithWatermark = uploadProductImage;
export const handleImageUpload = uploadProductImage;

export const addWatermark = async (file: File | Blob): Promise<Blob> => file;
export const burnWatermarkIntoFile = addWatermark;

export const ProductForm = ProductModal;
export default ProductForm;

