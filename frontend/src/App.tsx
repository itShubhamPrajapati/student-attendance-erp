import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { NotFoundPage } from './pages/NotFoundPage';

// Root layout for public pages
const PublicLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-50/70">
    <Navbar />
    <main className="flex-1 py-6">
      <Outlet />
    </main>
    <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500">
      QR-Based Student Attendance Management System &bull; Phase 1 Foundation &bull; College Field Project
    </footer>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public & Landing Pages */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Auth Route */}
        <Route
          path="/login"
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />

        {/* Role-Based Placeholder Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <DashboardLayout role="admin">
              <AdminDashboard />
            </DashboardLayout>
          }
        />

        <Route
          path="/teacher"
          element={
            <DashboardLayout role="teacher">
              <TeacherDashboard />
            </DashboardLayout>
          }
        />

        <Route
          path="/student"
          element={
            <DashboardLayout role="student">
              <StudentDashboard />
            </DashboardLayout>
          }
        />

        {/* 404 Fallback */}
        <Route
          path="*"
          element={
            <AuthLayout>
              <NotFoundPage />
            </AuthLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
