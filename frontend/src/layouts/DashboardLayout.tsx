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
    <div className="min-h-screen flex flex-col bg-[#faf8ff] dark:bg-[#090d16] text-[#131b2e] dark:text-[#f8fafc] relative overflow-x-hidden transition-colors duration-200">
      {/* Lumina Academic Ambient Lighting spots */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-[-100px] left-[-100px] -z-10 w-[600px] h-[600px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[140px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[-150px] right-[-150px] -z-10 w-[700px] h-[700px] rounded-full bg-purple-500/10 dark:bg-purple-600/10 blur-[160px]"
      />

      <Navbar />

      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        <Sidebar role={effectiveRole} />

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 min-w-0 ${isStudent ? 'pb-24 lg:pb-8' : ''}`}>
          {children}
        </main>
      </div>

      {/* Render Student Bottom Nav on mobile when user is a student */}
      {isStudent && <StudentBottomNav />}

      <footer className="border-t border-slate-200/80 dark:border-white/10 bg-[#faf8ff]/80 dark:bg-[#090d16]/80 backdrop-blur-md py-4 px-6 text-center text-xs text-[#464554] dark:text-slate-400 hidden sm:block font-heading">
        Lumina Academic Attendance System &bull; Enterprise QR Platform &bull; College Management Portal
      </footer>
    </div>
  );
};
