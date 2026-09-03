import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Category, ProductItem, InquiryItem, AdminUser } from '../types';
import { INITIAL_CATEGORIES_100 } from '../data/allCategories';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { createClient } from '@supabase/supabase-js';
import { subscribeToProducts, addProductToSupabase, updateProductInSupabase, deleteProductFromSupabase } from '../services/supabaseProducts';
import { subscribeToBranding, saveLogoToSupabase, resetLogoInSupabase, DEFAULT_BRAND_LOGO } from '../services/supabaseBranding';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STORAGE_KEYS = {
  AUTH: 'rhc_auth_v1',
  INQUIRY: 'rhc_inquiry_v1',
};

const DEFAULT_ADMIN: AdminUser = {
  username: 'admin',
  password: 'admin123',
};

const sortCategoryList = (list: Category[]): Category[] => {
  return [...list].sort((a, b) => {
    const orderA = typeof a.order === 'number'? a.order : 9999;
    const orderB = typeof b.order === 'number'? b.order : 9999;
    return orderA - orderB;
  });
};

type HardwareContextType = {
  categories: Category[];
  products: ProductItem[];
  inquiryItems: InquiryItem[];
  brandLogo: string;
  isAuthenticated: boolean;
  addCategory: (cat: any) => Promise<Category>;
  updateCategory: (id: string, updated: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (list: Category[]) => Promise<void>;
  addProduct: (p: ProductItem) => Promise<void>;
  updateProduct: (p: ProductItem) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addToInquiry: (p: ProductItem) => void;
  removeFromInquiry: (id: string) => void;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  updateLogo: (url: string) => Promise<void>;
  resetLogo: () => Promise<void>;
};

const HardwareStoreContext = createContext<HardwareContextType | null>(null);

export const HardwareStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [inquiryItems, setInquiryItems] = useState<InquiryItem[]>([]);
  const [brandLogo, setBrandLogo] = useState<string>(DEFAULT_BRAND_LOGO);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load Categories from Supabase
  useEffect(() => {
    const loadCats = async () => {
      const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped: Category[] = data.map((row: any) => ({
          id: row.slug,
          name: row.name,
          shortName: row.name,
          badge: row.badge || 'Heavy Duty',
          itemCount: '50+ SKUs',
          image: row.image_url || '',
          description: row.description || '',
          material: 'Solid Brass / Zinc Alloy',
          popularFinishes: ['Matt Black', 'Gold Polish'],
          keyFeatures: ['Factory tested', 'Corrosion resistant'],
          tagline: row.description || '',
          order: row.display_order,
        }));
        setCategories(sortCategoryList(mapped));
      } else {
        setCategories(sortCategoryList(INITIAL_CATEGORIES_100 as any));
      }
    };
    loadCats();

    const channel = supabase.channel('categories-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => loadCats()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Load Products & Branding
  useEffect(() => {
    const unsubProd = subscribeToProducts((supaProducts) => {
      if (supaProducts && supaProducts.length > 0) setProducts(supaProducts as any);
      else setProducts(INITIAL_PRODUCTS as any);
    });
    const unsubBrand = subscribeToBranding((logo) => setBrandLogo(logo || DEFAULT_BRAND_LOGO));

    if (typeof window!== 'undefined') {
      const auth = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (auth) setIsAuthenticated(true);
      constinq = localStorage.getItem(STORAGE_KEYS.INQUIRY);
      if (constinq) setInquiryItems(JSON.parse(constinq));
    }
    return () => { unsubProd(); unsubBrand(); };
  }, []);

  useEffect(() => {
    if (typeof window!== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.INQUIRY, JSON.stringify(inquiryItems));
    }
  }, [inquiryItems]);

  const addCategory = useCallback(async (cat: any) => {
    const slug = (cat.id || cat.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { data, error } = await supabase.from('categories').insert([{
      name: cat.name,
      slug: slug,
      description: cat.description || cat.name,
      badge: cat.badge || 'Heavy Duty',
      image_url: cat.image || '',
      display_order: categories.length + 1
    }]).select().single();
    if (error) throw error;
    const newCat: Category = {
      id: data.slug,
      name: data.name,
      shortName: data.name,
      badge: data.badge,
      itemCount: '50+ SKUs',
      image: data.image_url,
      description: data.description,
      material: 'Solid Brass',
      popularFinishes: [],
      keyFeatures: [],
      tagline: data.description,
      order: data.display_order,
    } as Category;
    setCategories(prev => sortCategoryList([newCat,...prev]));
    return newCat;
  }, [categories]);

  const updateCategory = useCallback(async (id: string, updated: Partial<Category>) => {
    await supabase.from('categories').update({
      name: updated.name,
      description: updated.description,
      badge: updated.badge,
      image_url: updated.image,
    }).eq('slug', id);
    setCategories(prev => prev.map(c => c.id === id? {...c,...updated } as Category : c));
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await supabase.from('categories').delete().eq('slug', id);
    setCategories(prev => prev.filter(c => c.id!== id));
  }, []);

  const reorderCategories = useCallback(async (newOrderedList: Category[]) => {
    const updated = newOrderedList.map((cat, index) => ({...cat, order: index }));
    setCategories(updated);
    for (let i = 0; i < updated.length; i++) {
      await supabase.from('categories').update({ display_order: i }).eq('slug', updated[i].id);
    }
  }, []);

  const addProduct = async (p: ProductItem) => { await addProductToSupabase(p as any); };
  const updateProduct = async (p: ProductItem) => { await updateProductInSupabase(p as any); };
  const deleteProduct = async (id: string) => { await deleteProductFromSupabase(id); };

  const addToInquiry = (p: ProductItem) => setInquiryItems(prev => [...prev, { product: p, quantity: 1 } as any]);
  const removeFromInquiry = (id: string) => setInquiryItems(prev => prev.filter(i => i.product.id!== id));

  const login = (u: string, p: string) => {
    if (u === DEFAULT_ADMIN.username && p === DEFAULT_ADMIN.password) {
      setIsAuthenticated(true);
      if (typeof window!== 'undefined') localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      return true;
    }
    return false;
  };
  const logout = () => { setIsAuthenticated(false); if (typeof window!== 'undefined') localStorage.removeItem(STORAGE_KEYS.AUTH); };

  const updateLogo = async (url: string) => { await saveLogoToSupabase(url); setBrandLogo(url); };
  const resetLogo = async () => { await resetLogoInSupabase(); setBrandLogo(DEFAULT_BRAND_LOGO); };

  return (
    <HardwareStoreContext.Provider value={{ categories, products, inquiryItems, brandLogo, isAuthenticated, addCategory, updateCategory, deleteCategory, reorderCategories, addProduct, updateProduct, deleteProduct, addToInquiry, removeFromInquiry, login, logout, updateLogo, resetLogo }}>
      {children}
    </HardwareStoreContext.Provider>
  );
};

export const useHardwareStore = () => {
  const ctx = useContext(HardwareStoreContext);
  if (!ctx) throw new Error('useHardwareStore must be used within provider');
  return ctx;
};