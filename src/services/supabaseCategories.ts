import { supabase } from '../lib/supabase';
import { Category } from '../types';
import { formatImageSrc, DEFAULT_CATEGORY_FALLBACK_IMAGE } from '../utils/imageUtils';

/**
 * Maps a Supabase row or data object to Category
 */
export function mapRowToCategory(data: any): Category {
  const rawImg = data.image || data.imageBase64 || '';
  const formattedImg = formatImageSrc(rawImg, DEFAULT_CATEGORY_FALLBACK_IMAGE);

  return {
    id: String(data.id || `cat_${Date.now()}`),
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
 * Saves category list to local cache
 */
export function saveCategoriesToLocal(cats: Category[]): void {
  try {
    localStorage.setItem('rhc_categories_v2', JSON.stringify(cats));
  } catch (e) {
    console.warn('Failed to save categories to localStorage:', e);
  }
}
