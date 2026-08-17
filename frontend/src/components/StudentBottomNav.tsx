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
      name: 'Analytics',
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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf8ff]/85 dark:bg-[#090d16]/85 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/10 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom,0px)]"
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
                      ? 'bg-gradient-to-tr from-[#4648d4] to-[#6063ee] shadow-[#4648d4]/40 ring-4 ring-[#faf8ff] dark:ring-[#090d16]'
                      : 'bg-gradient-to-tr from-[#4648d4] to-[#6b38d4] shadow-[#4648d4]/30 hover:shadow-[#4648d4]/50 ring-4 ring-[#faf8ff] dark:ring-[#090d16]'
                  )}
                >
                  {item.icon}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold font-heading mt-0.5 tracking-tight transition-colors',
                    isActive
                      ? 'text-[#4648d4] dark:text-indigo-400'
                      : 'text-[#131b2e] dark:text-slate-300'
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
                  ? 'text-[#4648d4] dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-[#131b2e] dark:hover:text-slate-200'
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
                  'text-[10px] font-heading tracking-tight transition-colors mt-0.5',
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
