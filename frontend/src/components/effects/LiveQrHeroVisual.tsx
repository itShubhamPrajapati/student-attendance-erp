import React, { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface LiveQrHeroVisualProps {
  className?: string;
  qrUrl?: string;
}

export const LiveQrHeroVisual: React.FC<LiveQrHeroVisualProps> = ({
  className,
  qrUrl,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTapHint, setShowTapHint] = useState(false);

  // Compute public-safe target URL (No session tokens or private keys)
  const targetUrl = useMemo(() => {
    if (qrUrl) return qrUrl;
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}/login`;
    }
    return 'https://lumina.edu/login';
  }, [qrUrl]);

  return (
    <div
      role="region"
      aria-label="Live QR Attendance Hub"
      className={cn(
        'relative w-full max-w-[420px] mx-auto flex flex-col items-center select-none py-2',
        className
      )}
    >
      {/* 1. Ambient QR Atmospheric Glows (Behind QR station) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <div
          className={cn(
            'w-[340px] h-[340px] rounded-full blur-[90px] transition-all duration-500',
            'bg-gradient-to-tr from-[#4648d4]/25 via-[#6b38d4]/20 to-[#006c49]/15',
            isHovered ? 'scale-110 opacity-100' : 'scale-100 opacity-80'
          )}
        />
        {/* Subtle slow rotating verification radar ring */}
        <div className="absolute w-[380px] h-[380px] rounded-full border border-dashed border-indigo-300/30 dark:border-indigo-500/20 animate-radar-slow pointer-events-none" />
        <div className="absolute w-[440px] h-[440px] rounded-full border border-indigo-200/20 dark:border-white/5 pointer-events-none" />
      </div>

      {/* 2. Main Live QR Attendance Station Card */}
      <div
        tabIndex={0}
        role="button"
        aria-label="Live interactive attendance QR code station. Scan with your mobile device."
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        onClick={() => {
          setShowTapHint(true);
          setTimeout(() => setShowTapHint(false), 3000);
        }}
        className={cn(
          'relative w-full rounded-3xl p-5 sm:p-6 transition-all duration-300 ease-out cursor-pointer',
          'bg-white/85 dark:bg-[#111726]/90 backdrop-blur-xl',
          'border border-slate-200/90 dark:border-white/15',
          'shadow-2xl shadow-indigo-950/15 dark:shadow-black/50',
          'outline-hidden focus-visible:ring-2 focus-visible:ring-[#4648d4] focus-visible:ring-offset-2',
          isHovered
            ? 'scale-[1.015] -translate-y-1 border-[#4648d4]/50 dark:border-indigo-500/50 shadow-indigo-500/20'
            : 'scale-100 translate-y-0'
        )}
      >
        {/* Top Header: Live Session Status Pill & Class Context */}
        <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-heading font-bold uppercase tracking-wider">
              Live Session
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="w-3 h-3 text-[#4648d4] dark:text-indigo-400" />
            <span>CS301 &bull; Room 4B</span>
          </div>
        </div>

        {/* Center: QR Viewport with Active Scanning Frame */}
        <div className="relative my-4 flex flex-col items-center justify-center">
          {/* Scanning Container with Corner Accents */}
          <div className="relative p-3.5 sm:p-4 rounded-2xl bg-white shadow-inner border border-slate-100 dark:border-slate-200/20">
            {/* Top-Left Corner Accent */}
            <span className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-[#4648d4] dark:border-indigo-400 rounded-tl-sm transition-all duration-300" />
            {/* Top-Right Corner Accent */}
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-[#4648d4] dark:border-indigo-400 rounded-tr-sm transition-all duration-300" />
            {/* Bottom-Left Corner Accent */}
            <span className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-[#4648d4] dark:border-indigo-400 rounded-bl-sm transition-all duration-300" />
            {/* Bottom-Right Corner Accent */}
            <span className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-[#4648d4] dark:border-indigo-400 rounded-br-sm transition-all duration-300" />

            {/* Subtle Animated Scanning Laser Line */}
            <div className="absolute inset-x-2 z-10 pointer-events-none overflow-hidden h-full top-0">
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#4648d4] to-transparent shadow-[0_0_8px_#6063ee] animate-qr-scan" />
            </div>

            {/* High-Contrast Crisp Black & White QR Code */}
            <div className="relative z-0 p-1">
              <QRCodeSVG
                value={targetUrl}
                size={180}
                level="H"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#0F172A"
                className="w-[160px] h-[160px] sm:w-[190px] sm:h-[190px]"
              />
            </div>
          </div>
        </div>

        {/* Below QR: Live Attendance Telemetry Counter */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading text-2xl sm:text-3xl font-black text-[#131b2e] dark:text-white">
                38
              </span>
              <span className="text-xs font-heading font-bold text-slate-400">/ 50</span>
            </div>
            <span className="text-xs font-heading font-bold text-[#006c49] dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              76% Present
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] font-heading font-semibold text-slate-500 dark:text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
              +4 Late
            </span>
            <span>&bull;</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              8 Remaining
            </span>
          </div>
        </div>

        {/* Bottom Station Footer / Action Prompt */}
        <div className="mt-3 pt-2 text-center">
          <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-[#4648d4] dark:text-indigo-300 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-[#4648d4] dark:text-indigo-400" />
            <span>Scan to Check In</span>
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            Secure &bull; Sub-Second &bull; Tamper-Proof
          </p>
        </div>

        {/* Mobile Tap Toast */}
        {showTapHint && (
          <div className="absolute inset-x-4 -bottom-10 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl text-center shadow-lg animate-in fade-in slide-in-from-top-1 z-30 flex items-center justify-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>Point camera at QR to test live check-in</span>
          </div>
        )}
      </div>

      {/* 3. Floating Live Student Check-In Activity Cards (Surrounding the Hub) */}
      {/* Floating Card 1: Top-Right (Rahul D. - Just Now) */}
      <div className="absolute -top-4 -right-2 sm:-right-6 z-20 hidden sm:flex items-center gap-2.5 p-2.5 pr-3.5 rounded-2xl bg-white/95 dark:bg-[#171f33]/95 border border-slate-200/90 dark:border-white/10 shadow-lg shadow-black/5 animate-float-subtle">
        <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-[#006c49] dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] font-heading">
          RD
        </div>
        <div className="text-left">
          <p className="font-heading font-bold text-xs text-[#131b2e] dark:text-white leading-tight">
            Rahul D. checked in
          </p>
          <p className="text-[10px] text-slate-400 font-mono">Just now &bull; Verified</p>
        </div>
        <CheckCircle2 className="w-4 h-4 text-[#006c49] dark:text-emerald-400 ml-1 flex-shrink-0" />
      </div>

      {/* Floating Card 2: Bottom-Left (Priya S. - 4s ago) */}
      <div className="absolute -bottom-4 -left-2 sm:-left-6 z-20 hidden sm:flex items-center gap-2.5 p-2.5 pr-3.5 rounded-2xl bg-white/95 dark:bg-[#171f33]/95 border border-slate-200/90 dark:border-white/10 shadow-lg shadow-black/5 animate-float-subtle [animation-delay:1.5s]">
        <div className="w-7 h-7 rounded-full bg-indigo-500/15 text-[#4648d4] dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] font-heading">
          PS
        </div>
        <div className="text-left">
          <p className="font-heading font-bold text-xs text-[#131b2e] dark:text-white leading-tight">
            Priya S. checked in
          </p>
          <p className="text-[10px] text-slate-400 font-mono">4s ago &bull; On-Time</p>
        </div>
        <ShieldCheck className="w-4 h-4 text-[#4648d4] dark:text-indigo-400 ml-1 flex-shrink-0" />
      </div>

      {/* Mobile Inline Recent Feed (Visible on small screens where floating cards are hidden) */}
      <div className="sm:hidden w-full mt-3 flex items-center justify-between gap-2 p-2 rounded-xl bg-white/80 dark:bg-[#111726]/80 border border-slate-200/80 dark:border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-heading font-semibold text-slate-700 dark:text-slate-300">
            Rahul D. checked in
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Just now</span>
      </div>
    </div>
  );
};
