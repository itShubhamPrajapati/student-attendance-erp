import React from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { StudentBottomNav } from '../components/StudentBottomNav';
import { UserRole } from '../types';
import { useAuth } from '../auth/AuthContext';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: UserRole;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role }) => {
  const { user } = useAuth();
  const effectiveRole = role || (user?.role as UserRole) || 'STUDENT';
  const isStudent = effectiveRole === 'STUDENT';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 dark:bg-slate-950">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar role={effectiveRole} />

        <main className={`flex-1 p-3 sm:p-6 lg:p-8 min-w-0 ${isStudent ? 'pb-24 lg:pb-8' : ''}`}>
          {children}
        </main>
      </div>

      {/* Render Student Bottom Nav on mobile when user is a student */}
      {isStudent && <StudentBottomNav />}

      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 text-center text-xs text-slate-500 hidden sm:block">
        QR-Based Student Attendance Management System &bull; Phase 4 QR-Based Attendance &bull; College Field Project
      </footer>
    </div>
  );
};

