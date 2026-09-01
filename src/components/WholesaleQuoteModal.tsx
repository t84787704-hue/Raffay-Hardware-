import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Send, 
  FileSpreadsheet, 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Sparkles,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { COMPANY_INFO, CATEGORIES } from '../data/hardwareData';
import { InquiryItem } from '../types';

interface WholesaleQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiryItems: InquiryItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearAll: () => void;
}

export function WholesaleQuoteModal({
  isOpen,
  onClose,
  inquiryItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearAll
}: WholesaleQuoteModalProps) {
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCategoryInterest, setSelectedCategoryInterest] = useState('All Kinds of Hardware');
  const [customRequirements, setCustomRequirements] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inquiryRef, setInquiryRef] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const refCode = `RHC-INQ-${Math.floor(100000 + Math.random() * 900000)}`;
    setInquiryRef(refCode);
    setIsSubmitted(true);
  };

  const handleCopyQuote = () => {
    let itemsList = '';
    if (inquiryItems.length > 0) {
      itemsList = inquiryItems
        .map(
          (item, idx) =>
            `${idx + 1}. ${item.product.name} (SKU: ${item.product.sku}) - Qty: ${item.quantity} units - Material: ${item.product.material}`
        )
        .join('\n');
    } else {
      itemsList = `Category Interest: ${selectedCategoryInterest}`;
    }

    const text = `WHOLESALE INQUIRY - RAFFAY HARDWARE (RHC GROUP)\nRef: ${inquiryRef}\nBusiness: ${businessName}\nContact: ${contactPerson} (${phone})\nCity: ${city}\n\nItems:\n${itemsList}\n\nNotes: ${customRequirements || 'Standard wholesale inquiry'}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="quote-inquiry-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border-2 border-[#C8A165] shadow-2xl overflow-hidden text-left my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#0A2E24] text-white p-5 sm:p-6 border-b border-[#C8A165]/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-cinzel font-black text-[#C8A165] text-lg">RHC GROUP</span>
              <span className="text-[#C8A165]/50">|</span>
              <span className="text-xs text-gray-300 uppercase tracking-wider font-semibold">Bulk Rate Request</span>
            </div>
            <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white">
              WHOLESALE INQUIRY BUILDER
            </h3>
          </div>

          <button
            onClick={() => {
              setIsSubmitted(false);
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-lg"
          >
            &times;
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h4 className="font-cinzel text-2xl font-extrabold text-[#0A2E24]">
                Inquiry Generated Successfully!
              </h4>
              <p className="text-sm text-gray-600">
                Reference ID: <span className="font-mono font-bold text-[#0A2E24] px-2 py-0.5 bg-[#F4F7F5] border border-gray-300 rounded">{inquiryRef}</span>
              </p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Your wholesale requirements for <strong>{businessName || 'your business'}</strong> ({city}) have been prepared. Call our wholesale desk on <strong>{COMPANY_INFO.phone}</strong> or quote this reference for instant dispatch rates.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-gray-200 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500 font-semibold">Wholesale Desk Hotline:</span>
                <span className="font-bold text-[#0A2E24]">{COMPANY_INFO.phone}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-gray-500 font-semibold">Total Items Selected:</span>
                <span className="font-bold text-[#0A2E24]">{inquiryItems.length} Products</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Warehouse Depot:</span>
                <span className="font-bold text-gray-800">{COMPANY_INFO.address}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyQuote}
                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer border border-gray-300"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#C8A165]" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Inquiry Summary'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  onClearAll();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-[#0A2E24] text-[#E0C18B] hover:bg-[#124A3B] font-bold text-xs transition-colors cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Modal Body */
          <form onSubmit={handleSubmitQuote} className="p-6 sm:p-8 space-y-6">
            
            {/* Selected Items Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#0A2E24] flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#C8A165]" />
                  <span>Selected Hardware Items ({inquiryItems.length})</span>
                </h4>
                {inquiryItems.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {inquiryItems.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#F4F7F5] border border-gray-200 text-xs text-gray-600 space-y-2">
                  <p className="font-medium text-gray-800">No specific SKUs selected yet.</p>
                  <p>You can choose your primary category of interest below, or browse the catalog to add specific items.</p>
                  <select
                    value={selectedCategoryInterest}
                    onChange={(e) => setSelectedCategoryInterest(e.target.value)}
                    className="w-full mt-2 p-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-[#0A2E24]"
                  >
                    <option value="All Kinds of Hardware">All Kinds of Hardware Items</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {inquiryItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-xl bg-[#F8FAF9] border border-gray-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#0A2E24] truncate">{item.product.name}</p>
                        <p className="text-[11px] text-gray-500 font-mono">
                          SKU: {item.product.sku} &bull; {item.product.material}
                        </p>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center justify-center font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-bold text-xs w-6 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center justify-center font-bold cursor-pointer"
                        >
                          +
                        </button>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.product.id)}
                          className="p-1 text-red-500 hover:text-red-700 ml-1 cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buyer Details Grid */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-sm text-[#0A2E24] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#C8A165]" />
                <span>Your Business / Contact Details</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Hardware Store / Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Al-Madina Hardware / Royal Builders"
                    className="w-full p-2.5 bg-[#F8FAF9] border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#0A2E24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Muhammad Raffay"
                    className="w-full p-2.5 bg-[#F8FAF9] border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#0A2E24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore, Karachi, Rawalpindi, Peshawar"
                    className="w-full p-2.5 bg-[#F8FAF9] border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#0A2E24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone / Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0300-1234567"
                    className="w-full p-2.5 bg-[#F8FAF9] border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#0A2E24]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Custom Specifications / Finish Requirements (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customRequirements}
                  onChange={(e) => setCustomRequirements(e.target.value)}
                  placeholder="Mention required finishes (Antique brass, Matt black, Chrome), carton quantities, or urgent delivery date."
                  className="w-full p-2.5 bg-[#F8FAF9] border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#0A2E24]"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Direct wholesale distribution &bull; Pan-Pakistan cargo freight</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  id="btn-submit-wholesale-quote"
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#0A2E24] text-[#E0C18B] border border-[#C8A165] font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-[#124A3B] hover:shadow-lg transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4 text-[#C8A165]" />
                  <span>Submit Wholesale Request</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
