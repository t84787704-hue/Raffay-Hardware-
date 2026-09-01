import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  onSnapshot, 
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { ProductItem } from '../types';
import { formatImageSrc, DEFAULT_FALLBACK_IMAGE } from '../utils/imageUtils';

export const PRODUCTS_COLLECTION = 'products';

/**
 * Converts a Firestore document into the application's ProductItem interface
 */
export function mapFirestoreDocToProduct(id: string, data: any): ProductItem {
  // Extract images array with backward compatibility
  let imagesList: string[] = [];

  if (Array.isArray(data.images)) {
    imagesList = data.images.filter((url: any) => typeof url === 'string' && url.trim().length > 0);
  } else if (data.images && typeof data.images === 'object') {
    const objImgs = [data.images.front, data.images.side, data.images.installed, data.images.back, data.images.detail]
      .filter((url: any) => typeof url === 'string' && url.trim().length > 0);
    imagesList = objImgs;
  }

  // Fallback to legacy single image field if images array was empty
  if (imagesList.length === 0) {
    const singleImg = data.image || data.imageBase64;
    if (singleImg && typeof singleImg === 'string' && singleImg.trim().length > 0) {
      imagesList = [singleImg.trim()];
    }
  }

  // If still empty, use default placeholder
  if (imagesList.length === 0) {
    imagesList = [DEFAULT_FALLBACK_IMAGE];
  }

  // Format all images
  const formattedImages = imagesList.slice(0, 4).map(img => formatImageSrc(img, DEFAULT_FALLBACK_IMAGE));
  const primaryImg = formattedImages[0] || DEFAULT_FALLBACK_IMAGE;

  const priceVal = Number(data.price ?? data.wholesalePrice ?? 0);
  const wholesaleVal = Number(data.wholesalePrice ?? data.price ?? priceVal);
  const retailVal = Number(data.retailPrice ?? (wholesaleVal ? Math.round(wholesaleVal * 1.35) : 0));
  const pName = String(data.name || data.productName || 'Untitled Product');
  const catId = String(data.categoryId || (data.category ? `cat_${data.category.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : ''));
  const catName = String(data.categoryName || data.category || (catId ? catId.toUpperCase() : 'General Hardware'));
  const catExact = String(data.category || data.categoryName || catName);
  const stockNum = Number(data.stock ?? data.stockCount ?? 100);

  const finishesArray: string[] = Array.isArray(data.finishes) && data.finishes.length > 0 
    ? data.finishes 
    : (data.finish ? [data.finish] : ['Matt Black', 'Gold Polish']);

  return {
    id,
    name: pName,
    productName: pName,
    categoryId: catId,
    categoryName: catName,
    category: catExact,
    sku: String(data.sku || `RHC-${Math.floor(100 + Math.random() * 900)}`),
    price: priceVal || wholesaleVal,
    wholesalePrice: wholesaleVal,
    retailPrice: retailVal,
    stock: stockNum,
    stockCount: stockNum,
    unit: String(data.unit || 'Pair'),
    material: String(data.material || 'Solid Brass / Zinc Alloy'),
    finish: finishesArray.join(', '),
    finishes: finishesArray,
    sizeOrSpec: String(data.sizeOrSpec || 'Standard'),
    minOrderQty: String(data.minOrderQty || '10 Sets'),
    packSize: String(data.packSize || 'Standard Box'),
    description: String(data.description || ''),
    images: formattedImages, // 4-image array
    image: primaryImg, // backward compatibility
    imageBase64: primaryImg,
    featurePoint1: String(data.featurePoint1 || ''),
    featurePoint2: String(data.featurePoint2 || ''),
    tags: Array.isArray(data.tags) ? data.tags : [catName],
    inStock: data.inStock !== false && stockNum > 0,
    isBestSeller: Boolean(data.isBestSeller),
    isNewArrival: Boolean(data.isNewArrival),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
}

/**
 * Subscribes to the Firestore "products" collection in real-time.
 * Uses onSnapshot(collection(db, "products"))
 */
export function subscribeToProducts(
  onProductsUpdated: (products: ProductItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  
  return onSnapshot(
    productsRef,
    (snapshot) => {
      const prods: ProductItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        prods.push(mapFirestoreDocToProduct(docSnap.id, data));
      });
      console.log(`[Firebase Firestore] onSnapshot synced ${prods.length} products from "${PRODUCTS_COLLECTION}" collection in real-time.`);
      onProductsUpdated(prods);
    },
    (err) => {
      console.error('[Firebase Firestore] onSnapshot error on "products" collection:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Adds a new product document to Firestore "products" collection with Base64 compressed image (<150KB)
 * and all required category-linked fields.
 */
export async function addProductToFirestore(
  productData: {
    categoryId: string;
    productName?: string;
    name?: string;
    description?: string;
    material?: string;
    finishes?: string[];
    finish?: string;
    wholesalePrice?: number;
    price?: number;
    retailPrice?: number;
    images?: string[] | any;
    image?: string;
    imageBase64?: string;
    featurePoint1?: string;
    featurePoint2?: string;
    sku?: string;
    categoryName?: string;
    category?: string;
    sizeOrSpec?: string;
    minOrderQty?: string;
    packSize?: string;
    unit?: string;
    stock?: number;
    stockCount?: number;
    tags?: string[];
    inStock?: boolean;
    isBestSeller?: boolean;
    isNewArrival?: boolean;
  }
): Promise<string> {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    
    // Process images array (up to 4 images)
    let imagesArray: string[] = [];
    if (Array.isArray(productData.images)) {
      imagesArray = productData.images.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
    } else if (productData.images && typeof productData.images === 'object') {
      imagesArray = [productData.images.front, productData.images.side, productData.images.installed, productData.images.back, productData.images.detail]
        .filter((img: any) => typeof img === 'string' && img.trim().length > 0);
    }

    if (imagesArray.length === 0) {
      const fallbackSingle = productData.image || productData.imageBase64;
      if (fallbackSingle && typeof fallbackSingle === 'string' && fallbackSingle.trim().length > 0) {
        imagesArray = [fallbackSingle.trim()];
      }
    }

    if (imagesArray.length === 0) {
      imagesArray = [DEFAULT_FALLBACK_IMAGE];
    }

    // Limit to 4 images max
    imagesArray = imagesArray.slice(0, 4);
    const primaryImage = imagesArray[0];

    const finalProductName = String(productData.name || productData.productName || 'Hardware Product').trim();
    const finishesArray = Array.isArray(productData.finishes) && productData.finishes.length > 0
      ? productData.finishes
      : (productData.finish ? [productData.finish] : ['Matt Black', 'Gold Polish']);

    const wholesalePriceNum = Number(productData.wholesalePrice ?? productData.price ?? 0);
    const priceNum = Number(productData.price ?? productData.wholesalePrice ?? wholesalePriceNum);
    const retailPriceNum = Number(productData.retailPrice ?? (wholesalePriceNum ? Math.round(wholesalePriceNum * 1.35) : 0));
    const stockNum = Number(productData.stock ?? productData.stockCount ?? 100);

    // Required Top-level Firestore "products" collection schema:
    // name, sku, categoryId, categoryName, price, wholesalePrice, images: string[], description, stock
    const docPayload: Record<string, any> = {
      name: finalProductName,
      productName: finalProductName, // dual mapping
      sku: String(productData.sku || `RHC-${Math.floor(100 + Math.random() * 900)}`).trim(),
      categoryId: String(productData.categoryId || '').trim(),
      categoryName: String(productData.categoryName || productData.category || productData.categoryId || 'General Hardware').trim(),
      category: String(productData.categoryName || productData.category || productData.categoryId || 'General Hardware').trim(),
      price: priceNum,
      wholesalePrice: wholesalePriceNum,
      retailPrice: retailPriceNum,
      images: imagesArray, // Array of 4 image URLs
      image: primaryImage, // Dual mapping for backward compatibility
      imageBase64: primaryImage,
      description: String(productData.description || '').trim(),
      stock: stockNum,
      stockCount: stockNum,
      material: String(productData.material || 'Solid Brass / Zinc Alloy').trim(),
      finishes: finishesArray,
      finish: finishesArray.join(', '),
      featurePoint1: String(productData.featurePoint1 || '').trim(),
      featurePoint2: String(productData.featurePoint2 || '').trim(),
      sizeOrSpec: String(productData.sizeOrSpec || 'Standard'),
      minOrderQty: String(productData.minOrderQty || '10 Sets'),
      packSize: String(productData.packSize || 'Standard Box'),
      unit: String(productData.unit || 'Pair'),
      inStock: Boolean(productData.inStock !== false && stockNum > 0),
      isBestSeller: Boolean(productData.isBestSeller),
      isNewArrival: Boolean(productData.isNewArrival),
      tags: Array.isArray(productData.tags) ? productData.tags : [String(productData.categoryId || 'Hardware')],
      createdAt: serverTimestamp()
    };

    console.log(`[Firebase Firestore] Adding product "${docPayload.name}" (SKU: ${docPayload.sku}) with ${imagesArray.length} images for category "${docPayload.categoryId}"...`);
    const docRef = await addDoc(productsRef, docPayload);
    console.log('[Firebase Firestore] Product added successfully with doc ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('[Firebase Firestore] addDoc failed for product in "products" collection:', error);
    throw error;
  }
}

/**
 * Updates an existing product in Firestore "products" collection.
 */
export async function updateProductInFirestore(
  productId: string,
  updatedData: Partial<ProductItem> & Record<string, any>
): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const payload: Record<string, any> = {
      updatedAt: serverTimestamp()
    };

    if (updatedData.name !== undefined || updatedData.productName !== undefined) {
      const pName = String(updatedData.name || updatedData.productName).trim();
      payload.name = pName;
      payload.productName = pName;
    }

    if (updatedData.categoryId !== undefined) payload.categoryId = String(updatedData.categoryId).trim();
    if (updatedData.description !== undefined) payload.description = String(updatedData.description).trim();
    if (updatedData.material !== undefined) payload.material = String(updatedData.material).trim();
    
    if (updatedData.finishes !== undefined) {
      payload.finishes = Array.isArray(updatedData.finishes) ? updatedData.finishes : [updatedData.finishes];
      payload.finish = payload.finishes.join(', ');
    } else if (updatedData.finish !== undefined) {
      payload.finish = String(updatedData.finish).trim();
      payload.finishes = [payload.finish];
    }

    if (updatedData.price !== undefined || updatedData.wholesalePrice !== undefined) {
      const p = Number(updatedData.price ?? updatedData.wholesalePrice ?? 0);
      const w = Number(updatedData.wholesalePrice ?? updatedData.price ?? p);
      payload.price = p;
      payload.wholesalePrice = w;
    }

    if (updatedData.retailPrice !== undefined) {
      payload.retailPrice = Number(updatedData.retailPrice);
    }

    if (updatedData.stock !== undefined || updatedData.stockCount !== undefined) {
      const st = Number(updatedData.stock ?? updatedData.stockCount ?? 100);
      payload.stock = st;
      payload.stockCount = st;
    }

    if (updatedData.images !== undefined) {
      let imgs: string[] = [];
      if (Array.isArray(updatedData.images)) {
        imgs = updatedData.images.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
      } else if (typeof updatedData.images === 'object' && updatedData.images !== null) {
        imgs = [updatedData.images.front, updatedData.images.side, updatedData.images.installed, updatedData.images.back, updatedData.images.detail]
          .filter((img: any) => typeof img === 'string' && img.trim().length > 0);
      }
      if (imgs.length > 0) {
        payload.images = imgs.slice(0, 4);
        payload.image = imgs[0];
        payload.imageBase64 = imgs[0];
      }
    } else if (updatedData.image !== undefined || updatedData.imageBase64 !== undefined) {
      const img = String(updatedData.image || updatedData.imageBase64).trim();
      if (img) {
        payload.images = [img];
        payload.image = img;
        payload.imageBase64 = img;
      }
    }

    if (updatedData.featurePoint1 !== undefined) payload.featurePoint1 = String(updatedData.featurePoint1).trim();
    if (updatedData.featurePoint2 !== undefined) payload.featurePoint2 = String(updatedData.featurePoint2).trim();

    if (updatedData.categoryName !== undefined) {
      const cName = String(updatedData.categoryName).trim();
      payload.categoryName = cName;
      payload.category = cName;
    }
    if (updatedData.category !== undefined) {
      const cName = String(updatedData.category).trim();
      payload.category = cName;
      if (updatedData.categoryName === undefined) {
        payload.categoryName = cName;
      }
    }
    if (updatedData.sku !== undefined) payload.sku = String(updatedData.sku).trim();
    if (updatedData.sizeOrSpec !== undefined) payload.sizeOrSpec = String(updatedData.sizeOrSpec);
    if (updatedData.minOrderQty !== undefined) payload.minOrderQty = String(updatedData.minOrderQty);
    if (updatedData.packSize !== undefined) payload.packSize = String(updatedData.packSize);
    if (updatedData.unit !== undefined) payload.unit = String(updatedData.unit);
    if (updatedData.inStock !== undefined) payload.inStock = Boolean(updatedData.inStock);
    if (updatedData.isBestSeller !== undefined) payload.isBestSeller = Boolean(updatedData.isBestSeller);
    if (updatedData.isNewArrival !== undefined) payload.isNewArrival = Boolean(updatedData.isNewArrival);
    if (updatedData.tags !== undefined) payload.tags = Array.isArray(updatedData.tags) ? updatedData.tags : [];

    console.log('[Firebase Firestore] Setting/Merging product document ID:', productId);
    await setDoc(docRef, payload, { merge: true });
    console.log('[Firebase Firestore] Product updated successfully:', productId);
  } catch (error) {
    console.error('[Firebase Firestore] setDoc merge failed on product ID:', productId, error);
    throw error;
  }
}

/**
 * Deletes a product from Firestore "products" collection.
 */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    console.log('[Firebase Firestore] Deleting product document ID:', productId);
    await deleteDoc(docRef);
    console.log('[Firebase Firestore] Product deleted successfully:', productId);
  } catch (error) {
    console.error('[Firebase Firestore] deleteDoc failed on product ID:', productId, error);
    throw error;
  }
}

/**
 * Cleans up and deletes old Base64 products and junk test entries from Firestore.
 */
export async function deleteOldBase64ProductsFromFirestore(): Promise<number> {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(productsRef);
    let deletedCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const name = String(data.name || data.productName || '').trim().toLowerCase();
      const sku = String(data.sku || '').trim().toUpperCase();
      const img = String(data.image || data.images?.front || data.imageBase64 || '');

      const isJunkName = (
        name === 'pic' || 
        name === 'bus' || 
        name === 'picture' || 
        name === 'image' ||
        name === 'test' ||
        name.includes('my shop') || 
        name.includes('myshop') ||
        name.includes('vehicle') ||
        name.includes('screenshot')
      );

      const isJunkSku = (
        sku === 'RHC-73' || 
        sku === 'RHC-50' || 
        sku === 'RHC-15' ||
        sku.startsWith('RHC-73') ||
        sku.startsWith('RHC-50') ||
        sku.startsWith('RHC-15')
      );

      const isOversizedBase64 = (
        (img.startsWith('data:image') && img.length > 80000) ||
        (typeof data.images?.front === 'string' && data.images.front.startsWith('data:image/') && data.images.front.length > 80000) ||
        img.length > 100 * 1024
      );

      if (isJunkName || isJunkSku || isOversizedBase64) {
        console.log(`[Firestore Cleanup] Deleting junk/oversized product doc: ${docSnap.id} (${data.name}, SKU: ${data.sku})`);
        await deleteDoc(doc(db, PRODUCTS_COLLECTION, docSnap.id));
        deletedCount++;
      }
    }

    console.log(`[Firestore Cleanup] Finished cleaning up ${deletedCount} junk & old Base64 products.`);
    return deletedCount;
  } catch (err) {
    console.error('[Firestore Cleanup] Error deleting old Base64 products:', err);
    throw err;
  }
}
