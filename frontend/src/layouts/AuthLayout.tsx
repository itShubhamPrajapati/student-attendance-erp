import React from 'react';
import { Navbar } from '../components/Navbar';

export interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 dark:bg-slate-950 relative overflow-x-hidden transition-colors duration-200">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 -z-10 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-sky-500/10 blur-[130px]"
      />
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <footer className="border-t border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md py-4 px-6 text-center text-xs text-slate-500">
        QR-Based Student Attendance Management System &bull; Phase 4 QR-Based Attendance &bull; College Field Project
      </footer>
    </div>
  );
};
