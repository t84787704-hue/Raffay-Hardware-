import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, ShieldCheck, KeyRound, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export function SimpleAdminLogin() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const navigate = useNavigate();
  const { loginWithPassword } = useHardwareStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPass = password.trim();
    const res = loginWithPassword(cleanPass);

    if (res.success) {
      setAlertSuccess(true);
      
      // Trigger native alert and navigation as specified
      try {
        window.alert('Admin Login Success');
      } catch (e) {
        // In iframe where alert might be blocked
      }

      setTimeout(() => {
        navigate('/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 200);
    } else {
      setError(res.error || 'Invalid password. Access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-[#061D17] text-white flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0E3D30] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#C8A165]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <div className="absolute top-6 left-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer border border-white/10"
        >
          <ArrowLeft className="w-4 h-4 text-[#C8A165]" />
          <span>Back to Store</span>
        </button>
      </div>

      {/* Alert Success Banner */}
      {alertSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm shadow-xl flex items-center gap-3 border border-emerald-400">
          <ShieldCheck className="w-5 h-5" />
          <span>Admin Login Success - Redirecting to Store...</span>
        </div>
      )}

      {/* Simple Login Card */}
      <div className="max-w-md w-full rounded-3xl bg-[#0A2E24] border-2 border-[#C8A165] p-8 shadow-2xl space-y-6 text-left relative z-10">
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#0E3D30] border-2 border-[#C8A165] text-[#C8A165] flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="font-cinzel text-2xl font-extrabold text-[#E0C18B]">
            Admin Access Portal
          </h2>
          <p className="text-gray-300 text-xs">
            Enter the secret administrator password to unlock management controls.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-900/60 border border-red-500/50 text-red-200 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#E0C18B] uppercase tracking-wider">
                Secret Password
              </label>
              <button
                type="button"
                id="btn-simple-forgot-password"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-xs font-semibold text-[#E0C18B] hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#C8A165]" />
                <span>Forgot Password?</span>
              </button>
            </div>
            <div className="relative">
              <input
                id="admin-login-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                required
                autoFocus
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#0E3D30] border border-[#C8A165]/50 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-[#E0C18B] focus:ring-1 focus:ring-[#E0C18B]"
              />
              <KeyRound className="w-4 h-4 text-[#C8A165] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="btn-admin-login-submit"
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-[#C8A165] hover:bg-[#E0C18B] text-[#0A2E24] font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer border border-[#E0C18B]"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Login as Administrator</span>
          </button>
        </form>

        <div className="pt-2 text-center flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setIsForgotPasswordOpen(true)}
            className="text-xs text-[#E0C18B] hover:underline"
          >
            Forgot or lost password? Click to Reset
          </button>
          <span className="text-[11px] text-gray-400">
            RHC Hardware Group Wholesale &bull; Authorized Personnel Only
          </span>
        </div>

      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccessLogin={() => {
          navigate('/');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

    </div>
  );
}

