import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  getDocs,
  onSnapshot, 
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { Category } from '../types';
import { formatImageSrc, DEFAULT_CATEGORY_FALLBACK_IMAGE } from '../utils/imageUtils';

export const CATEGORIES_COLLECTION = 'categories';

/**
 * Converts a Firestore document into the application's Category interface
 */
export function mapFirestoreDocToCategory(id: string, data: any): Category {
  const rawImg = data.image || data.imageBase64 || '';
  const formattedImg = formatImageSrc(rawImg, DEFAULT_CATEGORY_FALLBACK_IMAGE);

  return {
    id,
    name: String(data.name || 'Hardware Category'),
    shortName: String(data.shortName || data.name || 'Category'),
    tagline: String(data.tagline || 'High-grade wholesale architectural hardware component.'),
    description: String(data.description || 'Wholesale hardware category directly from factory.'),
    image: formattedImg,
    itemCount: String(data.itemCount || '20+ SKUs'),
    badge: String(data.badge || 'Heavy Duty'),
    material: String(data.material || 'Solid Brass / Zinc Alloy'),
    popularFinishes: Array.isArray(data.popularFinishes) ? data.popularFinishes : ['Matt Black', 'Gold Polish', 'Antique Brass'],
    keyFeatures: Array.isArray(data.keyFeatures) ? data.keyFeatures : ['Factory tested heavy-duty mechanism', 'Corrosion resistant electroplated finish'],
    order: typeof data.order === 'number' ? data.order : undefined
  };
}

/**
 * Subscribes to the Firestore "categories" collection in real-time.
 */
export function subscribeToCategories(
  onCategoriesUpdated: (categories: Category[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const categoriesRef = collection(db, CATEGORIES_COLLECTION);
  
  return onSnapshot(
    categoriesRef,
    (snapshot) => {
      const cats: Category[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        cats.push(mapFirestoreDocToCategory(docSnap.id, data));
      });
      console.log(`[Firebase Firestore] onSnapshot synced ${cats.length} categories from "${CATEGORIES_COLLECTION}" collection in real-time.`);
      onCategoriesUpdated(cats);
    },
    (err) => {
      console.error(`[Firebase Firestore] onSnapshot error on "${CATEGORIES_COLLECTION}" collection:`, err);
      if (onError) onError(err);
    }
  );
}

/**
 * Adds a new category document to Firestore "categories" collection with Base64 image.
 */
export async function addCategoryToFirestore(
  categoryData: Omit<Category, 'id'> & { id?: string }
): Promise<string> {
  try {
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    const targetId = categoryData.id || (categoryData.name ? `cat_${categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : undefined);

    const docPayload: Record<string, any> = {
      name: String(categoryData.name || '').trim(),
      shortName: String(categoryData.shortName || categoryData.name || '').trim(),
      tagline: String(categoryData.tagline || '').trim(),
      description: String(categoryData.description || '').trim(),
      image: String(categoryData.image || '').trim(), // Compressed Base64 data URL
      itemCount: String(categoryData.itemCount || '20+ SKUs').trim(),
      badge: String(categoryData.badge || 'Heavy Duty').trim(),
      material: String(categoryData.material || 'Solid Brass / Zinc Alloy').trim(),
      popularFinishes: Array.isArray(categoryData.popularFinishes) ? categoryData.popularFinishes : ['Matt Black', 'Gold Polish'],
      keyFeatures: Array.isArray(categoryData.keyFeatures) ? categoryData.keyFeatures : ['Factory tested mechanism', 'Wholesale packaging'],
      ...(categoryData.order !== undefined ? { order: Number(categoryData.order) } : {}),
      createdAt: serverTimestamp()
    };

    console.log(`[Firebase Firestore] Adding category "${docPayload.name}" with compressed Base64 image to "categories" collection...`);
    
    if (targetId) {
      const customDocRef = doc(db, CATEGORIES_COLLECTION, targetId);
      await setDoc(customDocRef, docPayload);
      console.log('[Firebase Firestore] Category saved successfully with custom ID:', targetId);
      return targetId;
    } else {
      const docRef = await addDoc(categoriesRef, docPayload);
      console.log('[Firebase Firestore] Category added successfully with ID:', docRef.id);
      return docRef.id;
    }
  } catch (error) {
    console.error('[Firebase Firestore] Failed to add category to Firestore:', error);
    throw error;
  }
}

/**
 * Updates or creates a category document in Firestore "categories" collection.
 * Uses setDoc with merge: true so that if the document does not exist yet (e.g. baseline or custom ID),
 * it is seamlessly created without throwing 'No document to update'.
 */
export async function updateCategoryInFirestore(
  categoryId: string,
  updatedData: Partial<Category>
): Promise<void> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    const payload: Record<string, any> = {
      updatedAt: serverTimestamp()
    };

    if (updatedData.name !== undefined) payload.name = String(updatedData.name).trim();
    if (updatedData.shortName !== undefined) payload.shortName = String(updatedData.shortName).trim();
    if (updatedData.tagline !== undefined) payload.tagline = String(updatedData.tagline).trim();
    if (updatedData.description !== undefined) payload.description = String(updatedData.description).trim();
    if (updatedData.image !== undefined) payload.image = String(updatedData.image).trim();
    if (updatedData.itemCount !== undefined) payload.itemCount = String(updatedData.itemCount).trim();
    if (updatedData.badge !== undefined) payload.badge = String(updatedData.badge).trim();
    if (updatedData.material !== undefined) payload.material = String(updatedData.material).trim();
    if (updatedData.popularFinishes !== undefined) payload.popularFinishes = updatedData.popularFinishes;
    if (updatedData.keyFeatures !== undefined) payload.keyFeatures = updatedData.keyFeatures;
    if (updatedData.order !== undefined) payload.order = Number(updatedData.order);

    console.log('[Firebase Firestore] Setting/Merging category document ID:', categoryId);
    await setDoc(docRef, payload, { merge: true });
    console.log('[Firebase Firestore] Category updated/saved successfully:', categoryId);
  } catch (error) {
    console.error('[Firebase Firestore] setDoc merge failed on category ID:', categoryId, error);
    throw error;
  }
}

/**
 * Persists the reordered list of categories to Firestore.
 * Updates the 'order' field on each category document in Firestore.
 */
export async function saveCategoriesOrderToFirestore(
  orderedCategories: Category[]
): Promise<void> {
  try {
    console.log(`[Firebase Firestore] Saving new order for ${orderedCategories.length} categories...`);
    const updatePromises = orderedCategories.map((cat, index) => {
      const docRef = doc(db, CATEGORIES_COLLECTION, cat.id);
      return setDoc(
        docRef,
        {
          name: cat.name,
          shortName: cat.shortName || cat.name,
          order: index,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    });

    await Promise.allSettled(updatePromises);
    console.log('[Firebase Firestore] Categories order saved successfully.');
  } catch (error) {
    console.error('[Firebase Firestore] Failed to save categories order in Firestore:', error);
    throw error;
  }
}

/**
 * Deletes a category document from Firestore "categories" collection.
 */
export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    console.log('[Firebase Firestore] Deleting category document ID:', categoryId);
    await deleteDoc(docRef);
    console.log('[Firebase Firestore] Category deleted successfully:', categoryId);
  } catch (error) {
    console.error('[Firebase Firestore] deleteDoc failed on category ID:', categoryId, error);
    throw error;
  }
}
