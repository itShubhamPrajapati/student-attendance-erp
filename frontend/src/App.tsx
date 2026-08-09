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
import { AdminAttendancePage } from './pages/AdminAttendancePage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherAttendanceHistoryPage } from './pages/TeacherAttendanceHistoryPage';
import { TeacherAttendanceSessionPage } from './pages/TeacherAttendanceSessionPage';
import { TeacherSessionAttendancePage } from './pages/TeacherSessionAttendancePage';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentScanAttendancePage } from './pages/StudentScanAttendancePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Root layout for public pages
const PublicLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-50/70">
    <Navbar />
    <main className="flex-1 py-6">
      <Outlet />
    </main>
    <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500">
      QR-Based Student Attendance Management System &bull; Phase 4 QR-Based Attendance &bull; College Field Project
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

          {/* ================================================================ */}
          {/* ADMIN ROUTES (Protected: ADMIN only)                            */}
          {/* ================================================================ */}
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

          <Route
            path="/admin/attendance"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout role="ADMIN">
                  <AdminAttendancePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ================================================================ */}
          {/* TEACHER ROUTES (Protected: TEACHER only)                         */}
          {/* ================================================================ */}
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

          <Route
            path="/teacher/attendance/history"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <DashboardLayout role="TEACHER">
                  <TeacherAttendanceHistoryPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/attendance/sessions"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <DashboardLayout role="TEACHER">
                  <TeacherAttendanceHistoryPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/attendance/:sessionId"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <DashboardLayout role="TEACHER">
                  <TeacherAttendanceSessionPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/attendance/:sessionId/records"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <DashboardLayout role="TEACHER">
                  <TeacherSessionAttendancePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ================================================================ */}
          {/* STUDENT ROUTES (Protected: STUDENT only)                         */}
          {/* ================================================================ */}
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

          <Route
            path="/attendance/scan"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout role="STUDENT">
                  <StudentScanAttendancePage />
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
