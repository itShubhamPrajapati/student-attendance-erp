import React from 'react';
import { Navbar } from '../components/Navbar';

export interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf8ff] dark:bg-[#090d16] relative overflow-x-hidden transition-colors duration-200">
      {/* Lumina Academic Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 -z-10 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#4648d4]/15 via-[#6b38d4]/10 to-[#006c49]/10 blur-[140px]"
      />
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <footer className="border-t border-slate-200/80 dark:border-white/10 bg-[#faf8ff]/80 dark:bg-[#090d16]/80 backdrop-blur-md py-4 px-6 text-center text-xs text-[#464554] dark:text-slate-400 font-heading">
        Lumina Academic Attendance System &bull; Enterprise QR Platform &bull; College Management Portal
      </footer>
    </div>
  );
};
