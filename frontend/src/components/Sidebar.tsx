import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  School,
  GraduationCap,
  ArrowLeft,
  Layers,
  Users,
  BookOpen,
  Building2,
  UserCheck2,
  LogOut,
  Calendar,
  Camera,
  History,
  TrendingUp,
  User,
  Search,
} from 'lucide-react';
import { UserRole } from '../types';
import { Badge } from './Badge';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../utils/cn';

export interface SidebarProps {
  role?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ role = 'ADMIN' }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getRoleLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { name: 'Dashboard Overview', path: '/admin', icon: <Layers className="w-4 h-4" /> },
          { name: 'Students Directory', path: '/admin/students', icon: <Users className="w-4 h-4" /> },
          { name: 'Faculty & Teachers', path: '/admin/teachers', icon: <School className="w-4 h-4" /> },
          { name: 'Subjects Directory', path: '/admin/subjects', icon: <BookOpen className="w-4 h-4" /> },
          { name: 'Classes & Batches', path: '/admin/classes', icon: <Building2 className="w-4 h-4" /> },
          { name: 'Teaching Assignments', path: '/admin/assignments', icon: <UserCheck2 className="w-4 h-4" /> },
          { name: 'Attendance History', path: '/admin/attendance', icon: <Calendar className="w-4 h-4" /> },
        ];
      case 'TEACHER':
        return [
          { name: 'My Classes & QR Sessions', path: '/teacher', icon: <Layers className="w-4 h-4" /> },
          { name: 'Student Search & Attendance', path: '/teacher/students/attendance', icon: <Search className="w-4 h-4" /> },
          { name: 'Attendance History', path: '/teacher/attendance/history', icon: <Calendar className="w-4 h-4" /> },
          { name: 'Analytics & Insights', path: '/teacher/attendance/analytics', icon: <TrendingUp className="w-4 h-4" /> },
          { name: 'My Profile & Settings', path: '/teacher/profile', icon: <User className="w-4 h-4" /> },
        ];
      case 'STUDENT':
        return [
          { name: 'My Attendance Overview', path: '/student', icon: <Layers className="w-4 h-4" /> },
          { name: 'Attendance Analytics', path: '/student/attendance/analytics', icon: <TrendingUp className="w-4 h-4" /> },
          { name: 'Attendance Calendar', path: '/student/attendance/calendar', icon: <Calendar className="w-4 h-4" /> },
          { name: 'Attendance History', path: '/student/attendance/history', icon: <History className="w-4 h-4" /> },
          { name: 'Scan Attendance QR', path: '/attendance/scan', icon: <Camera className="w-4 h-4" /> },
          { name: 'My Profile & Settings', path: '/student/profile', icon: <User className="w-4 h-4" /> },
        ];
      default:
        return [];
    }
  };

  const links = getRoleLinks();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl min-h-[calc(100vh-4rem)] p-4 transition-colors">
      {/* Role Profile Header */}
      <div className="flex items-center gap-3 p-3 mb-4 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/10 shadow-2xs">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-semibold text-xs shadow-xs">
          {role === 'ADMIN' ? <Shield className="w-4 h-4" /> : role === 'TEACHER' ? <School className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate font-heading">{user?.name || `${role} Area`}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{user?.email || 'Academic Workspace'}</p>
        </div>
        <Badge variant={role === 'ADMIN' ? 'info' : role === 'TEACHER' ? 'warning' : 'success'} className="text-[10px] px-1.5 py-0">
          {role}
        </Badge>
      </div>

      {/* Navigation List */}
      <div className="space-y-1 flex-1">
        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Management Menu
        </p>
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                'flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition duration-150',
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className={cn(isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500')}>{link.icon}</span>
                <span className="truncate">{link.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Theme Preference Option */}
      <div className="my-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Theme</span>
        <ThemeToggle variant="pill" />
      </div>

      {/* Logout & Home Shortcut */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>

        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Main Portal</span>
        </Link>
      </div>
    </aside>
  );
};
