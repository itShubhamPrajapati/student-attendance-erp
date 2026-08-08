import React from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { UserRole } from '../types';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar role={role} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>

      <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500">
        QR-Based Student Attendance Management System &bull; Phase 1 Foundation &bull; College Field Project
      </footer>
    </div>
  );
};
