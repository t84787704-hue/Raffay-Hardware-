import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Phone, 
  Mail, 
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { COMPANY_INFO } from '../../data/hardwareData';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose, onSuccessLogin }: ForgotPasswordModalProps) {
  const { verifyRecoveryPin, resetAdminPassword, loginWithPassword, adminCredentialsInfo } = useHardwareStore();

  const [step, setStep] = useState<'verify' | 'reset' | 'success'>('verify');
  const [identifier, setIdentifier] = useState(adminCredentialsInfo.email);
  const [recoveryPin, setRecoveryPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [savedPassword, setSavedPassword] = useState('');

  if (!isOpen) return null;

  const handleResetModalState = () => {
    setStep('verify');
    setRecoveryPin('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setIsCopied(false);
    onClose();
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your admin email, username, or registered phone number.');
      return;
    }

    if (!recoveryPin.trim()) {
      setErrorMsg('Please enter the security recovery PIN (Master PIN: 786965).');
      return;
    }

    const res = verifyRecoveryPin(identifier, recoveryPin);
    if (res.success) {
      setStep('reset');
      setErrorMsg('');
    } else {
      setErrorMsg(res.error || 'Verification failed. Please check your credentials or PIN.');
    }
  };

  const handleGenerateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let pass = 'RHC#';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += '!2026';
    setNewPassword(pass);
    setConfirmPassword(pass);
  };

  const handleSetNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword.trim()) {
      setErrorMsg('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    const res = resetAdminPassword(newPassword);
    if (res.success) {
      setSavedPassword(newPassword);
      setStep('success');
      setErrorMsg('');
    } else {
      setErrorMsg(res.message || 'Failed to update password.');
    }
  };

  const handleCopyPassword = () => {
    if (!savedPassword) return;
    navigator.clipboard.writeText(savedPassword);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleInstantLogin = () => {
    if (savedPassword) {
      loginWithPassword(savedPassword);
    }
    handleResetModalState();
    if (onSuccessLogin) {
      onSuccessLogin();
    }
  };

  const handleWhatsAppHelp = () => {
    const text = encodeURIComponent(
      `Hello RHC Admin Support, I need password recovery assistance for the RHC Hardware Administrator Portal.`
    );
    window.open(`https://wa.me/923119655243?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0A2E24] border-2 border-[#C8A165] rounded-3xl shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0E3D30]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#061D17] border border-[#C8A165] flex items-center justify-center text-[#C8A165]">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-cinzel text-base font-bold text-[#E0C18B]">
                Admin Password Recovery
              </h3>
              <p className="text-[11px] text-gray-300">
                Raffay Hardware Company &bull; Secure Reset
              </p>
            </div>
          </div>
          <button
            onClick={handleResetModalState}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Step 1: Verification */}
          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4 text-left">
              <div className="p-3.5 rounded-xl bg-[#061D17]/80 border border-[#C8A165]/30 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#E0C18B]">
                  <ShieldCheck className="w-4 h-4 text-[#C8A165]" />
                  <span>Step 1 of 2: Security Verification</span>
                </div>
                <p className="text-xs text-gray-300">
                  Verify identity using registered administrator email or phone, plus security PIN.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/50 flex items-center gap-2 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Identifier Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-200">
                  Admin Email / Username / Phone
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. admin@rhchardware.com or 0311-9655243"
                    className="w-full bg-[#061D17] border border-[#C8A165]/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E0C18B]"
                    required
                  />
                  <Mail className="w-4 h-4 text-[#C8A165] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* PIN Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-200">
                    Security Recovery PIN
                  </label>
                  <span className="text-[11px] text-[#C8A165]">
                    Master PIN: <strong className="font-mono">786965</strong>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value)}
                    placeholder="Enter PIN (e.g. 786965)"
                    maxLength={10}
                    className="w-full bg-[#061D17] border border-[#C8A165]/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#E0C18B]"
                    required
                  />
                  <Lock className="w-4 h-4 text-[#C8A165] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Quick autofill PIN button */}
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier(adminCredentialsInfo.email);
                    setRecoveryPin(adminCredentialsInfo.recoveryPin);
                  }}
                  className="text-[11px] text-[#E0C18B] hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#C8A165]" />
                  <span>Autofill Default Owner Credentials</span>
                </button>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetModalState}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#C8A165] to-[#E0C18B] text-[#0A2E24] font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg hover:opacity-95 cursor-pointer"
                >
                  <span>Verify & Proceed</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* WhatsApp Instant Help */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                <span>Need immediate support?</span>
                <button
                  type="button"
                  onClick={handleWhatsAppHelp}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-700/60 hover:bg-emerald-600 text-emerald-200 text-xs font-medium border border-emerald-500/40 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                  <span>WhatsApp Owner (0311-9655243)</span>
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Set New Password */}
          {step === 'reset' && (
            <form onSubmit={handleSetNewPassword} className="space-y-4 text-left">
              <div className="p-3.5 rounded-xl bg-[#061D17]/80 border border-[#C8A165]/30 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#E0C18B]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Step 2 of 2: Create New Admin Password</span>
                </div>
                <p className="text-xs text-gray-300">
                  Verification succeeded for <strong className="text-white">{identifier}</strong>. Set a new password below.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/50 flex items-center gap-2 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-200">
                    New Secret Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateStrongPassword}
                    className="text-[11px] text-[#C8A165] hover:text-[#E0C18B] font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Strong Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password..."
                    className="w-full bg-[#061D17] border border-[#C8A165]/50 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#E0C18B]"
                    required
                    autoFocus
                  />
                  <Lock className="w-4 h-4 text-[#C8A165] absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-200">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password..."
                    className="w-full bg-[#061D17] border border-[#C8A165]/50 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#E0C18B]"
                    required
                  />
                  <Lock className="w-4 h-4 text-[#C8A165] absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('verify')}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#C8A165] to-[#E0C18B] text-[#0A2E24] font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg hover:opacity-95 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save & Apply New Password</span>
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success Confirmation */}
          {step === 'success' && (
            <div className="space-y-5 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-900/60 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/40 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-cinzel text-xl font-bold text-[#E0C18B]">
                  Password Updated Successfully!
                </h4>
                <p className="text-xs text-gray-300 mt-1 max-w-sm mx-auto">
                  Your new administrator secret password is now active. Please save it securely.
                </p>
              </div>

              {/* Password Display Box */}
              <div className="p-4 rounded-2xl bg-[#061D17] border-2 border-[#C8A165] space-y-2 text-left">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Your Active Admin Password:</span>
                  <button
                    onClick={handleCopyPassword}
                    className="inline-flex items-center gap-1 text-[#C8A165] hover:text-[#E0C18B] font-semibold text-xs cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Password</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-base font-bold text-[#E0C18B] tracking-wider select-all break-all bg-black/40 p-2.5 rounded-lg border border-white/10">
                  {savedPassword}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleInstantLogin}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#C8A165] to-[#E0C18B] hover:from-[#d8b57f] hover:to-[#ebd09f] text-[#0A2E24] font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Login to Admin Panel Now</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
