import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  KeyRound, 
  Sparkles, 
  Store,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { COMPANY_INFO } from '../../data/hardwareData';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface AdminLoginProps {
  onBackToStore?: () => void;
  onSuccessRedirect?: () => void;
}

export function AdminLogin({ onBackToStore, onSuccessRedirect }: AdminLoginProps) {
  const navigate = useNavigate();
  const { loginWithPassword, login } = useHardwareStore();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleBack = () => {
    if (onBackToStore) {
      onBackToStore();
    } else {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!password.trim()) {
      setErrorMessage('Please enter the administrator password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = loginWithPassword(password);
      setIsLoading(false);

      if (res.success) {
        setIsSuccess(true);
        // Explicitly set localStorage isRHCAdmin as required
        try {
          localStorage.setItem('isRHCAdmin', 'true');
        } catch (e) {
          console.warn('Storage setItem failed:', e);
        }

        // On successful authentication
        setTimeout(() => {
          if (onSuccessRedirect) {
            onSuccessRedirect();
          }
        }, 400);
      } else {
        setErrorMessage(res.error || 'Incorrect secret password. Access denied.');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#061D17] text-white flex flex-col justify-between relative overflow-hidden">
      
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#C8A165_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0E3D30] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#C8A165]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between relative z-10">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer border border-white/10"
        >
          <Store className="w-4 h-4 text-[#C8A165]" />
          <span>&larr; Back to Storefront</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[#E0C18B]">
          <ShieldCheck className="w-4 h-4 text-[#C8A165]" />
          <span className="font-mono">RHC SECURE ADMIN ACCESS</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto px-4 py-8 relative z-10">
        
        {/* Card Box */}
        <div className="bg-[#0A2E24] rounded-3xl border-2 border-[#C8A165] p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Brand Emblem & Heading */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0E3D30] to-[#061D17] border-2 border-[#C8A165] mx-auto flex flex-col items-center justify-center shadow-lg shadow-[#C8A165]/20">
              <span className="font-cinzel text-xl font-black tracking-wider text-[#C8A165] leading-none">
                RHC
              </span>
              <span className="text-[8px] font-bold tracking-widest text-[#E0C18B] uppercase">
                ADMIN
              </span>
            </div>

            <div>
              <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white">
                Admin Authentication
              </h1>
              <p className="text-xs text-gray-300 mt-1">
                Enter secret password to unlock product & category controls
              </p>
            </div>
          </div>

          {/* Success Notice */}
          {isSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-900/50 border border-emerald-500/60 flex items-center gap-2.5 text-xs text-emerald-200 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Password verified! Redirecting to storefront...</span>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-900/40 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            
            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-200 block">
                  Secret Admin Password
                </label>
                <button
                  type="button"
                  id="btn-admin-forgot-password"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs font-semibold text-[#E0C18B] hover:text-white hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#C8A165]" />
                  <span>Forgot Password?</span>
                </button>
              </div>
              <div className="relative">
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full bg-[#061D17] border border-[#C8A165]/50 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C8A165] focus:ring-2 focus:ring-[#C8A165]/30 transition-all font-mono"
                />
                <Lock className="w-4 h-4 text-[#C8A165] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-admin-submit-login"
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#C8A165] to-[#E0C18B] hover:from-[#d8b57f] hover:to-[#ebd09f] text-[#0A2E24] font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying Secret Access...</span>
              ) : isSuccess ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0A2E24]" />
                  <span>Access Granted! Redirecting...</span>
                </div>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Unlock Admin Controls</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Quick Help Footer */}
          <div className="pt-2 text-center border-t border-white/10 text-xs text-gray-400 space-y-1">
            <p className="text-gray-300 font-medium">Raffay Hardware Company &bull; 0311-9655243</p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-[11px] text-[#E0C18B] hover:underline"
              >
                Reset Password / Recovery PIN
              </button>
            </div>
            <p className="text-[11px] text-[#E0C18B]/70">Strictly authorized hardware administration personnel only</p>
          </div>

        </div>

      </div>

      {/* Forgot Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccessLogin={() => {
          setIsSuccess(true);
          try {
            localStorage.setItem('isRHCAdmin', 'true');
          } catch (e) {
            console.warn('Storage setItem failed:', e);
          }
          setTimeout(() => {
            if (onSuccessRedirect) {
              onSuccessRedirect();
            } else {
              navigate('/admin');
            }
          }, 300);
        }}
      />

      {/* Bottom Footer */}
      <div className="py-4 text-center text-xs text-gray-500 relative z-10">
        &copy; {new Date().getFullYear()} Raffay Hardware Company (RHC Group). All rights reserved.
      </div>

    </div>
  );
}
