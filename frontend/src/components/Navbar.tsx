import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QrCode, Menu, X, Shield, GraduationCap, School, LogIn, LogOut, Home, Users, BookOpen, Building2, UserCheck2, Calendar, TrendingUp, Search, User } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { MobileMenu } from './MobileMenu';
import { Badge } from './Badge';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../utils/cn';

export const Navbar: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const getNavLinks = () => {
    if (!isAuthenticated || !user) {
      return [
        { name: 'Home', path: '/', icon: <Home className="w-4 h-4" /> },
        { name: 'Admin', path: '/admin', icon: <Shield className="w-4 h-4" /> },
        { name: 'Teacher', path: '/teacher', icon: <School className="w-4 h-4" /> },
        { name: 'Student', path: '/student', icon: <GraduationCap className="w-4 h-4" /> },
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        { name: 'Dashboard', path: '/admin', icon: <Shield className="w-4 h-4" /> },
        { name: 'Students', path: '/admin/students', icon: <Users className="w-4 h-4" /> },
        { name: 'Teachers', path: '/admin/teachers', icon: <School className="w-4 h-4" /> },
        { name: 'Subjects', path: '/admin/subjects', icon: <BookOpen className="w-4 h-4" /> },
        { name: 'Classes', path: '/admin/classes', icon: <Building2 className="w-4 h-4" /> },
        { name: 'Assignments', path: '/admin/assignments', icon: <UserCheck2 className="w-4 h-4" /> },
      ];
    }

    if (user.role === 'TEACHER') {
      return [
        { name: 'Teacher Portal', path: '/teacher', icon: <School className="w-4 h-4" /> },
        { name: 'Sessions', path: '/teacher/attendance/history', icon: <Calendar className="w-4 h-4" /> },
        { name: 'Student Search', path: '/teacher/students/search', icon: <Search className="w-4 h-4" /> },
        { name: 'Analytics & Insights', path: '/teacher/attendance/analytics', icon: <TrendingUp className="w-4 h-4" /> },
        { name: 'My Profile', path: '/teacher/profile', icon: <User className="w-4 h-4" /> },
      ];
    }

    return [
      { name: 'Student Portal', path: '/student', icon: <GraduationCap className="w-4 h-4" /> },
      { name: 'My Profile', path: '/student/profile', icon: <User className="w-4 h-4" /> },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-white/10 bg-[#faf8ff]/85 dark:bg-[#090d16]/85 backdrop-blur-xl transition-colors shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="group flex items-center gap-2.5 rounded-xl text-[#131b2e] dark:text-white transition hover:opacity-90"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4648d4] text-white shadow-xs transition group-hover:bg-[#383ab6]">
                <QrCode className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-base font-bold tracking-tight text-[#131b2e] dark:text-white leading-tight">
                  AttendancePro
                </span>
                <span className="text-[10px] font-semibold text-[#464554] dark:text-slate-400 tracking-wider uppercase font-heading">
                  Lumina Academic
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium font-heading transition duration-150',
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#4648d4] dark:text-indigo-300 font-bold shadow-xs'
                      : 'text-[#464554] dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-[#131b2e] dark:hover:text-white'
                  )}
                >
                  <span className={cn(isActive ? 'text-[#4648d4] dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500')}>{link.icon}</span>
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions & Auth Status */}
          <div className="flex items-center gap-2.5">
            <div className="hidden lg:block">
              <ConnectionStatus compact />
            </div>

            {/* Global Theme Toggle Button */}
            <ThemeToggle />

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-bold font-heading text-[#131b2e] dark:text-white truncate max-w-[140px]">{user.name}</span>
                  <Badge
                    variant={user.role === 'ADMIN' ? 'primary' : user.role === 'TEACHER' ? 'warning' : 'tertiary'}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {user.role}
                  </Badge>
                </div>

                <button
                  onClick={logout}
                  title="Log out of account"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111726] px-3 py-2 text-xs font-medium font-heading text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 hover:border-rose-200 dark:hover:border-rose-800 transition shadow-2xs active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium font-heading transition shadow-xs',
                  location.pathname === '/login'
                    ? 'bg-[#4648d4] text-white shadow'
                    : 'bg-slate-800 dark:bg-slate-800 text-white hover:bg-slate-900 dark:hover:bg-slate-700'
                )}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileOpen((prev) => !prev)}
              aria-label={isMobileOpen ? 'Close Menu' : 'Open Menu'}
              className="flex xl:hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111726] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white active:scale-95 transition cursor-pointer"
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
