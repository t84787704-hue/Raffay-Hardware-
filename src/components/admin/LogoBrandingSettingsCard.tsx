import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  UploadCloud, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Sparkles,
  ShieldCheck,
  Check,
  RefreshCw
} from 'lucide-react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { compressLogoFile } from '../../firebase/brandingService';

interface LogoBrandingSettingsCardProps {
  onViewStorefront?: () => void;
}

export function LogoBrandingSettingsCard({ onViewStorefront }: LogoBrandingSettingsCardProps) {
  const { logoUrl, activeLogoUrl, updateLogo, resetLogo, isLogoLoading } = useHardwareStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection from disk
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setStatusMessage(null);
      
      const { base64, sizeFormatted } = await compressLogoFile(file);
      setSelectedFile(file);
      setPreviewUrl(base64);
      setPreviewSize(sizeFormatted);
      setStatusMessage({
        type: 'success',
        text: `✓ Logo loaded (${sizeFormatted}). Click "Save & Publish Logo" to apply.`
      });
    } catch (err: any) {
      console.error('Logo upload preparation error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to process selected logo image.'
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle saving logo to Firestore settings/branding
  const handleSaveLogo = async () => {
    if (!previewUrl) {
      setStatusMessage({
        type: 'error',
        text: 'Please select a logo image first.'
      });
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage(null);
      await updateLogo(previewUrl);
      setStatusMessage({
        type: 'success',
        text: '✓ New website logo saved to Firestore & live on all devices!'
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      console.error('Error saving logo to Firestore:', err);
      setStatusMessage({
        type: 'error',
        text: `Failed to save logo: ${err?.message || 'Firestore error'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle resetting logo to default circular RHC logo
  const handleResetToDefault = async () => {
    const confirmReset = window.confirm('Are you sure you want to reset the website logo to the default RHC circular logo?');
    if (!confirmReset) return;

    try {
      setIsSaving(true);
      setStatusMessage(null);
      await resetLogo();
      setSelectedFile(null);
      setPreviewUrl(null);
      setStatusMessage({
        type: 'success',
        text: '✓ Website logo reset to default RHC circular emblem.'
      });
    } catch (err: any) {
      console.error('Error resetting logo:', err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to reset logo. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const displayedLogo = previewUrl || activeLogoUrl;
  const isCustomLogoActive = Boolean(logoUrl);

  return (
    <div id="logo-branding-settings-card" className="p-5 sm:p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-6 text-left">
      
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0A2E24] text-[#C8A165] flex items-center justify-center flex-shrink-0 shadow-sm">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[#0A2E24]">
                Website Logo Settings
              </h2>
              <p className="text-xs text-gray-500">
                Customize your store logo. Upload your business brand emblem (.png, .jpg, .webp) &ndash; automatically fits a 48px circle on all mobiles &amp; desktops.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCustomLogoActive && (
            <button
              id="btn-reset-default-logo"
              disabled={isSaving}
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer border border-gray-300 disabled:opacity-50"
              title="Reset back to default RHC circular logo"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
              <span>Reset to Default</span>
            </button>
          )}

          <button
            id="btn-preview-logo-header"
            onClick={() => setShowLivePreviewModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0A2E24] text-[#E0C18B] hover:bg-[#124A3B] text-xs font-bold transition-colors cursor-pointer border border-[#C8A165]/50 shadow-sm"
            title="Preview how logo looks inside customer header"
          >
            <Eye className="w-3.5 h-3.5 text-[#C8A165]" />
            <span>Preview in Header</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Upload Controls & Live Header Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: File Upload Area (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <input
            ref={fileInputRef}
            id="input-logo-file"
            type="file"
            accept=".png, .jpg, .jpeg, .webp, .svg"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload Dropzone Box */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              previewUrl 
                ? 'border-[#C8A165] bg-amber-50/40' 
                : 'border-gray-300 hover:border-[#0A2E24] bg-gray-50/60 hover:bg-gray-50'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#0A2E24]/10 text-[#0A2E24] flex items-center justify-center">
              {isProcessing ? (
                <RefreshCw className="w-6 h-6 text-[#C8A165] animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6 text-[#C8A165]" />
              )}
            </div>

            <div>
              <span className="text-xs sm:text-sm font-extrabold text-[#0A2E24] block">
                {previewUrl ? 'Choose Another Image' : 'Click to Upload New Logo'}
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Supports PNG (with transparency), JPG, JPEG, WEBP (Max 2MB)
              </p>
            </div>

            <button
              type="button"
              className="px-4 py-1.5 rounded-xl bg-[#0A2E24] text-[#E0C18B] font-bold text-xs pointer-events-none shadow"
            >
              Upload New Logo
            </button>
          </div>

          {/* Action Buttons if new image chosen */}
          {previewUrl && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-amber-900 font-semibold">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>New logo ready ({previewSize || 'Optimized'})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setStatusMessage(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  id="btn-save-logo-firestore"
                  disabled={isSaving}
                  onClick={handleSaveLogo}
                  className="px-4 py-1.5 rounded-xl bg-[#0A2E24] text-[#E0C18B] hover:bg-[#124A3B] border border-[#C8A165] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#C8A165]" />
                      <span>Save &amp; Publish Logo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 font-semibold ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Info Bullet Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-500 pt-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Saved in Firestore doc: <code className="font-mono text-gray-700">settings/branding</code></span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Standard 48px circle, no stretching</span>
            </div>
          </div>

        </div>

        {/* Right Column: Live Header Simulation (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-700">
            <span>Live Header Simulation</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              previewUrl 
                ? 'bg-amber-100 text-amber-800' 
                : isCustomLogoActive 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-gray-100 text-gray-600'
            }`}>
              {previewUrl ? 'Previewing New Logo' : isCustomLogoActive ? 'Custom Logo Active' : 'Default RHC Logo'}
            </span>
          </div>

          {/* Simulated Dark Green Customer Header Bar */}
          <div className="p-4 rounded-2xl bg-[#0E3B2E] border-2 border-[#C8A165] shadow-lg text-white space-y-3">
            
            <div className="text-[9px] uppercase tracking-wider font-extrabold text-[#C8A165] flex items-center justify-between border-b border-white/10 pb-2">
              <span>Customer Header Preview</span>
              <span className="font-mono">Height: 70px Fixed</span>
            </div>

            {/* Simulated Header row */}
            <div className="flex items-center gap-3 py-1">
              {/* Circular Logo 48px x 48px */}
              <div 
                style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                className="relative overflow-hidden flex-shrink-0 bg-[#0A2E24] shadow-md flex items-center justify-center"
              >
                <img
                  src={displayedLogo}
                  alt="Simulated Logo"
                  referrerPolicy="no-referrer"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                  className="w-12 h-12 rounded-full block"
                />
              </div>

              {/* Title Next to it */}
              <div className="min-w-0">
                <span className="font-cinzel text-sm sm:text-[15px] font-bold text-white tracking-wide block leading-tight whitespace-nowrap">
                  RAFFAY HARDWARE COMPANY
                </span>
                <span className="text-[10px] text-[#C8A165] font-semibold block">
                  Wholesale Hardware Store
                </span>
              </div>
            </div>

            {/* Simulated Search bar below */}
            <div className="pt-1">
              <div className="w-full bg-[#061D17] border border-[#C8A165]/40 rounded-lg px-3 py-1.5 text-[11px] text-gray-400 flex items-center justify-between">
                <span>Search categories, products &amp; SKUs...</span>
                <div className="w-3.5 h-3.5 rounded-full bg-[#C8A165]/30" />
              </div>
            </div>

          </div>

          <p className="text-[10px] text-gray-400 text-center">
            Exact 48px x 48px circle display with <code className="font-mono text-gray-600">object-fit: cover</code>.
          </p>

        </div>

      </div>

      {/* Live Preview Modal Overlay */}
      {showLivePreviewModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowLivePreviewModal(false)}
        >
          <div 
            className="w-full max-w-2xl bg-[#0A2E24] text-white border-2 border-[#C8A165] rounded-3xl p-6 shadow-2xl space-y-6 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#C8A165]/30 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#C8A165]" />
                <h3 className="font-cinzel text-lg font-bold text-white">
                  Header Logo Full View
                </h3>
              </div>
              <button 
                onClick={() => setShowLivePreviewModal(false)}
                className="text-gray-400 hover:text-white text-sm font-bold px-2 py-1"
              >
                &times; Close
              </button>
            </div>

            {/* High-res Logo Demonstration */}
            <div className="bg-[#0E3B2E] p-6 rounded-2xl border border-[#C8A165]/40 flex flex-col items-center justify-center gap-4">
              <div 
                style={{ width: '96px', height: '96px', borderRadius: '50%' }}
                className="rounded-full shadow-2xl overflow-hidden border-2 border-[#C8A165] flex items-center justify-center bg-[#061D17]"
              >
                <img
                  src={displayedLogo}
                  alt="High Resolution Logo"
                  referrerPolicy="no-referrer"
                  style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover' }}
                  className="w-24 h-24 rounded-full"
                />
              </div>

              <div className="text-center">
                <span className="font-cinzel text-xl font-bold text-white block">
                  RAFFAY HARDWARE COMPANY
                </span>
                <span className="text-xs text-[#E0C18B]">
                  Live header branding simulation
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLivePreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
              {onViewStorefront && (
                <button
                  type="button"
                  onClick={() => {
                    setShowLivePreviewModal(false);
                    onViewStorefront();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#C8A165] text-[#0A2E24] hover:bg-[#E0C18B] text-xs font-extrabold cursor-pointer shadow"
                >
                  Go to Live Storefront
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
