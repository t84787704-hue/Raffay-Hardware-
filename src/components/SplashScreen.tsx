import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHardwareStore } from '../context/HardwareStoreContext';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const { activeLogoUrl } = useHardwareStore();

  useEffect(() => {
    const duration = 2500; // 2.5 seconds auto transition to homepage

    const completeTimeout = setTimeout(() => {
      try {
        sessionStorage.setItem('rhc_intro_shown', 'true');
      } catch (e) {
        console.error('Failed to set sessionStorage rhc_intro_shown:', e);
      }
      onComplete();
    }, duration);

    return () => {
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        id="rhc-splash-screen"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
        style={{ backgroundColor: '#0F2E26' }}
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center h-screen w-screen text-white overflow-hidden select-none"
      >
        {/* Background subtle dotted pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute inset-0 opacity-10" 
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #C8A165 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }} 
          />
        </div>

        {/* Center Content: Circular Logo + White Name directly together */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto">
          
          {/* 1. Circular High-Res Logo (180px x 180px, object-fit contain, rounded-full, not stretched) */}
          <div className="flex items-center justify-center">
            <div 
              style={{ width: '180px', height: '180px', borderRadius: '50%', aspectRatio: '1/1' }}
              className="w-[180px] h-[180px] rounded-full bg-[#0A2E24] border-2 border-[#C8A165] flex items-center justify-center shadow-2xl overflow-hidden p-2 flex-shrink-0"
            >
              <img
                src={activeLogoUrl || '/logo-v2.png'}
                alt="RHC Group Logo"
                referrerPolicy="no-referrer"
                style={{ width: '165px', height: '165px', objectFit: 'contain', aspectRatio: '1/1', borderRadius: '50%' }}
                className="w-[165px] h-[165px] object-contain rounded-full block"
              />
            </div>
          </div>

          {/* 2. White Brand Name below logo (20px gap, clamp(20px, 5vw, 28px), letterSpacing: 1px, font-weight: 600, color: white) */}
          <h1
            style={{
              marginTop: '20px',
              fontSize: 'clamp(20px, 5vw, 28px)',
              letterSpacing: '1px',
              fontWeight: 600,
              color: '#FFFFFF',
              lineHeight: 1.25,
              maxWidth: '90vw',
              wordWrap: 'break-word',
              whiteSpace: 'normal'
            }}
            className="font-cinzel tracking-wide text-white text-center"
          >
            RAFFAY HARDWARE COMPANY
          </h1>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}


