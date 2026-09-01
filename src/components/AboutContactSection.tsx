import React from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  Mail, 
  ShieldCheck, 
  Truck, 
  Sparkles, 
  CheckCircle2,
  PackageCheck
} from 'lucide-react';
import { COMPANY_INFO, CATEGORIES } from '../data/hardwareData';

export function AboutContactSection() {
  return (
    <section id="about" className="py-16 sm:py-20 bg-[#E8D5B7] border-b border-[#D8C4A5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* Left Column: About RHC Group */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0A2E24] text-[#C8A165] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ABOUT RAFFAY HARDWARE COMPANY</span>
            </div>

            <h2 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0A2E24] leading-tight">
              RHC GROUP: TRUSTED HARDWARE WHOLESALE SINCE {COMPANY_INFO.establishedYear}
            </h2>

            <div className="space-y-4 text-gray-800 text-sm sm:text-base leading-relaxed">
              <p>
                <strong>Raffay Hardware Company (RHC Group)</strong> is a pioneer in Pakistan’s architectural hardware landscape. We specialize in importing, precision casting, and bulk wholesale distribution of superior quality door locks, full die-cast handles, heavy metal fittings, brass master pull handles, kitchen storage systems, and China designer cabinet handles.
              </p>
              <p>
                Our rigorous quality assurance ensures high tensile load capacity, zero porosity in Zamak die-cast alloys, ultra-smooth ball-bearing action, and corrosion-resistant multi-layer electroplating engineered for decades of reliability.
              </p>
            </div>

            {/* Core commitments grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#DCC9A8] border border-[#C5B08F] shadow-sm flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-[#0A2E24] text-[#C8A165] flex-shrink-0">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0A2E24]">Strict QC Batch Testing</h4>
                  <p className="text-[11px] text-gray-700">Every carton inspected for finish consistency and smooth bearing spin.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#DCC9A8] border border-[#C5B08F] shadow-sm flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-[#0A2E24] text-[#C8A165] flex-shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0A2E24]">Pan-Pakistan Cargo Freight</h4>
                  <p className="text-[11px] text-gray-700">Daily bookings via reliable cargo logistics for all cities and towns.</p>
                </div>
              </div>
            </div>

            {/* Direct Phone Line */}
            <div className="pt-2">
              <a
                href={`tel:${COMPANY_INFO.phone}`}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#0A2E24] text-[#E0C18B] border border-[#C8A165] font-extrabold text-sm hover:bg-[#124A3B] hover:shadow-lg transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4 text-[#C8A165]" />
                <span>Call Sales Desk: {COMPANY_INFO.phone}</span>
              </a>
            </div>

          </div>

          {/* Right Column: Store & Contact Card */}
          <div id="contact" className="lg:col-span-5">
            <div className="rounded-3xl bg-[#0A2E24] border-2 border-[#C8A165] p-6 sm:p-8 text-white shadow-2xl space-y-6 text-left relative overflow-hidden">
              
              {/* Gold Top Accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#A98042] via-[#C8A165] to-[#E0C18B]" />

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#C8A165] uppercase tracking-wider">
                  DIRECT WHOLESALE DESK
                </span>
                <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white">
                  CONTACT & WAREHOUSE
                </h3>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">

                {/* Direct Phone Call */}
                <a
                  href={`tel:${COMPANY_INFO.phone}`}
                  className="p-3.5 rounded-xl bg-[#061D17] border border-[#C8A165]/30 flex items-center gap-3.5 hover:border-[#C8A165] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#0E3D30] text-[#C8A165] flex items-center justify-center flex-shrink-0 border border-[#C8A165]/40">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#C8A165]">Direct Calling Phone</p>
                    <p className="font-bold text-base text-white group-hover:text-[#E0C18B] transition-colors">
                      {COMPANY_INFO.phone}
                    </p>
                  </div>
                </a>

                {/* Warehouse Location */}
                <div className="p-3.5 rounded-xl bg-[#061D17] border border-[#C8A165]/20 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#0E3D30] text-[#C8A165] flex items-center justify-center flex-shrink-0 border border-[#C8A165]/40 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#C8A165]">Wholesale Depot Location</p>
                    <p className="text-gray-200 text-xs leading-relaxed">
                      {COMPANY_INFO.address}
                    </p>
                  </div>
                </div>

                {/* Timing */}
                <div className="p-3.5 rounded-xl bg-[#061D17] border border-[#C8A165]/20 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#0E3D30] text-[#C8A165] flex items-center justify-center flex-shrink-0 border border-[#C8A165]/40">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#C8A165]">Wholesale Order Booking Hours</p>
                    <p className="text-gray-200 text-xs">
                      {COMPANY_INFO.workingHours} (Cargo dispatched daily)
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
