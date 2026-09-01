import React from 'react';
import { 
  Factory, 
  Truck, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  Award
} from 'lucide-react';
import { COMPANY_INFO, WHOLESALE_BENEFITS } from '../data/hardwareData';

interface WholesaleAdvantagesProps {
  onOpenQuoteModal?: () => void;
}

export function WholesaleAdvantages({ onOpenQuoteModal }: WholesaleAdvantagesProps) {
  const getBenefitIcon = (iconName: string) => {
    switch (iconName) {
      case 'Factory':
        return <Factory className="w-6 h-6 text-[#C8A165]" />;
      case 'Truck':
        return <Truck className="w-6 h-6 text-[#C8A165]" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-[#C8A165]" />;
      case 'Layers':
        return <Layers className="w-6 h-6 text-[#C8A165]" />;
      default:
        return <Award className="w-6 h-6 text-[#C8A165]" />;
    }
  };

  return (
    <section id="wholesale-rates" className="py-14 sm:py-18 bg-[#0A2E24] text-white relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(#C8A165 1.5px, transparent 1.5px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#124A3B] border border-[#C8A165]/50 text-[#C8A165] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>WHOLESALE PARTNERSHIP</span>
          </div>

          <h2 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
            WHY HARDWARE DEALERS & BUILDERS CHOOSE RHC GROUP
          </h2>

          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            Supplying retail shops, builders, interior designers, and furniture manufacturers across Pakistan with factory-guaranteed hardware.
          </p>
        </div>

        {/* 4 Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHOLESALE_BENEFITS.map((benefit, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#061D17]/80 border border-[#C8A165]/30 hover:border-[#C8A165] transition-all duration-300 space-y-3 shadow-lg flex flex-col justify-between text-left"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#0E3D30] border border-[#C8A165]/40 flex items-center justify-center shadow-inner">
                  {getBenefitIcon(benefit.icon)}
                </div>

                <h3 className="font-cinzel text-lg font-bold text-white leading-snug">
                  {benefit.title}
                </h3>

                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#C8A165]/15 flex items-center gap-1.5 text-[#C8A165] text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified RHC Quality</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
