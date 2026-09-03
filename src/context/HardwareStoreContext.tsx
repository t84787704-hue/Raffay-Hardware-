import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Category, ProductItem, InquiryItem, AdminUser } from '../types';
import { INITIAL_CATEGORIES_100 } from '../data/allCategories';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { createClient } from '@supabase/supabase-js';
import { subscribeToProducts, addProductToSupabase, updateProductInSupabase, deleteProductFromSupabase, deleteOldBase64ProductsFromSupabase } from '../services/supabaseProducts';
import { subscribeToBranding, saveLogoToSupabase, resetLogoInSupabase, DEFAULT_BRAND_LOGO } from '../services/supabaseBranding';

// SUPABASE CLIENT FOR CATEGORIES
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

//... aap ka baki ka same code upar wala rehne do, sirf neeche wale 4 functions change karo...

  // CATEGORY OPERATIONS - NOW CONNECTED TO SUPABASE
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

    if (error) { alert("Supabase Error: " + error.message); throw error; }

    const newCategory: Category = {
     ...cat,
      id: data.slug,
      name: data.name,
      shortName: data.name,
      image: data.image_url,
      description: data.description,
      badge: data.badge,
      order: data.display_order
    };
    setCategories(prev => [newCategory,...prev]);
    return newCategory;
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