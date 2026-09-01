import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { CategoriesGrid } from './components/CategoriesGrid';
import { Footer } from './components/Footer';
import { WholesaleQuoteModal } from './components/WholesaleQuoteModal';
import { HardwareStoreProvider, useHardwareStore } from './context/HardwareStoreContext';
import { AdminLogin } from './components/admin/AdminLogin';
import { SimpleAdminLogin } from './components/admin/SimpleAdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CategoryProductPage } from './components/CategoryProductPage';
import { Product3ImagesGalleryModal } from './components/Product3ImagesGalleryModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Category, ProductItem } from './types';

// ==========================================
// 1. ADMIN ROUTE COMPONENT (/admin)
// ==========================================
function AdminRoute() {
  const navigate = useNavigate();
  const { isAuthenticated } = useHardwareStore();

  const handleBackToStore = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If not authenticated, always show AdminLogin (user: rhcadmin, pass: RHC@123)
  if (!isAuthenticated) {
    return <AdminLogin onBackToStore={handleBackToStore} />;
  }

  // Once authenticated, render full Admin Dashboard (Add/Edit/Delete Categories & Products with 3 photos)
  return <AdminDashboard onBackToStore={handleBackToStore} />;
}

// ==========================================
// 2. CATEGORY SKU PRODUCT PAGE ROUTE (/category/:categoryId)
// ==========================================
function CategoryRoute() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { categories, inquiryItems, updateInquiryQuantity, removeInquiryItem, clearInquiry } = useHardwareStore();

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedProductForGallery, setSelectedProductForGallery] = useState<ProductItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Lookup matching category by id, name, shortName, or normalized slug (e.g. STORE, Tower Bolt, cat_lock_bearing)
  const decodedCategoryId = decodeURIComponent(categoryId || '').trim();
  const normalize = (s: string) => s.toLowerCase().replace(/^(cat_|category_)/, '').replace(/[^a-z0-9]/g, '');
  const normTarget = normalize(decodedCategoryId);

  const matchedCategory = categories.find((c) => {
    if (c.id.toLowerCase() === decodedCategoryId.toLowerCase()) return true;
    if (c.name.toLowerCase() === decodedCategoryId.toLowerCase()) return true;
    if (c.shortName && c.shortName.toLowerCase() === decodedCategoryId.toLowerCase()) return true;
    if (normTarget && (normalize(c.id) === normTarget || normalize(c.name) === normTarget || (c.shortName && normalize(c.shortName) === normTarget))) return true;
    return false;
  });

  const currentCategory: Category = matchedCategory || {
    id: decodedCategoryId || 'STORE',
    name: decodedCategoryId || 'Hardware Category',
    shortName: decodedCategoryId || 'Hardware',
    tagline: `Wholesale architectural hardware catalog for ${decodedCategoryId || 'Hardware'}.`,
    description: `High-grade architectural wholesale hardware in ${decodedCategoryId || 'Hardware'} category engineered for durability and consistent batch quality.`,
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
    itemCount: '0 Products',
    badge: 'Wholesale Direct',
    material: 'Solid Brass / High Pressure Zinc Alloy',
    popularFinishes: ['Matt Black', 'Gold Polish', 'Antique Brass', 'Satin Chrome'],
    keyFeatures: ['Factory tested mechanism', 'Wholesale carton packaging']
  };

  const handleSelectCategoryObject = (cat: Category) => {
    navigate(`/category/${encodeURIComponent(cat.id || cat.name)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategoryId = (id: string) => {
    navigate(`/category/${encodeURIComponent(id)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E8D5B7] text-[#1E2923]">
      <Header
        onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
        inquiryCount={inquiryItems.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectCategory={handleSelectCategoryId}
        onSelectCategoryObject={handleSelectCategoryObject}
        onSelectProductObject={(prod) => setSelectedProductForGallery(prod)}
      />

      <main className="flex-1 bg-[#E8D5B7]">
        <CategoryProductPage
          category={currentCategory}
          onBackToCategories={() => {
            navigate('/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectAnotherCategory={handleSelectCategoryObject}
          onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </main>

      <Footer
        onSelectCategory={handleSelectCategoryId}
        onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
      />

      <WholesaleQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        inquiryItems={inquiryItems}
        onUpdateQuantity={updateInquiryQuantity}
        onRemoveItem={removeInquiryItem}
        onClearAll={clearInquiry}
      />

      <Product3ImagesGalleryModal
        product={selectedProductForGallery}
        onClose={() => setSelectedProductForGallery(null)}
      />
    </div>
  );
}

// ==========================================
// 3. MAIN PUBLIC STOREFRONT HOME ROUTE (/)
// ==========================================
function StorefrontHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      const isIntroShown = sessionStorage.getItem('rhc_intro_shown');
      return isIntroShown !== 'true';
    } catch {
      return false;
    }
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedProductForGallery, setSelectedProductForGallery] = useState<ProductItem | null>(null);

  const { 
    inquiryItems, 
    updateInquiryQuantity, 
    removeInquiryItem, 
    clearInquiry 
  } = useHardwareStore();

  // If URL hash contains #admin or #/admin, redirect to /admin
  useEffect(() => {
    if (location.hash === '#admin' || location.hash === '#/admin' || window.location.hash.includes('admin')) {
      navigate('/admin');
    }
  }, [location, navigate]);

  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem('rhc_intro_shown', 'true');
    } catch (e) {
      console.error('Failed to set sessionStorage rhc_intro_shown:', e);
    }
    setShowSplash(false);
  }, []);

  const handleViewCategorySKUs = (category: Category) => {
    navigate(`/category/${category.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const element = document.getElementById('products');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E8D5B7] text-[#1E2923]">
      {/* 2.5s Splash Screen Logo Animation on initial visit */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Public Storefront Header (Zero Admin links) */}
      <Header
        onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
        inquiryCount={inquiryItems.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectCategory={handleSelectCategory}
        onSelectCategoryObject={handleViewCategorySKUs}
        onSelectProductObject={(prod) => setSelectedProductForGallery(prod)}
      />

      <main className="flex-1 bg-[#E8D5B7]">
        {/* Wabi-style 4 Categories Grid */}
        <CategoriesGrid
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onViewCategorySKUs={handleViewCategorySKUs}
          onOpenQuoteModalWithCategory={() => {
            setIsQuoteModalOpen(true);
          }}
        />
      </main>

      {/* Footer */}
      <Footer
        onSelectCategory={handleSelectCategory}
        onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
      />

      {/* Wholesale Quote & Bulk Inquiry Builder Modal */}
      <WholesaleQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        inquiryItems={inquiryItems}
        onUpdateQuantity={updateInquiryQuantity}
        onRemoveItem={removeInquiryItem}
        onClearAll={clearInquiry}
      />

      {/* Direct 3-Images Gallery Modal for Header search direct selections */}
      <Product3ImagesGalleryModal
        product={selectedProductForGallery}
        onClose={() => setSelectedProductForGallery(null)}
      />
    </div>
  );
}

// ==========================================
// 4. MAIN APP ROUTER COMPONENT
// ==========================================
export default function App() {
  return (
    <HardwareStoreProvider>
      <BrowserRouter>
        <Routes>
          {/* Dedicated /admin route - Login screen first (rhcadmin / RHC@123) then Dashboard */}
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/admin/*" element={<AdminRoute />} />
          
          {/* Simple Password Admin Login Route */}
          <Route path="/admin-login" element={<SimpleAdminLogin />} />
          
          {/* Category SKU Page */}
          <Route path="/category/:categoryId" element={<CategoryRoute />} />
          
          {/* Public Storefront Home */}
          <Route path="/" element={<StorefrontHome />} />
          
          {/* Catch-all route -> redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Floating WhatsApp Contact Action on all pages */}
        <FloatingWhatsApp />
      </BrowserRouter>
    </HardwareStoreProvider>
  );
}
