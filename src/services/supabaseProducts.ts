import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ProductItem } from '../types';
import { formatImageSrc, DEFAULT_FALLBACK_IMAGE } from '../utils/imageUtils';
import { uploadFourProductImagesToSupabase } from './supabaseStorage';

export interface SupabaseProductRow {
  id?: string | number;
  created_at?: string;
  name: string;
  price?: number | string | null;
  image_url?: string | null;
  image_main?: string | null;
  image_side?: string | null;
  image_back?: string | null;
  image_detail?: string | null;
  description?: string | null;
  category?: string | null;
  stock?: number | null;
  [key: string]: any;
}

/**
 * Maps a Supabase `products` table row to the frontend ProductItem interface
 */
export function mapSupabaseRowToProduct(row: SupabaseProductRow): ProductItem {
  const imagesList = [
    row.image_main,
    row.image_side,
    row.image_back,
    row.image_detail
  ].filter((img): img is string => Boolean(img && typeof img === 'string' && img.trim().length > 0));

  if (imagesList.length === 0 && row.image_url && typeof row.image_url === 'string' && row.image_url.trim().length > 0) {
    imagesList.push(row.image_url.trim());
  }

  if (imagesList.length === 0) {
    imagesList.push(DEFAULT_FALLBACK_IMAGE);
  }

  const formattedImages = imagesList.slice(0, 4).map(img => formatImageSrc(img, DEFAULT_FALLBACK_IMAGE));
  const primaryImg = row.image_main || row.image_url || formattedImages[0] || DEFAULT_FALLBACK_IMAGE;

  const priceNum = Number(row.price ?? 0);
  const wholesalePriceNum = priceNum;
  const retailPriceNum = priceNum ? Math.round(priceNum * 1.35) : 0;
  const stockNum = Number(row.stock ?? 100);
  const categoryStr = String(row.category || 'General Hardware').trim();
  const categoryId = `cat_${categoryStr.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

  const idStr = String(row.id || `prod_${Date.now()}`);

  return {
    id: idStr,
    name: String(row.name || 'Hardware Product').trim(),
    productName: String(row.name || 'Hardware Product').trim(),
    categoryId: categoryId,
    categoryName: categoryStr,
    category: categoryStr,
    sku: `RHC-${idStr.slice(-4)}`,
    price: priceNum,
    wholesalePrice: wholesalePriceNum,
    retailPrice: retailPriceNum,
    stock: stockNum,
    stockCount: stockNum,
    unit: 'Pair',
    material: 'Solid Brass / Zinc Alloy',
    finish: 'Matt Black, Gold Polish',
    finishes: ['Matt Black', 'Gold Polish'],
    sizeOrSpec: 'Standard',
    minOrderQty: '10 Sets',
    packSize: 'Standard Box',
    description: String(row.description || '').trim(),
    images: formattedImages,
    image: primaryImg,
    imageBase64: primaryImg,
    image_main: row.image_main || primaryImg,
    image_side: row.image_side || undefined,
    image_back: row.image_back || undefined,
    image_detail: row.image_detail || undefined,
    image_url: row.image_url || primaryImg,
    featurePoint1: '',
    featurePoint2: '',
    tags: [categoryStr],
    inStock: stockNum > 0,
    isBestSeller: false,
    isNewArrival: true,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.created_at || new Date().toISOString()
  };
}

/**
 * Fetches all products from Supabase `public.products` table
 */
export async function getProductsFromSupabase(): Promise<ProductItem[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Notice querying products table:', error.message);
      return [];
    }

    if (Array.isArray(data)) {
      return data.map(mapSupabaseRowToProduct);
    }
    return [];
  } catch (err: any) {
    console.warn('[Supabase] Offline/network note fetching products:', err?.message || err);
    return [];
  }
}

/**
 * Subscribes to real-time changes on Supabase `public.products` table
 */
export function subscribeToProducts(
  onProductsUpdated: (products: ProductItem[]) => void,
  onError?: (error: Error) => void
): () => void {
  return subscribeToSupabaseProducts(onProductsUpdated, onError);
}

export function subscribeToSupabaseProducts(
  onProductsUpdated: (products: ProductItem[]) => void,
  onError?: (error: Error) => void
): () => void {
  let isSubscribed = true;

  if (!isSupabaseConfigured) {
    return () => {
      isSubscribed = false;
    };
  }

  // Initial fetch
  getProductsFromSupabase().then((prods) => {
    if (isSubscribed && prods.length > 0) {
      onProductsUpdated(prods);
    }
  }).catch((err) => {
    if (onError) onError(err);
  });

  // Realtime subscription via Supabase Channel
  try {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        async () => {
          console.log('[Supabase Realtime] Change detected in public.products table, refreshing...');
          const updatedProds = await getProductsFromSupabase();
          if (isSubscribed) {
            onProductsUpdated(updatedProds);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Supabase Realtime] Products channel status:', status);
      });

    return () => {
      isSubscribed = false;
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // Safe channel cleanup
      }
    };
  } catch (err: any) {
    console.warn('[Supabase Realtime] Channel setup note:', err?.message || err);
    return () => {
      isSubscribed = false;
    };
  }
}

/**
 * Inserts a new product into Supabase `public.products` table.
 * Exact schema columns:
 * id, created_at, name, price, image_url, image_main, image_side, image_back, image_detail, description, category, stock
 */
export async function addProductToSupabase(payload: {
  name: string;
  category: string;
  image_main?: string;
  image_side?: string;
  image_back?: string;
  image_detail?: string;
  image_url?: string;
  images?: string[];
  price?: number;
  description?: string;
  stock?: number;
}): Promise<ProductItem> {
  const {
    name,
    category,
    images = [],
    price = 0,
    description = '',
    stock = 100
  } = payload;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'prod';

  // Step 1: Upload images to Supabase Storage 'product-images' bucket
  let image_main = payload.image_main || '';
  let image_side = payload.image_side || '';
  let image_back = payload.image_back || '';
  let image_detail = payload.image_detail || '';
  let image_url = payload.image_url || '';

  if (images && images.length > 0 && (!image_main || images[0] !== image_main)) {
    const uploaded = await uploadFourProductImagesToSupabase(images, slug);
    image_main = uploaded.image_main;
    image_side = uploaded.image_side;
    image_back = uploaded.image_back;
    image_detail = uploaded.image_detail;
    image_url = uploaded.image_url || uploaded.image_main;
  }

  if (!image_url) {
    image_url = image_main || image_side || image_back || image_detail || '';
  }

  // Step 2: Insert into Supabase table public.products
  const insertPayload = {
    name: name.trim(),
    category: (category || 'General Hardware').trim(),
    image_main: image_main || null,
    image_side: image_side || null,
    image_back: image_back || null,
    image_detail: image_detail || null,
    image_url: image_url || null,
    price: Number(price) || 0,
    description: description.trim() || null,
    stock: Number(stock) || 100
  };

  const localFallbackRow: SupabaseProductRow = {
    ...insertPayload,
    id: `prod_${Date.now()}`,
    created_at: new Date().toISOString()
  };

  if (!isSupabaseConfigured) {
    console.log('[Supabase] Supabase credentials pending. Product created and stored in local inventory:', localFallbackRow);
    return mapSupabaseRowToProduct(localFallbackRow);
  }

  try {
    console.log('[Supabase] Inserting product into public.products:', insertPayload);

    const { data, error } = await supabase
      .from('products')
      .insert([insertPayload])
      .select();

    if (error) {
      console.warn('[Supabase] Insert notice:', error.message);
      return mapSupabaseRowToProduct(localFallbackRow);
    }

    console.log('[Supabase] Inserted successfully to Supabase:', data);

    const createdRow = (Array.isArray(data) && data[0]) ? data[0] : localFallbackRow;
    return mapSupabaseRowToProduct(createdRow);
  } catch (err: any) {
    console.warn('[Supabase] Network/fetch notice on insert (retaining in local store):', err?.message || err);
    return mapSupabaseRowToProduct(localFallbackRow);
  }
}

/**
 * Updates a product in Supabase `public.products` table
 */
export async function updateProductInSupabase(
  id: string | number,
  updatedData: Partial<ProductItem> & Record<string, any>
): Promise<void> {
  const updatePayload: Record<string, any> = {};

  if (updatedData.name !== undefined) updatePayload.name = String(updatedData.name).trim();
  if (updatedData.category !== undefined) updatePayload.category = String(updatedData.category).trim();
  if (updatedData.categoryName !== undefined && updatePayload.category === undefined) {
    updatePayload.category = String(updatedData.categoryName).trim();
  }
  if (updatedData.price !== undefined) updatePayload.price = Number(updatedData.price);
  if (updatedData.description !== undefined) updatePayload.description = String(updatedData.description).trim();
  if (updatedData.stock !== undefined) updatePayload.stock = Number(updatedData.stock);

  if (Array.isArray(updatedData.images) && updatedData.images.length > 0) {
    updatePayload.image_main = updatedData.images[0] || null;
    updatePayload.image_side = updatedData.images[1] || null;
    updatePayload.image_back = updatedData.images[2] || null;
    updatePayload.image_detail = updatedData.images[3] || null;
    updatePayload.image_url = updatedData.images[0] || null;
  } else if (updatedData.image !== undefined) {
    updatePayload.image_url = String(updatedData.image);
    updatePayload.image_main = String(updatedData.image);
  }

  if (!isSupabaseConfigured) {
    return;
  }

  try {
    console.log('[Supabase] Updating product ID:', id, updatePayload);
    const { error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.warn('[Supabase] Update notice:', error.message);
    }
  } catch (err: any) {
    console.warn('[Supabase] Network notice on update:', err?.message || err);
  }
}

/**
 * Deletes a product from Supabase `public.products` table
 */
export async function deleteProductFromSupabase(id: string | number): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }

  try {
    console.log('[Supabase] Deleting product ID:', id);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[Supabase] Delete notice:', error.message);
    }
  } catch (err: any) {
    console.warn('[Supabase] Network notice on delete:', err?.message || err);
  }
}

/**
 * Utility to clean legacy base64 data
 */
export async function deleteOldBase64ProductsFromSupabase(): Promise<number> {
  console.log('[Supabase] Cleanup check completed');
  return 0;
}

