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
    <div className="min-h-screen flex flex-col bg-slate-50/70 dark:bg-slate-950 relative overflow-x-hidden transition-colors duration-200">
      {/* Subtle ambient lighting spots */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-1/4 -z-10 w-96 h-96 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-1/3 right-1/4 -z-10 w-96 h-96 rounded-full bg-purple-500/5 dark:bg-purple-500/8 blur-[140px]"
      />

      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar role={effectiveRole} />

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 min-w-0 ${isStudent ? 'pb-24 lg:pb-8' : ''}`}>
          {children}
        </main>
      </div>

      {/* Render Student Bottom Nav on mobile when user is a student */}
      {isStudent && <StudentBottomNav />}

      <footer className="border-t border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md py-4 px-6 text-center text-xs text-slate-500 hidden sm:block">
        QR-Based Student Attendance Management System &bull; Phase 4 QR-Based Attendance &bull; College Field Project
      </footer>
    </div>
  );
};

