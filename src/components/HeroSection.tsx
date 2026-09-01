import React from 'react';
import { 
  ArrowRight, 
  Sparkles
} from 'lucide-react';
import { COMPANY_INFO, CATEGORIES } from '../data/hardwareData';

interface HeroSectionProps {
  onOpenQuoteModal: () => void;
  onSelectCategory?: (categoryId: string) => void;
}

export function HeroSection({ onOpenQuoteModal }: HeroSectionProps) {

  return (
    <section id="hero" className="relative bg-[#0A2E24] text-white overflow-hidden pt-8 sm:pt-12 pb-14 sm:pb-18 border-b border-[#C8A165]/20">
      
      {/* Background Architectural Geometry and Gold Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 right-10 w-96 h-96 bg-[#C8A165]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -left-20 w-80 h-80 bg-[#124A3B]/60 rounded-full blur-2xl" />
        
        {/* Hardware Blueprint Grid Lines */}
        <div 
          className="absolute inset-0 opacity-[0.07]" 
          style={{
            backgroundImage: `linear-gradient(#C8A165 1px, transparent 1px), linear-gradient(to right, #C8A165 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }} 
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        <div className="space-y-6">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E3D30] border border-[#C8A165]/50 text-xs font-semibold text-[#E0C18B] shadow-inner mx-auto">
            <span className="w-2 h-2 rounded-full bg-[#C8A165] animate-ping" />
            <span className="tracking-wide uppercase font-bold text-[#C8A165]">RHC GROUP WHOLESALE DEPOT</span>
            <span className="text-gray-400">&bull;</span>
            <span>Factory Direct Supply</span>
          </div>

          {/* Main Headline with requested exact wording "All Kinds of Hardware Items" */}
          <div className="space-y-3">
            <h1 className="font-cinzel text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.15] text-white">
              <span className="block text-[#E0C18B] text-xl sm:text-2xl font-brand font-semibold mb-1 tracking-wider uppercase">
                Raffay Hardware Company
              </span>
              ALL KINDS OF <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E0C18B] via-[#C8A165] to-[#A98042] drop-shadow-[0_2px_12px_rgba(200,161,101,0.3)]">HARDWARE ITEMS</span>
            </h1>
            
            <p className="text-gray-200 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto font-normal">
              Direct wholesale importers, manufacturers & bulk distributors of <strong className="text-[#E0C18B] font-semibold">Handle Lock Bearings</strong>, <strong className="text-[#E0C18B] font-semibold">Full Die-Cast Lever Sets</strong>, <strong className="text-[#E0C18B] font-semibold">Metal Die-Cast Fittings</strong>, <strong className="text-[#E0C18B] font-semibold">Kitchen Accessories</strong>, <strong className="text-[#E0C18B] font-semibold">Solid Brass Main Handles</strong>, and <strong className="text-[#E0C18B] font-semibold">China Cabinet Handles</strong>.
            </p>
          </div>

          {/* Quick Actions: Browse Categories */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <a
              href="#categories"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0E3D30] border-2 border-[#C8A165] text-[#E0C18B] font-bold text-sm sm:text-base hover:bg-[#C8A165] hover:text-[#0A2E24] transition-all duration-300 shadow-md"
            >
              <span>Browse Categories</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
