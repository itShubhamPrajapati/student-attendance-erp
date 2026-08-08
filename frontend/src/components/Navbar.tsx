import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QrCode, Menu, X, Shield, GraduationCap, School, LogIn, Home } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { MobileMenu } from './MobileMenu';
import { cn } from '../utils/cn';

export const Navbar: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Admin', path: '/admin', icon: <Shield className="w-4 h-4" /> },
    { name: 'Teacher', path: '/teacher', icon: <School className="w-4 h-4" /> },
    { name: 'Student', path: '/student', icon: <GraduationCap className="w-4 h-4" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="group flex items-center gap-2.5 rounded-xl text-slate-900 transition hover:opacity-90"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition group-hover:bg-indigo-700">
                <QrCode className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-base font-bold tracking-tight text-slate-900 leading-tight">
                  QR Attendance
                </span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                  College Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition duration-150',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  )}
                >
                  <span className={cn(isActive ? 'text-indigo-600' : 'text-slate-400')}>{link.icon}</span>
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions & Health Pill */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:block">
              <ConnectionStatus compact />
            </div>

            <Link
              to="/login"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition shadow-sm',
                location.pathname === '/login'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              )}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileOpen((prev) => !prev)}
              aria-label={isMobileOpen ? 'Close Menu' : 'Open Menu'}
              className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition"
            >
              {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileMenu isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} navLinks={navLinks} />
    </>
  );
};
