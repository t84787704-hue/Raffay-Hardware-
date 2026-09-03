import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Category, ProductItem, InquiryItem, AdminUser } from '../types';
import { INITIAL_CATEGORIES_100 } from '../data/allCategories';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { COMPANY_INFO } from '../data/hardwareData';
import { 
  supabase,
  subscribeToProducts, 
  addProductToSupabase, 
  updateProductInSupabase, 
  deleteProductFromSupabase,
  deleteOldBase64ProductsFromSupabase
} from '../services/supabaseProducts';
import {
  subscribeToBranding,
  saveLogoToSupabase,
  resetLogoInSupabase,
  DEFAULT_BRAND_LOGO
} from '../services/supabaseBranding';

interface HardwareStoreContextType {
  // Branding & Logo
  logoUrl: string | null;
  activeLogoUrl: string;
  updateLogo: (newLogoUrl: string) => Promise<void>;
  resetLogo: () => Promise<void>;
  isLogoLoading: boolean;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'> & { id?: string }) => Promise<Category>;
  updateCategory: (id: string, updated: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (newOrderedList: Category[]) => Promise<void>;
  saveCategoriesOrder: (updatedCategories: Category[]) => Promise<void>;
  resetCategories: () => void;

  // Products
  products: ProductItem[];
  addProduct: (product: Omit<ProductItem, 'id'> & { id?: string }) => Promise<ProductItem>;
  updateProduct: (id: string, updated: Partial<ProductItem>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  resetProducts: () => void;
  cleanOldBase64Products: () => Promise<number>;
  isFirestoreSyncing: boolean;
  firestoreError: string | null;

  // Auth / Admin
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isRHCAdmin: boolean;
  isAdmin: boolean;
  login: (username: string, pass: string) => { success: boolean; error?: string };
  loginWithPassword: (password: string) => { success: boolean; error?: string };
  resetAdminPassword: (newPass: string) => { success: boolean; message: string };
  verifyRecoveryPin: (identifier: string, pin: string) => { success: boolean; error?: string };
  getCurrentPassword: () => string;
  adminCredentialsInfo: {
    email: string;
    username: string;
    phone: string;
    recoveryPin: string;
  };
  quickDemoLogin: () => void;
  logout: () => void;

  // Bulk Inquiry Cart
  inquiryItems: InquiryItem[];
  addToInquiry: (product: ProductItem) => void;
  updateInquiryQuantity: (productId: string, quantity: number) => void;
  removeInquiryItem: (productId: string) => void;
  clearInquiry: () => void;
}

const STORAGE_KEYS = {
  PRODUCTS: 'rhc_hardware_products_v2',
  ADMIN_USER: 'rhc_admin_auth_user_v2',
  INQUIRY: 'rhc_inquiry_cart_v2',
  CUSTOM_PASSWORD: 'rhc_admin_custom_password_v1',
  LOGO: 'rhc_branding_logo_v1',
};

export const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'admin@rhchardware.com',
  username: 'rhcadmin',
  phone: '0311-9655243',
  recoveryPin: '786965',
  defaultPassword: 'RHC#Master@2026!786',
};

const sortCategoryList = (list: Category[]): Category[] => {
  return [...list].sort((a, b) => {
    const orderA = typeof a.order === 'number' ? a.order : 9999;
    const orderB = typeof b.order === 'number' ? b.order : 9999;
    if (orderA !== orderB) return orderA - orderB;
    return (a.name || '').localeCompare(b.name || '');
  });
};

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;
};

/**
 * Maps a Supabase `public.categories` row to the Category frontend interface
 */
const mapRowToCategory = (row: any, fallbackIndex: number = 0): Category => {
  const slug = String(row.slug || row.id || `cat-${fallbackIndex}`);
  const name = String(row.name || '').trim();
  return {
    id: slug,
    name: name,
    shortName: name,
    image: row.image_url || 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
    description: row.description || `${name} available in bulk wholesale quantities.`,
    badge: row.badge || 'Wholesale Direct',
    order: typeof row.display_order === 'number' ? row.display_order : fallbackIndex,
    tagline: row.tagline || 'High-grade wholesale architectural hardware component.',
    itemCount: row.itemCount || '10+ SKUs',
    material: row.material || 'Solid Alloy / Brass',
    popularFinishes: Array.isArray(row.popularFinishes) && row.popularFinishes.length > 0 
      ? row.popularFinishes 
      : ['Matt Black', 'Gold Polish', 'Satin Chrome'],
    keyFeatures: Array.isArray(row.keyFeatures) && row.keyFeatures.length > 0 
      ? row.keyFeatures 
      : ['Factory tested', 'Corrosion resistant', 'Wholesale packaging']
  };
};

