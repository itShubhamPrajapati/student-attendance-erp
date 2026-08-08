import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, School, GraduationCap, ArrowLeft, Layers, Users, BookOpen, Building2, UserCheck2, LogOut } from 'lucide-react';
import { UserRole } from '../types';
import { Badge } from './Badge';
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
        ];
      case 'TEACHER':
        return [
          { name: 'Teacher Overview', path: '/teacher', icon: <Layers className="w-4 h-4" /> },
        ];
      case 'STUDENT':
        return [
          { name: 'My Attendance Portal', path: '/student', icon: <Layers className="w-4 h-4" /> },
        ];
      default:
        return [];
    }
  };

  const links = getRoleLinks();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/80 bg-white min-h-[calc(100vh-4rem)] p-4">
      {/* Role Profile Header */}
      <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-slate-50 border border-slate-200/60">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-semibold text-xs shadow-xs">
          {role === 'ADMIN' ? <Shield className="w-4 h-4" /> : role === 'TEACHER' ? <School className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate font-heading">{user?.name || `${role} Area`}</p>
          <p className="text-[11px] text-slate-400 truncate">{user?.email || 'Academic Workspace'}</p>
        </div>
        <Badge variant={role === 'ADMIN' ? 'info' : role === 'TEACHER' ? 'warning' : 'success'} className="text-[10px] px-1.5 py-0">
          {role}
        </Badge>
      </div>

      {/* Navigation List */}
      <div className="space-y-1 flex-1">
        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className={cn(isActive ? 'text-indigo-600' : 'text-slate-400')}>{link.icon}</span>
                <span className="truncate">{link.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Logout & Home Shortcut */}
      <div className="pt-4 border-t border-slate-100 space-y-1">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>

        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Main Portal</span>
        </Link>
      </div>
    </aside>
  );
};
