import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Phone, 
  MessageCircle, 
  Search, 
  ShoppingBag, 
  Menu, 
  X, 
  Layers, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  ArrowUpRight,
  Package,
  ArrowRight,
  Eye,
  Tag,
  CornerDownLeft,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { COMPANY_INFO } from '../data/hardwareData';
import { Category, ProductItem } from '../types';
import { useHardwareStore } from '../context/HardwareStoreContext';
import { scrollAndHighlight } from '../utils/searchHighlight';

interface HeaderProps {
  onOpenQuoteModal: () => void;
  inquiryCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectCategoryObject?: (category: Category) => void;
  onSelectProductObject?: (product: ProductItem) => void;
}

export function Header({
  onOpenQuoteModal,
  inquiryCount,
  searchQuery,
  setSearchQuery,
  onSelectCategory,
  onSelectCategoryObject,
  onSelectProductObject
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { categories, products, isRHCAdmin, isAdmin, logout, activeLogoUrl } = useHardwareStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAdminLogout = () => {
    logout();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Secret 3-second long press on top-left RHC GROUP square logo
  const [logoPressProgress, setLogoPressProgress] = useState(0);
  const [isLogoPressing, setIsLogoPressing] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const didTriggerLongPressRef = useRef(false);

  const startLogoLongPress = useCallback(() => {
    didTriggerLongPressRef.current = false;
    setIsLogoPressing(true);
    setLogoPressProgress(0);
    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setLogoPressProgress(progress);
    }, 40);

    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      didTriggerLongPressRef.current = true;
      setIsLogoPressing(false);
      setLogoPressProgress(0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      navigate('/admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, duration);
  }, [navigate]);

  const cancelLogoLongPress = useCallback(() => {
    setIsLogoPressing(false);
    setLogoPressProgress(0);
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const handleCallClick = () => {
    window.open(`tel:${COMPANY_INFO.phone}`, '_self');
  };

  // Live matching categories & products for search dropdown (case-insensitive)
  const { matchingCategories, matchingProducts } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return { matchingCategories: [], matchingProducts: [] };

    const matchedCats = categories.filter(c => 
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.shortName && c.shortName.toLowerCase().includes(q)) ||
      (c.badge && c.badge.toLowerCase().includes(q)) ||
      (c.material && c.material.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedProds = products.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
      (p.material && p.material.toLowerCase().includes(q)) ||
      (p.finish && p.finish.toLowerCase().includes(q)) ||
      (p.sizeOrSpec && p.sizeOrSpec.toLowerCase().includes(q)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    ).slice(0, 8);

    return { matchingCategories: matchedCats, matchingProducts: matchedProds };
  }, [searchQuery, categories, products]);

  const hasSearchHits = (isSearchFocused || isMobileSearchFocused) && searchQuery.trim().length > 0;

  // Handle clicking a category from search
  const handleSelectCategoryItem = (cat: Category) => {
    setIsSearchFocused(false);
    setIsMobileSearchFocused(false);
    
    if (location.pathname.startsWith('/category/')) {
      if (onSelectCategoryObject) {
        onSelectCategoryObject(cat);
      } else {
        navigate(`/category/${cat.id}`);
      }
      scrollAndHighlight('category-header', { delay: 150 });
    } else {
      onSelectCategory(cat.id);
      scrollAndHighlight(`category-card-${cat.id}`, { delay: 100 });
    }
  };

  // Handle clicking a product from search
  const handleSelectProductItem = (prod: ProductItem) => {
    setIsSearchFocused(false);
    setIsMobileSearchFocused(false);

    if (location.pathname.startsWith('/category/')) {
      const currentCatId = location.pathname.split('/category/')[1];
      if (prod.categoryId === currentCatId) {
        scrollAndHighlight(`product-card-${prod.id}`, { delay: 80 });
      } else {
        navigate(`/category/${prod.categoryId}`);
        setTimeout(() => {
          scrollAndHighlight(`product-card-${prod.id}`, { delay: 200, retries: 8 });
        }, 100);
      }
    } else {
      // On homepage, ensure category is visible (or 'all')
      onSelectCategory('all');
      scrollAndHighlight(`product-card-${prod.id}`, { delay: 100, retries: 8 });
    }

    if (onSelectProductObject) {
      onSelectProductObject(prod);
    }
  };

  // Handle Enter key in search box
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matchingProducts.length > 0) {
        handleSelectProductItem(matchingProducts[0]);
      } else if (matchingCategories.length > 0) {
        handleSelectCategoryItem(matchingCategories[0]);
      } else {
        // Scroll to product catalog to show filtered/empty results
        const catalogEl = document.getElementById('products');
        if (catalogEl) {
          catalogEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
      setIsMobileSearchFocused(false);
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        searchDropdownRef.current && !searchDropdownRef.current.contains(target) &&
        mobileSearchRef.current && !mobileSearchRef.current.contains(target)
      ) {
        setIsSearchFocused(false);
        setIsMobileSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search dropdown contents renderer
  const renderSearchResultsDropdown = () => (
    <div className="absolute left-0 right-0 top-full mt-2 bg-[#0A2E24] border-2 border-[#C8A165] rounded-2xl shadow-2xl overflow-hidden z-50 text-left max-h-[500px] overflow-y-auto backdrop-blur-md">
      
      {/* Category Results */}
      {matchingCategories.length > 0 && (
        <div className="p-3 border-b border-white/10">
          <div className="text-[10px] font-extrabold text-[#C8A165] uppercase tracking-wider px-1 pb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Matching Categories ({matchingCategories.length})</span>
            </div>
            <span className="text-[9px] text-gray-400 font-normal">Click to view line</span>
          </div>
          <div className="space-y-1">
            {matchingCategories.map(cat => (
              <div
                key={cat.id}
                onClick={() => handleSelectCategoryItem(cat)}
                className="p-2 rounded-xl bg-white/5 hover:bg-[#C8A165] hover:text-[#0A2E24] text-white flex items-center justify-between gap-2 cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="w-9 h-9 rounded-lg object-cover border border-[#C8A165]/50 flex-shrink-0" 
                  />
                  <div className="truncate">
                    <div className="text-xs font-bold truncate group-hover:text-[#0A2E24]">{cat.name}</div>
                    <div className="text-[10px] text-gray-300 group-hover:text-[#0A2E24]/80 flex items-center gap-1.5">
                      <span>{cat.badge || 'Wholesale Line'}</span>
                      <span>&bull;</span>
                      <span>{cat.material || 'Solid Brass / Zinc'}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-[#061D17] text-[#E0C18B] group-hover:bg-[#0A2E24] group-hover:text-white flex-shrink-0 flex items-center gap-1 shadow-sm">
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product & SKU Results */}
      {matchingProducts.length > 0 && (
        <div className="p-3">
          <div className="text-[10px] font-extrabold text-[#C8A165] uppercase tracking-wider px-1 pb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              <span>Products & SKUs ({matchingProducts.length})</span>
            </div>
            <span className="text-[9px] text-gray-400 font-normal">Press Enter to select</span>
          </div>
          <div className="space-y-1">
            {matchingProducts.map(prod => (
              <div
                key={prod.id}
                onClick={() => handleSelectProductItem(prod)}
                className="p-2 rounded-xl bg-white/5 hover:bg-[#C8A165] hover:text-[#0A2E24] text-white flex items-center justify-between gap-2 cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img 
                    src={prod.images?.front || prod.image} 
                    alt={prod.name} 
                    className="w-10 h-10 rounded-lg object-cover border border-[#C8A165]/50 flex-shrink-0" 
                  />
                  <div className="truncate">
                    <div className="text-xs font-bold truncate group-hover:text-[#0A2E24]">{prod.name}</div>
                    <div className="text-[10px] text-gray-300 group-hover:text-[#0A2E24]/80 flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[#E0C18B] group-hover:text-[#0A2E24] bg-black/40 group-hover:bg-white/40 px-1 rounded">
                        {prod.sku}
                      </span>
                      <span>&bull;</span>
                      <span className="truncate">{prod.categoryName || 'Hardware'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-extrabold text-[#25D366] group-hover:text-[#0A2E24]">
                    Rs. {prod.wholesalePrice?.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-gray-300 group-hover:text-[#0A2E24]/80 font-medium">
                    {prod.inStock ? 'In Stock' : 'Factory Order'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Products Found Fallback */}
      {matchingCategories.length === 0 && matchingProducts.length === 0 && (
        <div className="p-6 text-center text-gray-300 flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-white">No products found</div>
          <div className="text-xs text-gray-400 max-w-xs">
            No categories, products, or SKUs matching &ldquo;<span className="text-[#E0C18B] font-semibold">{searchQuery}</span>&rdquo;.
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-1 text-xs text-[#C8A165] hover:underline font-semibold"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Dropdown Footer Tip */}
      {(matchingCategories.length > 0 || matchingProducts.length > 0) && (
        <div className="px-3 py-2 bg-[#061D17] border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400">
          <span>Click any item to highlight &amp; view wholesale specs</span>
          <span className="flex items-center gap-1 text-[#E0C18B]">
            <CornerDownLeft className="w-3 h-3" />
            <span>Enter</span>
          </span>
        </div>
      )}

    </div>
  );

  return (
    <header id="main-header" className="sticky top-0 z-40 w-full bg-[#0E3B2E] text-white shadow-xl">
      {/* Main Navigation Bar (padding: 10px 16px, width 100%) */}
      <div className="w-full max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 box-border">
        <div className="flex items-center justify-between min-h-[50px] sm:h-[70px] gap-2 sm:gap-4 w-full">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
            {/* New Circular RHC GROUP Logo (48px x 48px circle, no border, no extra box) */}
            <div 
              id="header-rhc-circular-logo"
              onPointerDown={startLogoLongPress}
              onPointerUp={cancelLogoLongPress}
              onPointerLeave={cancelLogoLongPress}
              onPointerCancel={cancelLogoLongPress}
              onTouchStart={startLogoLongPress}
              onTouchEnd={cancelLogoLongPress}
              onTouchCancel={cancelLogoLongPress}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
              onClick={(e) => {
                if (didTriggerLongPressRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
              }}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%'
              }}
              className="relative overflow-hidden flex-shrink-0 cursor-pointer select-none transition-transform duration-200 hover:scale-105 active:scale-95 shadow-md flex items-center justify-center sm:w-12 sm:h-12"
              title="RHC Group - Raffay Hardware Company"
            >
              <img
                src={activeLogoUrl}
                alt="RHC Group Circular Logo"
                referrerPolicy="no-referrer"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
                className="w-full h-full rounded-full block"
              />
              {/* Secret admin login progress feedback */}
              {isLogoPressing && (
                <div 
                  className="absolute inset-0 bg-[#C8A165]/35 rounded-full transition-all duration-75 pointer-events-none"
                  style={{ opacity: logoPressProgress / 100 }}
                />
              )}
            </div>

            <a 
              id="brand-logo-link"
              href="#hero" 
              className="flex flex-col group focus:outline-none justify-center min-w-0"
            >
              {/* Full name on >=360px, "RHC" on <360px */}
              <span className="hidden min-[360px]:inline font-cinzel text-sm sm:text-base md:text-lg font-bold tracking-wide text-white group-hover:text-[#E0C18B] transition-colors leading-tight whitespace-nowrap">
                RAFFAY HARDWARE COMPANY
              </span>
              <span className="inline min-[360px]:hidden font-cinzel text-base font-extrabold tracking-wider text-white group-hover:text-[#E0C18B] leading-tight">
                RHC
              </span>
            </a>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <a 
              href="#categories" 
              className="text-gray-200 hover:text-[#C8A165] transition-colors py-2"
            >
              Categories
            </a>
            <a 
              href="#products" 
              className="text-gray-200 hover:text-[#C8A165] transition-colors py-2"
            >
              Hardware Catalog
            </a>
            <a 
              href="#wholesale-rates" 
              className="text-gray-200 hover:text-[#C8A165] transition-colors py-2"
            >
              Wholesale Supply
            </a>
            <a 
              href="#about" 
              className="text-gray-200 hover:text-[#C8A165] transition-colors py-2"
            >
              About RHC
            </a>
            <a 
              href="#contact" 
              className="text-gray-200 hover:text-[#C8A165] transition-colors py-2"
            >
              Contact & Store
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Live Search Input (Desktop) with Dual Category + Product Auto-Suggestions */}
            <div ref={searchDropdownRef} className="relative hidden md:block w-48 lg:w-72">
              <input
                id="header-search-input"
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search categories & SKUs..."
                className="w-full bg-[#061D17] border border-[#C8A165]/40 rounded-lg pl-9 pr-7 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#C8A165] focus:ring-1 focus:ring-[#C8A165] transition-all"
              />
              <Search className="w-4 h-4 text-[#C8A165] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs p-0.5"
                  title="Clear search"
                >
                  &times;
                </button>
              )}

              {/* Live Search Results Dropdown Overlay */}
              {isSearchFocused && searchQuery.trim().length > 0 && renderSearchResultsDropdown()}
            </div>

            {/* Quotation / Inquiry Cart Drawer Button */}
            <button
              id="btn-open-quote-drawer"
              onClick={onOpenQuoteModal}
              className="relative p-2 sm:px-3 sm:py-2 rounded-lg border border-[#C8A165]/50 bg-[#0E3D30] text-[#E0C18B] hover:bg-[#C8A165] hover:text-[#0A2E24] transition-all duration-300 cursor-pointer flex items-center gap-1.5"
              title="Wholesale Quote Request"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden md:inline text-xs font-semibold">Bulk Inquiry</span>
              {inquiryCount > 0 && (
                <span className="w-5 h-5 bg-[#C8A165] text-[#0A2E24] rounded-full text-[11px] font-black flex items-center justify-center">
                  {inquiryCount}
                </span>
              )}
            </button>

            {/* Admin Controls (Visible ONLY when isRHCAdmin === true) */}
            {isRHCAdmin && (
              <>
                <button
                  id="header-btn-admin-portal"
                  onClick={() => navigate('/admin')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#C8A165]/20 border border-[#C8A165] text-[#E0C18B] hover:bg-[#C8A165] hover:text-[#0A2E24] transition-all text-xs font-bold cursor-pointer"
                  title="Open Admin Dashboard"
                >
                  <ShieldCheck className="w-4 h-4 text-[#C8A165]" />
                  <span>Admin</span>
                </button>

                <button
                  id="header-btn-logout"
                  onClick={handleAdminLogout}
                  className="p-2 sm:px-3 sm:py-2 rounded-lg bg-red-900/40 hover:bg-red-800/80 border border-red-500/50 text-red-200 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Logout from Admin (Clears isRHCAdmin)"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              id="btn-toggle-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#0E3D30] transition-colors focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>

        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <div ref={mobileSearchRef} className="relative w-full">
            <input
              id="mobile-search-input"
              type="text"
              value={searchQuery}
              onFocus={() => setIsMobileSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsMobileSearchFocused(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search categories, products & SKUs..."
              className="w-full bg-[#061D17] border border-[#C8A165]/40 rounded-lg pl-9 pr-7 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#C8A165]"
            />
            <Search className="w-4 h-4 text-[#C8A165] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setIsMobileSearchFocused(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs p-0.5"
                title="Clear search"
              >
                &times;
              </button>
            )}

            {/* Mobile Search Results Dropdown Overlay */}
            {isMobileSearchFocused && searchQuery.trim().length > 0 && renderSearchResultsDropdown()}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-menu-drawer" className="lg:hidden bg-[#061D17] border-t border-[#C8A165]/30 px-4 pt-3 pb-6 space-y-3 shadow-2xl">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <a 
              href="#categories" 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-[#0A2E24] text-white hover:text-[#C8A165] flex items-center gap-2 border border-[#C8A165]/20"
            >
              <Layers className="w-4 h-4 text-[#C8A165]" />
              <span>Categories ({categories.length})</span>
            </a>
            <a 
              href="#products" 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-[#0A2E24] text-white hover:text-[#C8A165] flex items-center gap-2 border border-[#C8A165]/20"
            >
              <ShoppingBag className="w-4 h-4 text-[#C8A165]" />
              <span>Full Hardware Catalog</span>
            </a>
            <a 
              href="#wholesale-rates" 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-[#0A2E24] text-white hover:text-[#C8A165] flex items-center gap-2 border border-[#C8A165]/20"
            >
              <FileText className="w-4 h-4 text-[#C8A165]" />
              <span>Wholesale Terms</span>
            </a>
            <a 
              href="#contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-[#0A2E24] text-white hover:text-[#C8A165] flex items-center gap-2 border border-[#C8A165]/20"
            >
              <Phone className="w-4 h-4 text-[#C8A165]" />
              <span>Store Contact</span>
            </a>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleCallClick();
              }}
              className="w-full py-2.5 rounded-lg border border-[#C8A165] bg-[#0E3D30] text-[#E0C18B] font-bold text-xs flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5 text-[#C8A165]" />
              <span>Direct Phone Call ({COMPANY_INFO.phone})</span>
            </button>

            {/* Mobile Admin Controls if logged in */}
            {isRHCAdmin && (
              <div className="pt-2 mt-1 border-t border-[#C8A165]/30 grid grid-cols-2 gap-2">
                <button
                  id="mobile-btn-admin-dashboard"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/admin');
                  }}
                  className="py-2.5 rounded-lg bg-[#C8A165] text-[#0A2E24] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Panel</span>
                </button>
                <button
                  id="mobile-btn-logout"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleAdminLogout();
                  }}
                  className="py-2.5 rounded-lg bg-red-900/60 border border-red-500/50 text-red-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