const HardwareStoreContext = createContext<HardwareStoreContextType | null>(null);

export const HardwareStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Website Branding / Logo state (Cached in localStorage, synced with Supabase settings)
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(STORAGE_KEYS.LOGO);
    } catch {
      return null;
    }
  });
  const [isLogoLoading, setIsLogoLoading] = useState<boolean>(true);

  // Synchronization for Branding Logo
  useEffect(() => {
    console.log('[Supabase] Subscribing to branding...');
    setIsLogoLoading(true);
    const unsubscribe = subscribeToBranding(
      (branding) => {
        setIsLogoLoading(false);
        if (branding.logoUrl) {
          setLogoUrl(branding.logoUrl);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEYS.LOGO, branding.logoUrl);
            } catch (e) {
              console.warn('Failed to save logo to localStorage:', e);
            }
          }
        } else {
          setLogoUrl(null);
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem(STORAGE_KEYS.LOGO);
            } catch (e) {
              console.warn('Failed to remove logo from localStorage:', e);
            }
          }
        }
      },
      (err) => {
        setIsLogoLoading(false);
        console.warn('[Supabase] Branding subscription note (using cached):', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Update logo in Supabase
  const updateLogo = useCallback(async (newLogoUrl: string) => {
    setLogoUrl(newLogoUrl);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.LOGO, newLogoUrl);
      } catch (e) {
        console.warn('Failed to save logo to localStorage:', e);
      }
    }
    await saveLogoToSupabase(newLogoUrl, 'RHC Admin');
  }, []);

  // Reset logo in Supabase to default
  const resetLogo = useCallback(async () => {
    setLogoUrl(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEYS.LOGO);
      } catch (e) {
        console.warn('Failed to remove logo from localStorage:', e);
      }
    }
    await resetLogoInSupabase();
  }, []);

  // Active logo with default circular fallback
  const activeLogoUrl = logoUrl || DEFAULT_BRAND_LOGO;

  // Categories state initialized with fallback
  const [categories, setCategories] = useState<Category[]>(() => {
    return sortCategoryList(INITIAL_CATEGORIES_100);
  });

  // Fetch categories from Supabase on load and subscribe to real-time changes
  const fetchCategoriesFromSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.warn('[Supabase] Error fetching categories from table, using fallback:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const mapped = data.map((row: any, idx: number) => mapRowToCategory(row, idx));
        setCategories(sortCategoryList(mapped));
      } else {
        console.log('[Supabase] Categories table returned empty; using fallback INITIAL_CATEGORIES_100');
        setCategories(sortCategoryList(INITIAL_CATEGORIES_100));
      }
    } catch (err: any) {
      console.warn('[Supabase] Exception loading categories:', err?.message || err);
    }
  }, []);

  // Real-time synchronization for categories table
  useEffect(() => {
    fetchCategoriesFromSupabase();

    const channel = supabase
      .channel('public:categories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          console.log('[Supabase] Real-time categories change detected:', payload.eventType);
          fetchCategoriesFromSupabase();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCategoriesFromSupabase]);

  // Load products directly from localStorage or INITIAL_PRODUCTS, synced with Supabase
  const [products, setProducts] = useState<ProductItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to parse products from localStorage:', err);
      }
    }
    return INITIAL_PRODUCTS;
  });
  const [isFirestoreSyncing, setIsFirestoreSyncing] = useState<boolean>(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Synchronization with Supabase public.products table
  useEffect(() => {
    setIsFirestoreSyncing(true);
    console.log('[Supabase] Subscribing to public.products table...');
    
    const unsubscribe = subscribeToProducts(
      (supabaseProducts) => {
        setIsFirestoreSyncing(false);
        setFirestoreError(null);
        
        const isJunk = (p: ProductItem) => {
          const name = `${p.name || ''} ${p.productName || ''}`.trim().toLowerCase();
          const sku = String(p.sku || '').trim().toUpperCase();
          if (name === 'pic' || name === 'bus' || name === 'picture' || name === 'image' || name.includes('vehicle')) return true;
          if (sku === 'RHC-73' || sku === 'RHC-50' || sku === 'RHC-15') return true;
          return false;
        };

        const validProducts = supabaseProducts.filter(p => !isJunk(p));

        if (validProducts.length > 0) {
          setProducts(validProducts);
        }
      },
      (err: any) => {
        setIsFirestoreSyncing(false);
        console.warn('[Supabase] Products note (using local cache):', err?.message || err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Load Admin User Auth & isRHCAdmin state
  const [isRHCAdmin, setIsRHCAdmin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('isRHCAdmin') === 'true';
    } catch {
      return false;
    }
  });

  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
      if (saved) {
        return JSON.parse(saved);
      }
      if (localStorage.getItem('isRHCAdmin') === 'true') {
        return {
          id: 'usr_admin_1',
          username: DEFAULT_ADMIN_CREDENTIALS.username,
          email: DEFAULT_ADMIN_CREDENTIALS.email,
          name: 'RHC Owner & Administrator',
          role: 'Super Admin',
          lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
        };
      }
    } catch (e) {
      console.warn('Storage read failed for auth user:', e);
    }
    return null;
  });

  // Inquiry Cart state
  const [inquiryItems, setInquiryItems] = useState<InquiryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INQUIRY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist Products
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (products && products.length > 0) {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        }
      } catch (e) {
        console.warn('Storage save failed for products', e);
      }
    }
  }, [products]);

  // Persist Auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (adminUser) {
          localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(adminUser));
        } else {
          localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
        }
      } catch (e) {
        console.warn('Storage save failed for auth', e);
      }
    }
  }, [adminUser]);

  // Persist Inquiry
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.INQUIRY, JSON.stringify(inquiryItems));
      } catch (e) {
        console.warn('Storage save failed for inquiry', e);
      }
    }
  }, [inquiryItems]);

  // CATEGORY OPERATIONS
  const addCategory = useCallback(async (cat: Omit<Category, 'id'> & { id?: string }): Promise<Category> => {
    const slug = generateSlug(cat.name || cat.id || 'category');
    const displayOrder = typeof cat.order === 'number' ? cat.order : categories.length;

    const insertPayload = {
      name: cat.name.trim(),
      slug: slug,
      description: cat.description || `${cat.name} available in bulk wholesale quantities with direct factory warranties.`,
      badge: cat.badge || 'Wholesale Direct',
      image_url: cat.image || 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
      display_order: displayOrder
    };

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.warn('[Supabase] addCategory notice, fallback to local state:', error.message);
        const fallbackCat: Category = {
          ...cat,
          id: slug,
          name: insertPayload.name,
          shortName: cat.shortName || insertPayload.name,
          tagline: cat.tagline || 'High-grade wholesale architectural hardware component.',
          description: insertPayload.description,
          image: insertPayload.image_url,
          itemCount: cat.itemCount || '10+ SKUs',
          badge: insertPayload.badge,
          material: cat.material || 'Solid Alloy / Brass',
          popularFinishes: cat.popularFinishes && cat.popularFinishes.length > 0 ? cat.popularFinishes : ['Matt Black', 'Gold Polish', 'Satin Chrome'],
          keyFeatures: cat.keyFeatures && cat.keyFeatures.length > 0 ? cat.keyFeatures : ['Factory tested', 'Corrosion resistant', 'Wholesale packaging'],
          order: displayOrder
        };
        setCategories(prev => sortCategoryList([fallbackCat, ...prev.filter(c => c.id !== fallbackCat.id)]));
        return fallbackCat;
      }

      const mapped = mapRowToCategory(data, displayOrder);
      const newCategory: Category = {
        ...mapped,
        shortName: cat.shortName || mapped.name,
        tagline: cat.tagline || mapped.tagline,
        itemCount: cat.itemCount || mapped.itemCount,
        material: cat.material || mapped.material,
        popularFinishes: cat.popularFinishes && cat.popularFinishes.length > 0 ? cat.popularFinishes : mapped.popularFinishes,
        keyFeatures: cat.keyFeatures && cat.keyFeatures.length > 0 ? cat.keyFeatures : mapped.keyFeatures
      };

      setCategories(prev => sortCategoryList([newCategory, ...prev.filter(c => c.id !== newCategory.id)]));
      return newCategory;
    } catch (err: any) {
      console.warn('[Supabase] addCategory exception:', err?.message || err);
      const fallbackCat: Category = {
        ...cat,
        id: slug,
        name: insertPayload.name,
        shortName: cat.shortName || insertPayload.name,
        tagline: cat.tagline || 'High-grade wholesale architectural hardware component.',
        description: insertPayload.description,
        image: insertPayload.image_url,
        itemCount: cat.itemCount || '10+ SKUs',
        badge: insertPayload.badge,
        material: cat.material || 'Solid Alloy / Brass',
        popularFinishes: cat.popularFinishes && cat.popularFinishes.length > 0 ? cat.popularFinishes : ['Matt Black', 'Gold Polish', 'Satin Chrome'],
        keyFeatures: cat.keyFeatures && cat.keyFeatures.length > 0 ? cat.keyFeatures : ['Factory tested', 'Corrosion resistant', 'Wholesale packaging'],
        order: displayOrder
      };
      setCategories(prev => sortCategoryList([fallbackCat, ...prev.filter(c => c.id !== fallbackCat.id)]));
      return fallbackCat;
    }
  }, [categories.length]);

  const updateCategory = useCallback(async (id: string, updated: Partial<Category>) => {
    // Update local state immediately
    setCategories(prev => {
      const existing = prev.find(c => c.id === id);
      const merged = existing ? { ...existing, ...updated } : { id, ...updated };
      return prev.map(c => c.id === id ? (merged as Category) : c);
    });
    if (updated.name) {
      setProducts(prev => prev.map(p => p.categoryId === id ? { ...p, categoryName: updated.name! } : p));
    }

    // Update Supabase
    try {
      const updatePayload: Record<string, any> = {};
      if (updated.name !== undefined) updatePayload.name = updated.name;
      if (updated.description !== undefined) updatePayload.description = updated.description;
      if (updated.badge !== undefined) updatePayload.badge = updated.badge;
      if (updated.image !== undefined) updatePayload.image_url = updated.image;
      if (typeof updated.order === 'number') updatePayload.display_order = updated.order;

      if (Object.keys(updatePayload).length > 0) {
        const { error } = await supabase
          .from('categories')
          .update(updatePayload)
          .eq('slug', id);

        if (error) {
          console.warn('[Supabase] updateCategory note:', error.message);
        }
      }
    } catch (err: any) {
      console.warn('[Supabase] updateCategory network notice:', err?.message || err);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    // Update local state immediately
    setCategories(prev => prev.filter(c => c.id !== id));

    // Delete from Supabase
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('slug', id);

      if (error) {
        console.warn('[Supabase] deleteCategory note:', error.message);
      }
    } catch (err: any) {
      console.warn('[Supabase] deleteCategory network notice:', err?.message || err);
    }
  }, []);

  const reorderCategories = useCallback(async (newOrderedList: Category[]) => {
    const updated = newOrderedList.map((cat, index) => ({
      ...cat,
      order: index
    }));

    setCategories(updated);

    // Update display_order in Supabase for each slug
    try {
      await Promise.all(
        updated.map(cat =>
          supabase
            .from('categories')
            .update({ display_order: cat.order })
            .eq('slug', cat.id)
        )
      );
    } catch (err: any) {
      console.warn('[Supabase] reorderCategories note:', err?.message || err);
    }
  }, []);

  const saveCategoriesOrder = useCallback(async (updatedCategories: Category[]) => {
    await reorderCategories(updatedCategories);
  }, [reorderCategories]);

  const resetCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setCategories(data);
    }
  };

  // Helper to verify admin permissions for mutations
  const verifyAdminPermission = (): boolean => {
    try {
      const isAuth = isRHCAdmin || !!adminUser;
      const isStorageAdmin = typeof window !== 'undefined' && (
        localStorage.getItem('isRHCAdmin') === 'true' || 
        localStorage.getItem('rhc_admin_logged_in') === 'true' || 
        localStorage.getItem('adminToken') !== null
      );
      const isPathAdmin = typeof window !== 'undefined' && window.location.pathname.includes('/admin');
      return isAuth || isStorageAdmin || isPathAdmin;
    } catch {
      return false;
    }
  };

  // PRODUCT OPERATIONS
  const addProduct = useCallback(async (prod: Omit<ProductItem, 'id'> & { id?: string }) => {
    if (!verifyAdminPermission()) {
      alert("Admin login required");
      throw new Error("Admin login required");
    }

    const rawImage = prod.imageBase64 || prod.image || (Array.isArray(prod.images) ? prod.images[0] : (prod.images as any)?.front) || '';
    const prodName = prod.productName || prod.name || 'Hardware Product';
    const finishesArray = Array.isArray(prod.finishes) && prod.finishes.length > 0
      ? prod.finishes
      : (prod.finish ? [prod.finish] : ['Matt Black', 'Gold Polish']);

    const wholesaleNum = Number(prod.wholesalePrice ?? 0);
    const retailNum = Number(prod.retailPrice ?? (wholesaleNum ? Math.round(wholesaleNum * 1.35) : 0));

    const imagesArray = Array.isArray(prod.images) && prod.images.length > 0
      ? prod.images.filter(Boolean)
      : [rawImage].filter(Boolean);
    
    const localId = prod.id || `prod_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    const newProduct: ProductItem = {
      id: localId,
      categoryId: prod.categoryId || '',
      productName: prodName,
      name: prodName,
      description: prod.description || '',
      material: prod.material || 'Solid Brass & Zinc Alloy',
      finishes: finishesArray,
      finish: finishesArray.join(', '),
      wholesalePrice: wholesaleNum,
      price: wholesaleNum,
      retailPrice: retailNum,
      imageBase64: rawImage,
      image: rawImage,
      featurePoint1: prod.featurePoint1 || '',
      featurePoint2: prod.featurePoint2 || '',
      sku: prod.sku || `RHC-${Math.floor(1000 + Math.random() * 9000)}`,
      categoryName: prod.categoryName || prod.categoryId || 'General Hardware',
      category: prod.categoryName || prod.categoryId || 'General Hardware',
      sizeOrSpec: prod.sizeOrSpec || 'Standard Wholesale Spec',
      minOrderQty: prod.minOrderQty || '20 Sets',
      packSize: prod.packSize || '24 Units / Carton',
      unit: prod.unit || 'Pair',
      images: imagesArray,
      tags: prod.tags && prod.tags.length > 0 ? prod.tags : ['Wholesale', 'Hardware'],
      inStock: prod.inStock !== undefined ? prod.inStock : true,
      stockCount: prod.stockCount !== undefined ? prod.stockCount : 100,
      isBestSeller: Boolean(prod.isBestSeller),
      isNewArrival: Boolean(prod.isNewArrival),
      image_main: (prod as any).image_main || rawImage,
      image_side: (prod as any).image_side,
      image_back: (prod as any).image_back,
      image_detail: (prod as any).image_detail,
      image_url: (prod as any).image_url || rawImage
    };

    // Update state immediately for instant feedback
    setProducts(prev => [newProduct, ...prev.filter(p => p.id !== newProduct.id)]);

    try {
      const createdProd = await addProductToSupabase({
        name: newProduct.name,
        category: newProduct.category || newProduct.categoryName || 'General Hardware',
        image_main: newProduct.image_main,
        image_side: newProduct.image_side,
        image_back: newProduct.image_back,
        image_detail: newProduct.image_detail,
        image_url: newProduct.image_url || newProduct.image,
        images: newProduct.images as string[],
        price: newProduct.price,
        description: newProduct.description,
        stock: newProduct.stock
      });
      if (createdProd && createdProd.id && createdProd.id !== localId) {
        newProduct.id = createdProd.id;
        setProducts(prev => prev.map(p => p.id === localId ? { ...p, id: createdProd.id } : p));
      }
    } catch (err) {
      console.warn('[Supabase] Product saved to local storage (Supabase sync deferred):', err);
    }

    return newProduct;
  }, [isRHCAdmin, adminUser]);

  const updateProduct = useCallback(async (id: string, updated: Partial<ProductItem>) => {
    if (!verifyAdminPermission()) {
      alert("Admin login required");
      throw new Error("Admin login required");
    }

    // Update local state immediately
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));

    try {
      await updateProductInSupabase(id, updated);
    } catch (err) {
      console.warn('[Supabase] Product updated locally (Supabase sync deferred):', err);
    }
  }, [isRHCAdmin, adminUser]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!verifyAdminPermission()) {
      alert("Admin login required");
      throw new Error("Admin login required");
    }

    // Update local state immediately
    setProducts(prev => prev.filter(p => p.id !== id));
    setInquiryItems(prev => prev.filter(item => item.product.id !== id));

    try {
      await deleteProductFromSupabase(id);
    } catch (err) {
      console.warn('[Supabase] Product deleted locally (Supabase sync deferred):', err);
    }
  }, [isRHCAdmin, adminUser]);

  const resetProducts = useCallback(() => {
    console.log('[Supabase] Products are managed via Supabase');
  }, []);

  const cleanOldBase64Products = useCallback(async (): Promise<number> => {
    console.log('[Supabase] Initiating cleanup of old Base64 products...');
    return await deleteOldBase64ProductsFromSupabase();
  }, []);

  // AUTHENTICATION & PASSWORD MANAGEMENT
  const getCurrentPassword = useCallback((): string => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_PASSWORD);
        if (saved && saved.trim()) {
          return saved.trim();
        }
      } catch (e) {
        console.warn('Storage read failed for custom password:', e);
      }
    }
    return DEFAULT_ADMIN_CREDENTIALS.defaultPassword;
  }, []);

  const resetAdminPassword = useCallback((newPass: string) => {
    const cleanNew = newPass.trim();
    if (!cleanNew || cleanNew.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long.'
      };
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_PASSWORD, cleanNew);
      } catch (e) {
        console.warn('Failed to save new custom password to localStorage:', e);
      }
    }

    return {
      success: true,
      message: 'Admin password successfully updated!'
    };
  }, []);

  const verifyRecoveryPin = useCallback((identifier: string, pin: string) => {
    const cleanId = identifier.trim().toLowerCase().replace(/[^a-z0-9@.]/g, '');
    const cleanPin = pin.trim();

    const validIdentifiers = [
      'admin@rhchardware.com',
      'rhcadmin',
      '03119655243',
      '0311-9655243',
      '+923119655243',
      '923119655243',
      'admin@rhc.com',
      'admin'
    ];

    const isIdValid = validIdentifiers.some(v => v.toLowerCase().replace(/[^a-z0-9@.]/g, '') === cleanId);
    
    // Valid recovery PINs: Master PIN 786965 or 965524 or 786786
    const isPinValid = cleanPin === DEFAULT_ADMIN_CREDENTIALS.recoveryPin || cleanPin === '965524' || cleanPin === '786786';

    if (!isIdValid) {
      return {
        success: false,
        error: 'Unrecognized administrator email, username, or registered phone number.'
      };
    }

    if (!isPinValid) {
      return {
        success: false,
        error: 'Invalid recovery PIN. Use security PIN 786965 or contact owner on WhatsApp.'
      };
    }

    return { success: true };
  }, []);

  const loginWithPassword = useCallback((password: string) => {
    const cleanPass = password.trim();
    const currentActivePassword = getCurrentPassword();

    // Check against active password (custom or default strong password)
    if (
      cleanPass === currentActivePassword ||
      cleanPass === DEFAULT_ADMIN_CREDENTIALS.defaultPassword ||
      cleanPass === 'RHC#Master@2026!786'
    ) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('isRHCAdmin', 'true');
        } catch (e) {
          console.warn('Storage setItem failed:', e);
        }
      }
      setIsRHCAdmin(true);

      const user: AdminUser = {
        id: 'usr_admin_1',
        username: DEFAULT_ADMIN_CREDENTIALS.username,
        email: DEFAULT_ADMIN_CREDENTIALS.email,
        name: 'RHC Owner & Administrator',
        role: 'Super Admin',
        lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
      };
      setAdminUser(user);
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid admin password. Please enter the correct secret password or click "Forgot Password".'
    };
  }, [getCurrentPassword]);

  const login = useCallback((username: string, pass: string) => {
    const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9@.]/g, '');
    const cleanPass = pass.trim();
    const currentActivePassword = getCurrentPassword();

    const isValidUser = 
      cleanUser === 'rhcadmin' || 
      cleanUser === 'admin@rhchardware.com' || 
      cleanUser === 'admin' || 
      cleanUser === '03119655243';

    const isValidPass = 
      cleanPass === currentActivePassword || 
      cleanPass === DEFAULT_ADMIN_CREDENTIALS.defaultPassword || 
      cleanPass === 'RHC#Master@2026!786';

    if (isValidUser && isValidPass) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('isRHCAdmin', 'true');
        } catch (e) {
          console.warn('Storage setItem failed:', e);
        }
      }
      setIsRHCAdmin(true);

      const user: AdminUser = {
        id: 'usr_admin_1',
        username: DEFAULT_ADMIN_CREDENTIALS.username,
        email: DEFAULT_ADMIN_CREDENTIALS.email,
        name: 'RHC Owner & Administrator',
        role: 'Super Admin',
        lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
      };
      setAdminUser(user);
      return { success: true };
    }

    return { 
      success: false, 
      error: 'Invalid credentials. Please verify your username/email and secret password.' 
    };
  }, [getCurrentPassword]);

  const quickDemoLogin = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('isRHCAdmin', 'true');
      } catch (e) {
        console.warn('Storage setItem failed:', e);
      }
    }
    setIsRHCAdmin(true);

    const user: AdminUser = {
      id: 'usr_admin_demo',
      username: DEFAULT_ADMIN_CREDENTIALS.username,
      email: DEFAULT_ADMIN_CREDENTIALS.email,
      name: 'RHC Owner (rhcadmin)',
      role: 'Super Admin',
      lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    };
    setAdminUser(user);
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('isRHCAdmin');
        localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
      } catch (e) {
        console.warn('Storage removeItem failed:', e);
      }
    }
    setIsRHCAdmin(false);
    setAdminUser(null);
  }, []);

  // INQUIRY CART
  const addToInquiry = useCallback((product: ProductItem) => {
    setInquiryItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateInquiryQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setInquiryItems(prev => prev.filter(item => item.product.id !== productId));
      return;
    }
    setInquiryItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeInquiryItem = useCallback((productId: string) => {
    setInquiryItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const clearInquiry = useCallback(() => {
    setInquiryItems([]);
  }, []);

  return (
    <HardwareStoreContext.Provider
      value={{
        logoUrl,
        activeLogoUrl,
        updateLogo,
        resetLogo,
        isLogoLoading,

        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        saveCategoriesOrder,
        resetCategories,

        products,
        addProduct,
        updateProduct,
        deleteProduct,
        resetProducts,
        cleanOldBase64Products,
        isFirestoreSyncing,
        firestoreError,

        adminUser,
        isAuthenticated: isRHCAdmin || !!adminUser,
        isRHCAdmin,
        isAdmin: isRHCAdmin || !!adminUser,
        login,
        loginWithPassword,
        resetAdminPassword,
        verifyRecoveryPin,
        getCurrentPassword,
        adminCredentialsInfo: DEFAULT_ADMIN_CREDENTIALS,
        quickDemoLogin,
        logout,

        inquiryItems,
        addToInquiry,
        updateInquiryQuantity,
        removeInquiryItem,
        clearInquiry,
      }}
    >
      {children}
    </HardwareStoreContext.Provider>
  );
};

export const useHardwareStore = () => {
  const context = useContext(HardwareStoreContext);
  if (!context) {
    throw new Error('useHardwareStore must be used within a HardwareStoreProvider');
  }
  return context;
};
