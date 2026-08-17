import React, { useState, useCallback, Suspense, lazy, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Sparkles, Smartphone } from 'lucide-react';
import { cn } from '../utils/cn';

const FluidGlass = lazy(() =>
  import('./effects/FluidGlass').then((m) => ({ default: m.FluidGlass }))
);

interface HeroDonutQRProps {
  className?: string;
  qrUrl?: string;
}

export const HeroDonutQR: React.FC<HeroDonutQRProps> = ({
  className,
  qrUrl,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  // Compute public-safe target URL once (No secrets, session tokens, or JWTs)
  const targetUrl = useMemo(() => {
    if (qrUrl) return qrUrl;
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}/login`;
    }
    return 'https://lumina.edu/login';
  }, [qrUrl]);

  // Handlers for Desktop Hover, Focus, and Mobile/Tablet Tap
  const handleMouseEnter = useCallback(() => setIsRevealed(true), []);
  const handleMouseLeave = useCallback(() => setIsRevealed(false), []);
  const handleFocus = useCallback(() => setIsRevealed(true), []);
  const handleBlur = useCallback(() => setIsRevealed(false), []);
  const handleToggle = useCallback(() => setIsRevealed((prev) => !prev), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsRevealed((prev) => !prev);
      } else if (e.key === 'Escape' && isRevealed) {
        e.preventDefault();
        setIsRevealed(false);
      }
    },
    [isRevealed]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Interactive campus attendance QR code. Hover or press Enter to reveal."
      aria-expanded={isRevealed}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] lg:w-[350px] lg:h-[350px]',
        'flex items-center justify-center cursor-pointer select-none',
        'outline-hidden focus-visible:ring-2 focus-visible:ring-[#4648d4] focus-visible:ring-offset-4 focus-visible:ring-offset-[#faf8ff] dark:focus-visible:ring-offset-[#090d16] rounded-full',
        className
      )}
    >
      {/* 1. Ambient Glow Layer (Smoothly intensifies on hover) */}
      <div
        className={cn(
          'absolute inset-4 rounded-full pointer-events-none transition-all duration-300 ease-out',
          'bg-gradient-to-tr from-[#4648d4]/20 via-[#6b38d4]/15 to-[#8455ef]/20 blur-2xl',
          isRevealed
            ? 'scale-110 opacity-100 from-[#4648d4]/35 via-[#6b38d4]/25 to-[#8455ef]/35'
            : 'scale-95 opacity-60 group-hover:opacity-90'
        )}
      />

      {/* 2. Donut Glass Structure Layer */}
      <div
        className={cn(
          'relative w-full h-full flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'motion-reduce:transition-none motion-reduce:transform-none',
          isRevealed
            ? 'scale-[1.03] rotate-[2deg]'
            : 'scale-100 rotate-0 group-hover:scale-[1.02] group-hover:rotate-[1deg]'
        )}
      >
        {/* WebGL 3D FluidGlass Torus (Donut) */}
        <div className="absolute inset-0 pointer-events-none opacity-85 dark:opacity-90 transition-opacity duration-200">
          <Suspense
            fallback={
              <div className="w-full h-full rounded-full border-[28px] border-[#4648d4]/20 dark:border-indigo-500/25 animate-pulse" />
            }
          >
            <FluidGlass mode="lens" className="w-full h-full" interactive={false} />
          </Suspense>
        </div>

        {/* Decorative Outer Specular Ring */}
        <div
          className={cn(
            'absolute inset-3 rounded-full border border-indigo-200/50 dark:border-white/10 pointer-events-none transition-all duration-300',
            isRevealed ? 'border-indigo-400/70 dark:border-indigo-400/50 shadow-inner' : 'border-indigo-200/40'
          )}
        />

        {/* Decorative Inner Torus Hole Border */}
        <div
          className={cn(
            'absolute w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] rounded-full border border-indigo-200/60 dark:border-indigo-700/50 pointer-events-none transition-all duration-300',
            isRevealed ? 'border-indigo-400/80 scale-105' : 'border-indigo-200/40 scale-100'
          )}
        />
      </div>

      {/* 3. Centered QR Reveal Overlay */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-220 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'motion-reduce:transition-opacity motion-reduce:transform-none',
          isRevealed
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-[0.92]'
        )}
      >
        {/* High-Contrast White QR Container Card */}
        <div className="relative p-3.5 sm:p-4 rounded-2xl bg-white shadow-2xl shadow-indigo-950/30 border border-slate-200/90 dark:border-white/30 flex flex-col items-center justify-center text-center">
          {/* Top subtle badge */}
          <div className="flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-[10px] font-heading font-bold text-[#4648d4]">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Lumina Live</span>
          </div>

          {/* Crisp QR Code (High contrast black modules on clean white surface) */}
          <div className="p-1 rounded-lg bg-white">
            <QRCodeSVG
              value={targetUrl}
              size={120}
              level="H"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#0F172A"
            />
          </div>

          {/* Label below QR */}
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-700 mt-1.5 flex items-center gap-1">
            Scan to Explore
          </span>
        </div>
      </div>

      {/* 4. Default State Idle Hint (Fades out when revealed) */}
      <div
        className={cn(
          'absolute bottom-2 inset-x-0 mx-auto flex items-center justify-center gap-1.5 text-[11px] font-heading font-medium text-slate-500 dark:text-slate-400 pointer-events-none transition-opacity duration-200',
          isRevealed ? 'opacity-0' : 'opacity-80 group-hover:opacity-100'
        )}
      >
        <Smartphone className="w-3.5 h-3.5 text-[#4648d4] dark:text-indigo-400" />
        <span className="hidden sm:inline">Hover to reveal QR</span>
        <span className="sm:hidden">Tap to reveal QR</span>
      </div>
    </div>
  );
};
