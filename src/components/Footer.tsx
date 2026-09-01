import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  ArrowUp
} from 'lucide-react';
import { COMPANY_INFO } from '../data/hardwareData';
import { useHardwareStore } from '../context/HardwareStoreContext';

interface FooterProps {
  onSelectCategory: (categoryId: string) => void;
  onOpenQuoteModal: () => void;
}

export function Footer({ onSelectCategory, onOpenQuoteModal }: FooterProps) {
  const navigate = useNavigate();
  const { activeLogoUrl } = useHardwareStore();
  const [pressProgress, setPressProgress] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Secret 3-second long-press handler on RHC Group Logo
  const startLongPress = useCallback(() => {
    setIsPressing(true);
    setPressProgress(0);
    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setPressProgress(progress);
    }, 50);

    pressTimerRef.current = setTimeout(() => {
      setIsPressing(false);
      setPressProgress(0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      navigate('/admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, duration);
  }, [navigate]);

  const cancelLongPress = useCallback(() => {
    setIsPressing(false);
    setPressProgress(0);
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  return (
    <footer className="bg-[#061D17] text-gray-300 border-t-2 border-[#C8A165]">
      
      {/* Top Pre-Footer Wholesale Callout */}
      <div className="bg-[#0A2E24] py-8 border-b border-[#C8A165]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0E3D30] border border-[#C8A165] flex items-center justify-center text-[#C8A165] flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white">
                RHC GROUP &bull; ALL KINDS OF HARDWARE ITEMS
              </h3>
              <p className="text-xs text-[#E0C18B]">
                Direct Wholesale Dealership, Bulk Imports & Nationwide Delivery
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenQuoteModal}
              className="px-5 py-2.5 rounded-xl bg-[#0E3D30] border border-[#C8A165] text-[#E0C18B] font-bold text-xs hover:bg-[#C8A165] hover:text-[#0A2E24] transition-colors cursor-pointer"
            >
              Request Bulk Rate Sheet
            </button>
          </div>

        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 text-left">
          
          {/* Brand Info with Secret Long-Press (3s) to /admin */}
          <div className="md:col-span-2 space-y-4">
            <div 
              id="footer-rhc-logo"
              onPointerDown={startLongPress}
              onPointerUp={cancelLongPress}
              onPointerLeave={cancelLongPress}
              onPointerCancel={cancelLongPress}
              onContextMenu={(e) => {
                // Prevent context menu on long-press so touch devices can hold for 3s
                if (isPressing) e.preventDefault();
              }}
              className="flex items-center gap-3 select-none cursor-pointer group relative"
              title="Raffay Hardware Company - RHC Group"
            >
              <div 
                style={{ width: '42px', height: '42px', borderRadius: '50%' }}
                className={`relative rounded-full transition-all flex items-center justify-center overflow-hidden flex-shrink-0 ${
                  isPressing 
                    ? 'scale-105 shadow-[0_0_15px_rgba(200,161,101,0.5)]' 
                    : ''
                }`}
              >
                <img
                  src={activeLogoUrl}
                  alt="RHC Group Logo"
                  referrerPolicy="no-referrer"
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                  className="w-full h-full rounded-full"
                />
                {/* Secret Progress Indicator Overlay */}
                {isPressing && (
                  <div 
                    className="absolute inset-0 bg-[#C8A165]/50 rounded-full transition-all duration-75 pointer-events-none"
                    style={{ opacity: pressProgress / 100 }}
                  />
                )}
              </div>

              <div>
                <h4 className="font-cinzel text-base font-bold text-white tracking-wide group-hover:text-[#E0C18B] transition-colors">
                  RAFFAY HARDWARE COMPANY
                </h4>
                <p className="text-[10px] text-[#C8A165] uppercase font-semibold">RHC Group Wholesale</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Pakistan's trusted wholesale importer & manufacturer supplying architectural lock bearings, full die-cast levers, metal die-cast fittings, kitchen modular accessories, solid brass handles, and China wardrobe pulls.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-[#E0C18B]">
              <ShieldCheck className="w-4 h-4 text-[#C8A165]" />
              <span>100% Quality & Tensile Strength Tested</span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h5 className="font-cinzel text-xs font-bold text-[#C8A165] uppercase tracking-wider">
              Wholesale Desk
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2 text-gray-300">
                <Phone className="w-3.5 h-3.5 text-[#C8A165]" />
                <a href={`tel:${COMPANY_INFO.phone}`} className="hover:text-[#E0C18B] transition-colors">{COMPANY_INFO.phone}</a>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-[#C8A165] mt-0.5 flex-shrink-0" />
                <span>Raffay Hardware Brandreth road Lahore</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright and Back to Top */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Raffay Hardware Company (RHC Group). All rights reserved.
          </p>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-xs text-[#C8A165] hover:text-white transition-colors cursor-pointer"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
