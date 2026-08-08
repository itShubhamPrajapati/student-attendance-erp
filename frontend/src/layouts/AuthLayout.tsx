import React from 'react';
import { Navbar } from '../components/Navbar';

export interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500">
        QR-Based Student Attendance Management System &bull; Phase 1 Foundation &bull; Educational Demo
      </footer>
    </div>
  );
};
