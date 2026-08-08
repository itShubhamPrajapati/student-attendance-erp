import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminStudentsPage } from './pages/AdminStudentsPage';
import { AdminTeachersPage } from './pages/AdminTeachersPage';
import { AdminSubjectsPage } from './pages/AdminSubjectsPage';
import { AdminClassesPage } from './pages/AdminClassesPage';
import { AdminAssignmentsPage } from './pages/AdminAssignmentsPage';
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
      QR-Based Student Attendance Management System &bull; Phase 3 Academic Structure &bull; College Field Project
    </footer>
  </div>
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
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

          {/* Protected Admin Routes (ADMIN only) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout role="ADMIN">
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout role="ADMIN">
                  <AdminStudentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout role="ADMIN">
                  <AdminTeachersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/subjects"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout role="ADMIN">
                  <AdminSubjectsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/classes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout role="ADMIN">
                  <AdminClassesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/assignments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout role="ADMIN">
                  <AdminAssignmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Teacher Route (TEACHER only) */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <DashboardLayout role="TEACHER">
                  <TeacherDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Student Route (STUDENT only) */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout role="STUDENT">
                  <StudentDashboard />
                </DashboardLayout>
              </ProtectedRoute>
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
    </AuthProvider>
  );
};

export default App;
