import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Store, 
  LogOut, 
  Sparkles, 
  DollarSign, 
  ShieldCheck, 
  TrendingUp, 
  Filter, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Settings,
  Grid,
  List,
  ChevronRight,
  Boxes,
  Maximize2,
  Image as ImageIcon
} from 'lucide-react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { Category, ProductItem } from '../../types';
import { CategoryModal } from './CategoryModal';
import { ProductModal } from './ProductModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { Product3ImagesGalleryModal } from '../Product3ImagesGalleryModal';
import { LogoBrandingSettingsCard } from './LogoBrandingSettingsCard';
import { COMPANY_INFO } from '../../data/hardwareData';
import { 
  formatImageSrc, 
  handleImageError, 
  doesProductMatchCategory, 
  DEFAULT_CATEGORY_FALLBACK_IMAGE, 
  DEFAULT_FALLBACK_IMAGE 
} from '../../utils/imageUtils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { SortableCategoryRow } from './SortableCategoryRow';

interface AdminDashboardProps {
  onBackToStore: () => void;
}

export function AdminDashboard({ onBackToStore }: AdminDashboardProps) {
  const { 
    categories, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    reorderCategories,
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    resetProducts,
    cleanOldBase64Products,
    isFirestoreSyncing,
    firestoreError,
    adminUser, 
    logout
  } = useHardwareStore();

  // Active navigation tab in Admin
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'products' | 'grid' | 'branding'>('overview');

  // Base64 Cleanup state
  const [isCleaningBase64, setIsCleaningBase64] = useState(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);

  // Drag & drop status message
  const [reorderSuccessMessage, setReorderSuccessMessage] = useState<string | null>(null);

  // Category Manager State
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const activeCategory = categories[oldIndex];
      const newCategoriesList = arrayMove(categories, oldIndex, newIndex);
      await reorderCategories(newCategoriesList);
      
      setReorderSuccessMessage(`Display order updated for "${activeCategory.name}". Auto-saved.`);
      setTimeout(() => setReorderSuccessMessage(null), 3000);
    }
  };

  const handleMoveCategoryStep = async (currentIndexInFullList: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndexInFullList - 1 : currentIndexInFullList + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const categoryItem = categories[currentIndexInFullList];
    const newCategoriesList = arrayMove(categories, currentIndexInFullList, targetIndex);
    await reorderCategories(newCategoriesList);

    setReorderSuccessMessage(`Moved "${categoryItem.name}" ${direction}. Auto-saved.`);
    setTimeout(() => setReorderSuccessMessage(null), 3000);
  };

  // Product Manager State
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // 3-Images Gallery Modal state
  const [galleryProduct, setGalleryProduct] = useState<ProductItem | null>(null);

  // View style
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Metrics
  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.wholesalePrice * (p.stockCount || 10)), 0);
  }, [products]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      const q = categorySearch.toLowerCase().trim();
      const matchesQuery = !q || 
        c.name.toLowerCase().includes(q) || 
        c.shortName.toLowerCase().includes(q) || 
        c.material.toLowerCase().includes(q) || 
        (c.popularFinishes || []).some(f => f.toLowerCase().includes(q));
      return matchesQuery;
    });
  }, [categories, categorySearch]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = productCategoryFilter === 'all' || doesProductMatchCategory(p, productCategoryFilter);
      const q = productSearch.toLowerCase().trim();
      const matchesQuery = !q || 
        (p.productName || p.name || '').toLowerCase().includes(q) || 
        (p.sku || '').toLowerCase().includes(q) || 
        (p.categoryName || '').toLowerCase().includes(q) || 
        (p.material || '').toLowerCase().includes(q) || 
        (p.finish || '').toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [products, productCategoryFilter, productSearch]);

  // Category CRUD Handlers
  const handleSaveCategory = async (data: Partial<Category>) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await addCategory(data as Category);
      }
      setEditingCategory(null);
    } catch (err) {
      console.error('[Supabase] Error in handleSaveCategory:', err);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory(categoryToDelete.id);
        setCategoryToDelete(null);
      } catch (err) {
        console.error('[Supabase] Error in handleConfirmDeleteCategory:', err);
      }
    }
  };

  // Product CRUD Handlers
  const handleSaveProduct = async (data: Partial<ProductItem>) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await addProduct(data as ProductItem);
      }
      setEditingProduct(null);
    } catch (err: any) {
      console.error('[Supabase] Error in handleSaveProduct:', err);
      throw err;
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(productToDelete.id);
        setProductToDelete(null);
      } catch (err) {
        console.error('[Supabase] Error in handleConfirmDeleteProduct:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-[#1E2923] flex flex-col">
      
      {/* Top Admin Header Bar */}
      <header className="bg-[#0A2E24] text-white border-b-2 border-[#C8A165] sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Logo & Admin Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0E3D30] to-[#061D17] border-2 border-[#C8A165] flex flex-col items-center justify-center shadow flex-shrink-0">
              <span className="font-cinzel text-sm font-black text-[#C8A165] leading-none">RHC</span>
              <span className="text-[6px] font-bold text-[#E0C18B] uppercase">ADMIN</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel text-sm sm:text-base font-bold text-white tracking-wide">
                  RHC Wholesale Control Center
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold bg-[#C8A165] text-[#0A2E24] px-2 py-0.5 rounded-full">
                  100+ Categories Active
                </span>
              </div>
              <p className="text-[11px] text-[#C8A165]">
                Wholesale Portal &bull; Supabase Database Connected
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Supabase & Storage Connection Badge */}
            <div 
              id="supabase-status-badge"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#061D17] border border-[#C8A165]/40 text-[10px] text-gray-300"
              title="Real-time Supabase Database and Storage active"
            >
              <div className={`w-2 h-2 rounded-full ${isFirestoreSyncing ? 'bg-amber-400 animate-spin' : firestoreError ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="font-mono text-[#E0C18B]">Supabase: public.products</span>
            </div>

            {/* View Live Customer Storefront */}
            <button
              id="btn-admin-view-storefront"
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#C8A165] hover:text-[#0A2E24] text-xs font-bold transition-all border border-white/20 cursor-pointer shadow-sm"
              title="Open Public Wholesale Storefront"
            >
              <Store className="w-4 h-4 text-[#C8A165]" />
              <span className="hidden md:inline">Wholesale Storefront</span>
              <span className="md:hidden">Store</span>
            </button>

            {/* Admin User Info Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#061D17] border border-[#C8A165]/40 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[#E0C18B] font-bold">{adminUser?.name || 'Administrator'}</span>
            </div>

            {/* Change Password / Security Button */}
            <button
              id="btn-admin-change-password"
              onClick={() => setIsPasswordModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#061D17] hover:bg-[#0E3D30] text-[#E0C18B] hover:text-white border border-[#C8A165]/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Change Admin Password / Security PIN"
            >
              <Settings className="w-3.5 h-3.5 text-[#C8A165]" />
              <span className="hidden sm:inline">Password</span>
            </button>

            {/* Logout Button */}
            <button
              id="btn-admin-logout"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-800 text-red-200 hover:text-white border border-red-700/50 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Log Out of Admin Panel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

          </div>

        </div>

        {/* Sub-Navigation Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 border-t border-white/10 no-scrollbar text-xs font-bold">
          
          <button
            id="tab-admin-overview"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#C8A165] text-[#0A2E24] shadow'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Overview & KPIs</span>
          </button>

          <button
            id="tab-admin-categories"
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-[#C8A165] text-[#0A2E24] shadow'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Category Manager ({categories.length})</span>
          </button>

          <button
            id="tab-admin-products"
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#C8A165] text-[#0A2E24] shadow'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Product Manager ({products.length})</span>
          </button>

          <button
            id="tab-admin-grid"
            onClick={() => setActiveTab('grid')}
            className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'grid'
                ? 'bg-[#C8A165] text-[#0A2E24] shadow'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>3-Images Catalog Grid</span>
          </button>

          <button
            id="tab-admin-branding"
            onClick={() => setActiveTab('branding')}
            className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-[#C8A165] text-[#0A2E24] shadow'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Website Logo &amp; Branding</span>
          </button>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* ===================== OVERVIEW TAB ===================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Website Logo & Branding Settings Card */}
            <LogoBrandingSettingsCard onViewStorefront={onBackToStore} />

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Categories</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0A2E24] font-cinzel">
                    {categories.length}+
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold">Ready 100+ Hardware Categories</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#0A2E24]/10 flex items-center justify-center text-[#0A2E24]">
                  <Layers className="w-6 h-6 text-[#C8A165]" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Catalog Products</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0A2E24] font-cinzel">
                    {products.length}
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold">3-Angle Images Enabled</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#0A2E24]/10 flex items-center justify-center text-[#0A2E24]">
                  <Package className="w-6 h-6 text-[#C8A165]" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inventory Wholesale Value</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#0A2E24] font-cinzel">
                    Rs. {totalInventoryValue.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-gray-500">Estimated Ready Stock Value</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#0A2E24]/10 flex items-center justify-center text-[#0A2E24]">
                  <DollarSign className="w-6 h-6 text-[#C8A165]" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Live Cloud Sync</span>
                  <div className="text-lg font-bold text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Supabase Active</span>
                  </div>
                  <p className="text-[11px] text-gray-500">Real-time Supabase B2B Catalog</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>

            </div>

            {/* Quick Actions & Recent Inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Quick Actions Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0A2E24] to-[#061D17] text-white border border-[#C8A165] shadow-lg space-y-4">
                <div className="flex items-center gap-2 text-[#C8A165]">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-cinzel text-base font-bold text-white">Management Quick Actions</h3>
                </div>

                <p className="text-xs text-gray-300">
                  Instantly publish new architectural hardware SKUs or add new wholesale categories with 3-angle views.
                </p>

                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setIsCategoryModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#C8A165] hover:bg-[#E0C18B] text-[#0A2E24] font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer shadow-md"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      + Add New Category (Tower Bolt, Hinges, etc.)
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setIsProductModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer border border-white/20"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#C8A165]" />
                      + Add Hardware Product with 3 Images
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={onBackToStore}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0E3D30] hover:bg-[#124A3B] text-[#E0C18B] font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer border border-[#C8A165]/30"
                  >
                    <span className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#C8A165]" />
                      Preview Live Wholesale Storefront
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Recent Products Highlight */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-cinzel text-base font-bold text-[#0A2E24]">
                      Featured Wholesale Inventory
                    </h3>
                    <p className="text-xs text-gray-500">Live products configured with 3-angle images & wholesale pricing</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-xs font-bold text-[#C8A165] hover:underline"
                  >
                    View All ({products.length}) &rarr;
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {products.slice(0, 5).map((prod) => (
                    <div key={prod.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={prod.images?.front || prod.image} 
                          alt={prod.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0" 
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-[#0A2E24] truncate">{prod.name}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                            <span className="font-mono font-bold text-gray-700">{prod.sku}</span>
                            <span>&bull;</span>
                            <span>{prod.categoryName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 text-right">
                        <div>
                          <span className="font-extrabold text-xs text-[#0A2E24] block">
                            Rs. {prod.wholesalePrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-500">MOQ: {prod.minOrderQty}</span>
                        </div>

                        <button
                          onClick={() => setGalleryProduct(prod)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#0A2E24] hover:text-white text-gray-700 transition-colors cursor-pointer"
                          title="View 3 Images Gallery"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ===================== CATEGORY MANAGER TAB (100+ Categories) ===================== */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            
            {/* Action & Filter Bar */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-cinzel text-xl font-bold text-[#0A2E24] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#C8A165]" />
                    <span>Hardware Category Manager ({filteredCategories.length} / {categories.length} Categories)</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add, edit, or remove 100+ hardware categories (Tower Bolt, Hinges, L Handles, Aldrop, Brass Pulls, etc.)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-add-category"
                    onClick={() => {
                      setEditingCategory(null);
                      setIsCategoryModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A2E24] text-[#E0C18B] border border-[#C8A165] font-extrabold text-xs hover:bg-[#124A3B] transition-colors cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4 text-[#C8A165]" />
                    <span>+ Add Category</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="pt-2">
                <div className="relative">
                  <input
                    id="input-search-categories"
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search categories by name, material, finish (e.g. Tower Bolt, Hinges, Brass, Aldrop, Die Cast...)"
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#C8A165] focus:outline-none bg-white"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  {categorySearch && (
                    <button 
                      onClick={() => setCategorySearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

              {/* Reorder Status Notification */}
              {reorderSuccessMessage && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{reorderSuccessMessage}</span>
                </div>
              )}

              {/* Drag & Drop Instruction Hint */}
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#F4F7F5] border border-gray-200 rounded-2xl text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0A2E24] text-[#E0C18B] font-bold text-[10px]">
                    ⠿
                  </span>
                  <span>
                    <strong className="text-[#0A2E24]">Drag & Drop Reorder:</strong> Grab the <strong className="text-gray-800">⠿ grip handle</strong> or use the <strong className="text-gray-800">↑ ↓ buttons</strong> to set the category display sequence. Order changes are automatically saved to Supabase in real-time.
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 font-semibold hidden md:inline">
                  {filteredCategories.length} items listed
                </span>
              </div>
            </div>

            {/* Categories Table / Grid with Drag and Drop */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleCategoryDragEnd}
                >
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0A2E24] text-white border-b border-[#C8A165]/30 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3.5 px-3 font-bold text-center w-16">Order</th>
                        <th className="py-3.5 px-4 font-bold">Category</th>
                        <th className="py-3.5 px-4 font-bold">Linked Products</th>
                        <th className="py-3.5 px-4 font-bold">Material & Specs</th>
                        <th className="py-3.5 px-4 font-bold">Popular Finishes</th>
                        <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <SortableContext
                      items={filteredCategories.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <tbody className="divide-y divide-gray-100">
                        {filteredCategories.map((cat, idx) => {
                          const linkedCount = products.filter((p) => doesProductMatchCategory(p, cat)).length;
                          const fullListIndex = categories.findIndex((c) => c.id === cat.id);

                          return (
                            <SortableCategoryRow
                              key={cat.id}
                              category={cat}
                              index={idx}
                              totalCount={filteredCategories.length}
                              linkedCount={linkedCount}
                              onEdit={(category) => {
                                setEditingCategory(category);
                                setIsCategoryModalOpen(true);
                              }}
                              onDelete={(category) => setCategoryToDelete(category)}
                              onMoveUp={
                                fullListIndex > 0
                                  ? () => handleMoveCategoryStep(fullListIndex, 'up')
                                  : undefined
                              }
                              onMoveDown={
                                fullListIndex < categories.length - 1
                                  ? () => handleMoveCategoryStep(fullListIndex, 'down')
                                  : undefined
                              }
                            />
                          );
                        })}
                      </tbody>
                    </SortableContext>
                  </table>
                </DndContext>
              </div>

              {filteredCategories.length === 0 && (
                <div className="py-12 text-center text-gray-500 space-y-2">
                  <p className="font-semibold text-sm">No hardware category matches &ldquo;{categorySearch}&rdquo;</p>
                  <button
                    onClick={() => {
                      setCategorySearch('');
                    }}
                    className="text-xs font-bold text-[#C8A165] underline"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ===================== PRODUCT MANAGER TAB ===================== */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            
            {/* Website Logo & Branding Settings Card (Top of Product Manager) */}
            <LogoBrandingSettingsCard onViewStorefront={onBackToStore} />

            {/* Product Control Bar */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-cinzel text-xl font-bold text-[#0A2E24] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#C8A165]" />
                    <span>Product Catalog Manager ({filteredProducts.length} Products)</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Each product includes SKU, Wholesale Price, and 3 high-res angles (Front, Side, Installed View).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-clean-base64-products"
                    disabled={isCleaningBase64}
                    onClick={async () => {
                      try {
                        setIsCleaningBase64(true);
                        setCleanMessage(null);
                        const count = await cleanOldBase64Products();
                        setCleanMessage(
                          count > 0 
                            ? `✓ Successfully removed ${count} oversized legacy Base64 products from Supabase.` 
                            : '✓ All products are clean! No oversized Base64 items found.'
                        );
                      } catch (err: any) {
                        setCleanMessage(`⚠️ Cleanup error: ${err?.message || 'Failed to clean old Base64 items'}`);
                      } finally {
                        setIsCleaningBase64(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors cursor-pointer border border-amber-300 disabled:opacity-50"
                    title="Scan Supabase and delete legacy oversized Base64 items"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>{isCleaningBase64 ? 'Cleaning Base64...' : 'Clean Old Base64 Products'}</span>
                  </button>

                  <button
                    onClick={resetProducts}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer border border-gray-300"
                    title="Reset to default products"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Refresh Products</span>
                  </button>

                  <button
                    id="btn-add-product"
                    onClick={() => {
                      setEditingProduct(null);
                      setIsProductModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A2E24] text-[#E0C18B] border border-[#C8A165] font-extrabold text-xs hover:bg-[#124A3B] transition-colors cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4 text-[#C8A165]" />
                    <span>+ Add New Product</span>
                  </button>
                </div>
              </div>

              {cleanMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between font-medium">
                  <span>{cleanMessage}</span>
                  <button type="button" onClick={() => setCleanMessage(null)} className="text-emerald-900 font-bold hover:underline">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                <div className="sm:col-span-7 relative">
                  <input
                    id="input-search-products"
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search by Product Name, SKU, Category, Material..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#C8A165] focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  {productSearch && (
                    <button 
                      onClick={() => setProductSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs"
                    >
                      &times;
                    </button>
                  )}
                </div>

                <div className="sm:col-span-5">
                  <select
                    id="select-filter-product-category"
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:border-[#C8A165] focus:outline-none bg-white"
                  >
                    <option value="all">All Categories ({categories.length} Categories)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0A2E24] text-white border-b border-[#C8A165]/30 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Product (3-Angles)</th>
                      <th className="py-3.5 px-4 font-bold">Category & SKU</th>
                      <th className="py-3.5 px-4 font-bold">Wholesale Price (PKR)</th>
                      <th className="py-3.5 px-4 font-bold">MOQ & Packaging</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-gray-50/80 transition-colors">
                        
                        {/* 3-Images Thumbnails & Title */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {/* 3 mini angle badges */}
                            <div 
                              onClick={() => setGalleryProduct(prod)}
                              className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-300 cursor-pointer group flex-shrink-0 shadow-sm"
                              title="Click to view 3-angle gallery"
                            >
                              <img 
                                src={formatImageSrc((Array.isArray(prod.images) && prod.images.length > 0) ? prod.images[0] : (prod.images?.front || prod.image || prod.imageBase64), DEFAULT_FALLBACK_IMAGE)} 
                                alt={prod.productName || prod.name} 
                                onError={(e) => handleImageError(e, DEFAULT_FALLBACK_IMAGE)}
                                className="w-full h-full object-cover bg-white group-hover:scale-110 transition-transform" 
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Maximize2 className="w-4 h-4 text-[#C8A165]" />
                              </div>
                              <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] font-bold text-[#E0C18B] text-center py-0.5">
                                {Array.isArray(prod.images) && prod.images.length > 1 ? `${prod.images.length} VIEWS` : '4 VIEWS'}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <h4 className="font-bold text-gray-900 text-xs line-clamp-1">{prod.name}</h4>
                              <p className="text-[10px] text-gray-500 truncate max-w-xs">{prod.description}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {prod.isBestSeller && (
                                  <span className="text-[9px] font-extrabold bg-[#0A2E24] text-[#E0C18B] px-1.5 py-0.2 rounded">
                                    BESTSELLER
                                  </span>
                                )}
                                {prod.isNewArrival && (
                                  <span className="text-[9px] font-extrabold bg-[#C8A165] text-[#0A2E24] px-1.5 py-0.2 rounded">
                                    NEW
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & SKU */}
                        <td className="py-3 px-4">
                          <span className="font-mono text-gray-900 font-bold text-xs block">{prod.sku}</span>
                          <span className="text-[11px] text-[#C8A165] font-semibold">{prod.categoryName}</span>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-sm text-[#0A2E24] block">
                            Rs. {prod.wholesalePrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-500">per {prod.unit || 'Unit'}</span>
                        </td>

                        {/* MOQ & Packaging */}
                        <td className="py-3 px-4 text-gray-700">
                          <span className="font-bold text-xs block">{prod.minOrderQty}</span>
                          <span className="text-[10px] text-gray-500">{prod.packSize}</span>
                        </td>

                        {/* Stock Status */}
                        <td className="py-3 px-4">
                          {prod.inStock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Ready Stock ({prod.stockCount || 100})
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Pre-Order
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View 3-Images Modal */}
                            <button
                              onClick={() => setGalleryProduct(prod)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#0A2E24] hover:text-white text-gray-700 transition-colors cursor-pointer"
                              title="View 3-Angle Gallery Modal"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => {
                                setEditingProduct(prod);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#0A2E24] hover:text-white text-gray-700 transition-colors cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setProductToDelete(prod)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredProducts.length === 0 && (
                <div className="py-12 text-center text-gray-500 space-y-2">
                  <p className="font-semibold text-sm">No hardware products match your search query.</p>
                  <button
                    onClick={() => {
                      setProductSearch('');
                      setProductCategoryFilter('all');
                    }}
                    className="text-xs font-bold text-[#C8A165] underline"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ===================== 3-IMAGES CATALOG GRID TAB ===================== */}
        {activeTab === 'grid' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-cinzel text-xl font-bold text-[#0A2E24]">
                  Visual 3-Angle Product Grid
                </h2>
                <p className="text-xs text-gray-500">
                  Click any product card to launch the interactive 3-images gallery modal (Front, Side, Installed views).
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#0A2E24] text-[#E0C18B] border border-[#C8A165] font-extrabold text-xs hover:bg-[#124A3B] transition-colors cursor-pointer shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-[#C8A165]" />
                <span>+ New Product</span>
              </button>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => setGalleryProduct(prod)}
                  className="group rounded-2xl bg-white border border-gray-200 hover:border-[#C8A165] hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  {/* Image stage */}
                  <div className="relative aspect-[4/3] bg-white overflow-hidden">
                    <img
                      src={formatImageSrc(prod.images?.front || prod.image || prod.imageBase64, DEFAULT_FALLBACK_IMAGE)}
                      alt={prod.productName || prod.name}
                      onError={(e) => handleImageError(e, DEFAULT_FALLBACK_IMAGE)}
                      className="w-full h-full object-cover bg-white group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge 3 Angles */}
                    <div className="absolute top-2.5 left-2.5 bg-[#0A2E24]/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-extrabold text-[#E0C18B] border border-[#C8A165]/40 shadow">
                      3-Angle Views
                    </div>

                    <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-white">
                      {prod.sku}
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 text-[#0A2E24] shadow group-hover:bg-[#C8A165] transition-colors">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#C8A165] uppercase tracking-wider block">
                        {prod.categoryName}
                      </span>
                      <h4 className="font-bold text-sm text-[#0A2E24] line-clamp-2 leading-snug">
                        {prod.name}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-extrabold text-[#0A2E24] block">
                          Rs. {prod.wholesalePrice.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-500">MOQ: {prod.minOrderQty}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setGalleryProduct(prod);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-[#0A2E24] text-[#E0C18B] hover:bg-[#124A3B] font-bold text-[11px] flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>3-Views</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ===================== BRANDING & LOGO TAB ===================== */}
        {activeTab === 'branding' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <LogoBrandingSettingsCard onViewStorefront={onBackToStore} />
          </div>
        )}

      </main>

      {/* Category Modal (Add / Edit) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        initialData={editingCategory}
      />

      {/* Product Modal (Add / Edit with 3 images) */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        initialData={editingProduct}
        categories={categories}
      />

      {/* 3-Images Gallery Modal */}
      <Product3ImagesGalleryModal
        product={galleryProduct}
        onClose={() => setGalleryProduct(null)}
      />

      {/* Delete Category Confirmation Dialog */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-red-200 shadow-2xl text-left">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[#0A2E24]">Delete Category?</h3>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to remove <strong>{categoryToDelete.name}</strong>? Existing products will remain preserved.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCategoryToDelete(null)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteCategory}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-red-200 shadow-2xl text-left">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[#0A2E24]">Delete Hardware Product?</h3>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete <strong>{productToDelete.name}</strong> (SKU: {productToDelete.sku})?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteProduct}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset and Security Modal */}
      <ForgotPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

    </div>
  );
}
