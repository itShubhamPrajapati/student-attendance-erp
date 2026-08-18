import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QrCode, X, LogIn, LogOut, ExternalLink } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { Badge } from './Badge';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../utils/cn';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: Array<{ name: string; path: string; icon: React.ReactNode }>;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, navLinks }) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
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
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-white dark:bg-slate-900 p-5 shadow-2xl transition ease-in-out duration-200 border-l border-slate-200/80 dark:border-slate-800">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <QrCode className="h-4 w-4" />
            </div>
            <span className="font-heading text-sm font-bold text-slate-900 dark:text-white">QR Attendance</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info If Authenticated */}
        {isAuthenticated && user && (
          <div className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
            </div>
            <Badge
              variant={user.role === 'ADMIN' ? 'info' : user.role === 'TEACHER' ? 'warning' : 'success'}
              className="text-[10px]"
            >
              {user.role}
            </Badge>
          </div>
        )}

        {/* Theme Preference Option */}
        <div className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Theme</span>
          <ThemeToggle variant="pill" />
        </div>

        {/* Links Navigation */}
        <div className="mt-2 flex-1 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1">
            Navigation Menu
          </p>

          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition active:scale-[0.98]',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <span className={cn(isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500')}>{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 active:scale-[0.98] transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-indigo-700 active:scale-[0.98] transition"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In / Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Developer Verification Status Widget */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2">
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
