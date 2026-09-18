import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  Search, 
  Plus, 
  ArrowRight, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Package, 
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Brand } from '../types';
import { useHardwareStore } from '../context/HardwareStoreContext';
import { INITIAL_BRANDS } from '../data/initialBrands';
import { BrandManagementSection } from './admin/BrandManagementSection';
import { AddBrandModal } from './AddBrandModal';

interface BrandsPageProps {
  onOpenQuoteModal?: () => void;
}

export function BrandsPage({ onOpenQuoteModal }: BrandsPageProps) {
  const navigate = useNavigate();
  const { 
    brands: contextBrands, 
    products, 
    isRHCAdmin, 
    isAdmin, 
    isAuthenticated, 
    categories, 
    addBrand: contextAddBrand 
  } = useHardwareStore();

  const hasAdminAccess = isRHCAdmin || isAdmin || isAuthenticated;

  // 1. In BrandsPage.tsx:
  // - const [brands, setBrands] = useState(dummyBrands) - no slice, show all unlimited
  // - Load from localStorage on page load
  const [brands, setBrands] = useState<Brand[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rhc_brands');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // If stored had only 8 dummy brands, expand with initial 20 brands
            if (parsed.length <= 8) {
              const existingIds = new Set(parsed.map((b: Brand) => b.id || b.name));
              const merged = [...parsed];
              for (const b of INITIAL_BRANDS) {
                if (!existingIds.has(b.id) && !existingIds.has(b.name)) {
                  merged.push(b);
                }
              }
              localStorage.setItem('rhc_brands', JSON.stringify(merged));
              return merged;
            }
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to parse rhc_brands from localStorage:', e);
      }
    }
    return INITIAL_BRANDS;
  });

  // Sync with context if context updates from admin
  useEffect(() => {
    if (contextBrands && contextBrands.length > 0) {
      setBrands((prev) => {
        // keep any extra or newest items
        if (contextBrands.length !== prev.length) {
          return contextBrands;
        }
        return prev;
      });
    }
  }, [contextBrands]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminManageOpen, setIsAdminManageOpen] = useState(false);
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 2. Make + Add Brand Logo functional for unlimited:
  // On Save: setBrands([newBrand, ...brands]) - new brand adds to top, count increases
  // Save to localStorage: localStorage.setItem('rhc_brands', JSON.stringify(brands)) so unlimited persists after refresh
  const handleSaveNewBrand = (newBrand: Brand) => {
    setBrands((prev) => {
      const updated = [newBrand, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rhc_brands', JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to save rhc_brands to localStorage:', e);
        }
      }
      return updated;
    });

    // Also sync to store context
    contextAddBrand({
      id: newBrand.id,
      name: newBrand.name,
      description: newBrand.description,
      logo: newBrand.logo,
      website: newBrand.website,
      order: 0,
    });

    showToast(`Brand "${newBrand.name}" added successfully to Brands!`);
  };

  // Filter brands based on search query - no slice, unlimited!
  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q))
    );
  }, [brands, searchQuery]);

  // Compute products associated with a brand
  const getProductCountForBrand = (brandName: string): number => {
    const bLower = brandName.toLowerCase();
    return products.filter((p) => {
      const matchBrandProp = p.brand && p.brand.toLowerCase() === bLower;
      const matchName = (p.name || p.productName || '').toLowerCase().includes(bLower);
      const matchDesc = (p.description || '').toLowerCase().includes(bLower);
      const matchTags = p.tags && p.tags.some((t) => t.toLowerCase() === bLower);
      return matchBrandProp || matchName || matchDesc || matchTags;
    }).length;
  };

  // Helper for placeholder initials with dark green bg #0a2e1f
  const getBrandInitials = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return 'BR';
    const words = trimmed.split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, 3).toUpperCase();
    }
    if (words[0].length >= 2 && words[0] === words[0].toUpperCase()) {
      return words[0];
    }
    return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
  };

  const handleBrandClick = (brand: Brand) => {
    // Navigate to Hardware Catalog filtered by this brand
    navigate(`/catalog?brand=${encodeURIComponent(brand.name)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="brands-page-root" className="min-h-screen bg-[#e8dcc6] text-[#1E2923] pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-[#0A2E24] text-white border border-[#C8A165] rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#C8A165]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Breadcrumb Bar */}
      <div className="bg-[#0A2E24] text-white border-b border-[#C8A165]/30 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-300">
            <button 
              onClick={() => navigate('/')} 
              className="hover:text-[#C8A165] transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-[#C8A165] font-bold">Brands</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[#E0C18B]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C8A165]" />
              Authorized Wholesale Importer &amp; Distributor
            </span>
          </div>
        </div>
      </div>

      {/* Main Page Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        
        {/* Page Header as requested:
            "OUR BRANDS - COMPANIES WE DEAL IN (${brands.length}) - dynamic count, not fixed (8)"
        */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#5a3d2b]/15 text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A2E24] text-[#E0C18B] text-xs font-bold uppercase tracking-wider">
              <Star className="w-3.5 h-3.5 fill-[#C8A165] text-[#C8A165]" />
              <span>Architectural Dealerships</span>
            </div>

            <h1 className="font-cinzel text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0A2E24] tracking-tight">
              OUR BRANDS &ndash; COMPANIES WE DEAL IN ({brands.length})
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              We deal in premier international and domestic hardware manufacturers, providing guaranteed authentic batch stock, wholesale bulk rates, and direct warranty backings across Pakistan.
            </p>
          </div>

          {/* Action Buttons: + Add Brand Logo & View Full Catalog */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              id="btn-add-brand-logo-main"
              onClick={() => setIsAddBrandModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0A2E24] hover:bg-[#124A3B] text-[#E0C18B] text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer border border-[#C8A165]/30 hover:border-[#C8A165]"
              title="Add a new brand logo"
            >
              <Plus className="w-4 h-4 text-[#C8A165]" />
              <span>+ Add Brand Logo</span>
            </button>

            {hasAdminAccess && (
              <button
                type="button"
                id="btn-admin-manage-brands"
                onClick={() => setIsAdminManageOpen(!isAdminManageOpen)}
                className="px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-gray-300"
              >
                <span>{isAdminManageOpen ? 'Close Manager' : 'Manage List'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                navigate('/catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2.5 rounded-xl bg-[#5a3d2b] hover:bg-[#432b1e] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Package className="w-4 h-4 text-[#C8A165]" />
              <span>View Full Catalog</span>
            </button>
          </div>
        </div>

        {/* Collapsible Admin Brand Management Drawer if toggled by admin */}
        {hasAdminAccess && isAdminManageOpen && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-200">
            <BrandManagementSection 
              onViewStorefront={() => setIsAdminManageOpen(false)}
              onBrandClick={handleBrandClick}
            />
          </div>
        )}

        {/* Search Bar to Filter Brands by Name */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-[#5a3d2b]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="brand-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brands by name (e.g. Hettich, Khas, RHC, Yale, Stanley)..."
              className="w-full bg-[#f8f5ee] border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C8A165] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded bg-gray-200/80"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search text: Showing ${filteredBrands.length} of ${brands.length} Brands - dynamic */}
          <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold px-2">
            <Filter className="w-3.5 h-3.5 text-[#5a3d2b]" />
            <span id="brand-count-indicator">
              Showing {filteredBrands.length} of {brands.length} Brands
            </span>
          </div>
        </div>

        {/* 4. Golden note above grid as requested:
            "Unlimited Brands - Add as many companies as you deal in"
        */}
        <div 
          id="golden-unlimited-brands-banner"
          className="rounded-2xl bg-gradient-to-r from-[#C8A165]/20 via-[#E0C18B]/30 to-[#C8A165]/20 border border-[#C8A165] p-3.5 sm:p-4 text-left shadow-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 text-[#0A2E24]">
            <div className="w-7 h-7 rounded-lg bg-[#C8A165] flex items-center justify-center text-[#0A2E24] shrink-0 font-bold shadow-xs">
              <Sparkles className="w-4 h-4 fill-[#0A2E24]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-[#0A2E24] tracking-tight">
                Unlimited Brands &ndash; Add as many companies as you deal in
              </p>
              <p className="text-[11px] text-[#5a3d2b] font-medium hidden sm:block">
                No limit on partnerships or vendor logos. Click &ldquo;+ Add Brand Logo&rdquo; above to register more dealerships.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddBrandModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#0A2E24] hover:bg-[#124A3B] text-[#E0C18B] text-xs font-bold shrink-0 transition-colors cursor-pointer border border-[#C8A165]/40"
          >
            + Add Brand
          </button>
        </div>

        {/* Brand Grid as requested:
            "Grid: 3 columns mobile, 4-5 desktop, white square boxes aspect-square with logo object-contain, padding 16px, golden border on hover #d4a574, dark green bg #0a2e1f for placeholder initials"
            "Each brand card clickable → filter hardware catalog to show only products from that brand"
            "Show company name below logo"
        */}
        <div 
          id="brands-grid"
          className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5"
        >
          {filteredBrands.map((brand) => {
            const initials = getBrandInitials(brand.name);
            const count = getProductCountForBrand(brand.name);

            return (
              <div
                key={brand.id}
                id={`brand-card-${brand.id}`}
                onClick={() => handleBrandClick(brand)}
                className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-md aspect-square border border-gray-200 hover:border-[#d4a574] transition-all flex flex-col items-center justify-between text-center cursor-pointer select-none relative overflow-hidden"
                title={`Click to view products by ${brand.name}`}
              >
                {/* Subtle hover golden glow bar */}
                <div className="absolute top-0 inset-x-0 h-1 bg-transparent group-hover:bg-[#d4a574] transition-colors" />

                {/* Logo Section (object-contain with max dimensions) */}
                <div className="flex-1 w-full flex items-center justify-center overflow-hidden py-1">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      className="max-h-full max-w-full object-contain p-1 group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    /* Dark green bg #0a2e1f for placeholder initials */
                    <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-[#0a2e1f] flex flex-col items-center justify-center text-[#E0C18B] shadow-inner group-hover:scale-105 transition-transform duration-200 border border-[#C8A165]/30">
                      <span className="font-cinzel font-bold text-base sm:text-xl tracking-wider">
                        {initials}
                      </span>
                      <span className="text-[8px] uppercase tracking-widest text-[#C8A165]/80 font-medium">
                        Brand
                      </span>
                    </div>
                  )}
                </div>

                {/* Show company name below logo */}
                <div className="w-full pt-2 border-t border-gray-100 flex flex-col items-center justify-center">
                  <p className="text-[11px] sm:text-xs md:text-sm font-bold text-[#0A2E24] group-hover:text-[#8C6B3E] transition-colors line-clamp-1 w-full">
                    {brand.name}
                  </p>
                  
                  <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-0.5 group-hover:text-[#0A2E24] transition-colors">
                    <span>View Catalog</span>
                    <ChevronRight className="w-2.5 h-2.5 text-[#C8A165] group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state for search */}
        {filteredBrands.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#f8f5ee] flex items-center justify-center mx-auto text-gray-400">
              <Search className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-cinzel text-lg font-bold text-[#0A2E24]">No Matching Brands Found</h3>
              <p className="text-xs text-gray-500 mt-1">
                No company name matches &ldquo;{searchQuery}&rdquo;. Try another keyword or browse all partner brands.
              </p>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-[#C8A165] text-[#0A2E24] text-xs font-bold hover:bg-[#d4a574] transition-colors cursor-pointer"
            >
              Clear Search Filter
            </button>
          </div>
        )}

        {/* Categories Section with requested Brown #5a3d2b styling */}
        <div className="pt-6 space-y-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#0A2E24] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#5a3d2b]" />
                <span>Explore Popular Hardware Categories</span>
              </h2>
              <p className="text-xs text-gray-600">
                Direct factory wholesale inventory organized across 100+ hardware categories.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  const el = document.getElementById('categories');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="text-xs font-bold text-[#5a3d2b] hover:text-[#0A2E24] flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>View All Categories</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C8A165]" />
            </button>
          </div>

          {/* Brown #5a3d2b category cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.slice(0, 6).map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  navigate(`/category/${encodeURIComponent(cat.id)}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group p-4 rounded-2xl bg-[#5a3d2b] hover:bg-[#432b1e] text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between aspect-[4/3] relative overflow-hidden"
              >
                <div className="space-y-1 z-10">
                  <span className="text-[9px] uppercase tracking-wider text-[#E0C18B] font-bold">
                    Category
                  </span>
                  <h4 className="font-cinzel text-xs sm:text-sm font-bold text-white group-hover:text-[#E0C18B] transition-colors line-clamp-2">
                    {cat.name}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 z-10 text-[10px] text-gray-300">
                  <span>Browse SKUs</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#C8A165] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wholesale Bulk Guarantee Callout */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0A2E24] via-[#0E3D30] to-[#0A2E24] p-6 sm:p-8 text-white border border-[#C8A165]/30 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 text-left">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-[#C8A165]">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs uppercase font-bold tracking-wider">Direct Manufacturer Dealership</span>
            </div>
            <h3 className="font-cinzel text-xl sm:text-2xl font-bold">
              Looking for Bulk Import Rates on Any Brand?
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              We provide master carton discounts, dedicated cargo freight across Pakistan, and custom import indentation for architectural hardware projects.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onOpenQuoteModal && (
              <button
                type="button"
                onClick={onOpenQuoteModal}
                className="px-5 py-3 rounded-xl bg-[#C8A165] hover:bg-[#d4a574] text-[#0A2E24] text-xs font-extrabold shadow-lg transition-all cursor-pointer"
              >
                Request Brand Quote
              </button>
            )}
            <a
              href="https://wa.me/923119655243?text=Salam%20RHC%20Group,%20I%20want%20wholesale%20rates%20for%20brands"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <span>WhatsApp Inquiries</span>
            </a>
          </div>
        </div>

      </div>

      {/* Add Brand Logo Modal for Unlimited Additions */}
      <AddBrandModal 
        isOpen={isAddBrandModalOpen}
        onClose={() => setIsAddBrandModalOpen(false)}
        onSave={handleSaveNewBrand}
      />
    </div>
  );
}

