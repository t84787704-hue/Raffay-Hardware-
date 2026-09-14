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

import { SearchPicsDropdown } from './SearchPicsDropdown';
import { useProductSearch } from '../utils/productSearch';

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

  // Local search input for instantaneous typing & 200ms debounce
  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchQuery]);

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

  // Fuse.js fuzzy search logic with threshold 0.4 and 200ms debounce
  const { results: matchingProducts } = useProductSearch(products, searchInput, 200);

  const hasSearchHits = (isSearchFocused || isMobileSearchFocused) && searchInput.trim().length > 0;

  // Handle clicking a product pic from search -> opens 4-angle product modal
  const handleSelectProductPic = (prod: ProductItem) => {
    setIsSearchFocused(false);
    setIsMobileSearchFocused(false);

    if (onSelectProductObject) {
      onSelectProductObject(prod);
    }
  };

  // Handle Enter key in search box
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matchingProducts.length > 0) {
        handleSelectProductPic(matchingProducts[0]);
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

  // Search dropdown contents renderer - ONLY product pics, no text, max 12 pics in 4-column grid
  const renderSearchResultsDropdown = () => (
    <SearchPicsDropdown
      products={matchingProducts}
      onSelectProduct={handleSelectProductPic}
    />
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
              href="/#categories" 
              onClick={(e) => {
                if (location.pathname !== '/') {
                  e.preventDefault();
                  navigate('/');
                  setTimeout(() => {
                    const el = document.getElementById('categories');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }
              }}
              className="text-gray-200 hover:text-[#C8A165] transition-colors py-2"
            >
              Categories
            </a>
            <button 
              type="button"
              onClick={() => {
                navigate('/catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`hover:text-[#C8A165] transition-colors py-2 cursor-pointer font-medium ${
                location.pathname === '/catalog' || location.pathname === '/hardware-catalog'
                  ? 'text-[#C8A165] font-bold border-b-2 border-[#C8A165]'
                  : 'text-gray-200'
              }`}
            >
              Hardware Catalog
            </button>
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
                value={searchInput}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search products & SKUs..."
                className="w-full bg-[#061D17] border border-[#C8A165]/40 rounded-lg pl-9 pr-7 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#C8A165] focus:ring-1 focus:ring-[#C8A165] transition-all"
              />
              <Search className="w-4 h-4 text-[#C8A165] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchInput && (
                <button 
                  onClick={() => {
                    setSearchInput('');
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
              {isSearchFocused && searchInput.trim().length > 0 && renderSearchResultsDropdown()}
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
              value={searchInput}
              onFocus={() => setIsMobileSearchFocused(true)}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setIsMobileSearchFocused(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search products & SKUs..."
              className="w-full bg-[#061D17] border border-[#C8A165]/40 rounded-lg pl-9 pr-7 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#C8A165]"
            />
            <Search className="w-4 h-4 text-[#C8A165] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchInput && (
              <button 
                onClick={() => {
                  setSearchInput('');
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
            {isMobileSearchFocused && searchInput.trim().length > 0 && renderSearchResultsDropdown()}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-menu-drawer" className="lg:hidden bg-[#061D17] border-t border-[#C8A165]/30 px-4 pt-3 pb-6 space-y-3 shadow-2xl">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button 
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (location.pathname !== '/') {
                  navigate('/');
                  setTimeout(() => {
                    const el = document.getElementById('categories');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                } else {
                  const el = document.getElementById('categories');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="p-2.5 rounded-lg bg-[#0A2E24] text-white hover:text-[#C8A165] flex items-center gap-2 border border-[#C8A165]/20 text-left cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#C8A165]" />
              <span>Categories ({categories.length})</span>
            </button>
            <button 
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`p-2.5 rounded-lg text-white hover:text-[#C8A165] flex items-center gap-2 border text-left cursor-pointer ${
                location.pathname === '/catalog' || location.pathname === '/hardware-catalog'
                  ? 'bg-[#124A3B] border-[#C8A165] text-[#E0C18B] font-bold'
                  : 'bg-[#0A2E24] border-[#C8A165]/20'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#C8A165]" />
              <span>Hardware Catalog</span>
            </button>
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
