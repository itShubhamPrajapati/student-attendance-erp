import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Camera, TrendingUp, History, User } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../utils/cn';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  isPrimary?: boolean;
}

export const StudentBottomNav: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Only display bottom navigation for authenticated STUDENT users on mobile screens
  if (!isAuthenticated || user?.role !== 'STUDENT') {
    return null;
  }

  const navItems: NavItem[] = [
    {
      name: 'Home',
      path: '/student',
      icon: <Home className="w-5 h-5" />,
    },
    {
      name: 'History',
      path: '/student/attendance/history',
      icon: <History className="w-5 h-5" />,
    },
    {
      name: 'Scan QR',
      path: '/attendance/scan',
      icon: <Camera className="w-6 h-6" />,
      isPrimary: true,
    },
    {
      name: 'Stats',
      path: '/student/attendance/analytics',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      name: 'Profile',
      path: '/student/profile',
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      aria-label="Student Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            item.path === '/student'
              ? location.pathname === '/student'
              : location.pathname.startsWith(item.path);

          if (item.isPrimary) {
            return (
              <Link
                key={item.name}
                to={item.path}
                aria-label={item.name}
                className="relative -top-3.5 flex flex-col items-center group focus:outline-hidden"
              >
                <div
                  className={cn(
                    'w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-200 active:scale-95',
                    isActive
                      ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-indigo-500/40 ring-4 ring-white dark:ring-slate-900'
                      : 'bg-gradient-to-tr from-indigo-600 to-indigo-700 shadow-indigo-600/30 hover:shadow-indigo-600/50 ring-4 ring-white dark:ring-slate-900'
                  )}
                >
                  {item.icon}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold mt-0.5 tracking-tight transition-colors',
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-300'
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.path}
              aria-label={item.name}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 min-w-[56px] rounded-xl transition-all duration-150 active:scale-95 focus:outline-hidden',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-lg transition-colors',
                  isActive && 'bg-indigo-50 dark:bg-indigo-950/60'
                )}
              >
                {item.icon}
              </div>
              <span
                className={cn(
                  'text-[10px] tracking-tight transition-colors mt-0.5',
                  isActive ? 'font-bold' : 'font-medium'
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
