import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QrCode, X, LogIn, ExternalLink } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { cn } from '../utils/cn';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: Array<{ name: string; path: string; icon: React.ReactNode }>;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, navLinks }) => {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  // Close drawer ONLY when route path actually changes
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      onClose();
    }
  }, [location.pathname, onClose]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-white p-5 shadow-2xl transition ease-in-out duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <QrCode className="h-4 w-4" />
            </div>
            <span className="font-heading text-sm font-bold text-slate-900">QR Attendance</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links Navigation */}
        <div className="mt-4 flex-1 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </p>

          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition active:scale-[0.98]',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <span className={cn(isActive ? 'text-indigo-600' : 'text-slate-400')}>{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100">
            <Link
              to="/login"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In / Login</span>
            </Link>
          </div>
        </div>

        {/* Developer Verification Status Widget at Bottom of Mobile Menu */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-2">
              <span>Environment Status</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </div>
            <ConnectionStatus compact />
          </div>
        </div>
      </div>
    </div>
  );
};
