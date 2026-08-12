import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  School,
  BookOpen,
  Building2,
  ArrowRight,
  RefreshCw,
  UserCheck2,
  Plus,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { ActivityFeedCard } from '../components/ActivityFeedCard';
import { DashboardStats } from '../types';
import { apiGetAdminDashboard } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetAdminDashboard();
      setStats(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Admin Management Console"
        description="Oversee college academic structure, student enrollments, faculty allocations, course subjects, and class batches."
        badge={
          <Badge variant="info" withDot>
            Live Database Connected
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh Stats
            </Button>
            <Link to="/admin/assignments">
              <Button size="sm" leftIcon={<UserCheck2 className="w-3.5 h-3.5" />}>
                Assign Teacher
              </Button>
            </Link>
          </div>
        }
      />

      {error && (
        <ErrorState
          variant="banner"
          title="Unable to Load Dashboard Statistics"
          error={error}
          onRetry={fetchStats}
          retryLabel="Retry"
        />
      )}

      {loading ? (
        <div className="space-y-6">
          <LoadingState variant="kpi" cards={4} message="Loading academic KPIs..." />
          <LoadingState variant="table" rows={4} columns={4} message="Loading recent teaching assignments..." />
        </div>
      ) : (
        <>
          {/* Summary KPI Cards with Real Data (Phase 3 Extended) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Students */}
            <Card hoverEffect className="transition-all border-indigo-100 bg-white">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <Badge variant="info" className="text-[10px]">
                  {stats?.students?.active ?? 0} Active
                </Badge>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-bold text-slate-900 font-heading">
                  {stats?.students?.total ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Registered Students</div>
              </div>
            </Card>

            {/* 2. Total Teachers */}
            <Card hoverEffect className="transition-all border-amber-100 bg-white">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <School className="w-5 h-5 text-amber-600" />
                </div>
                <Badge variant="warning" className="text-[10px]">
                  {stats?.teachers?.active ?? 0} Active
                </Badge>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-bold text-slate-900 font-heading">
                  {stats?.teachers?.total ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Faculty Members</div>
              </div>
            </Card>

            {/* 3. Total Subjects (Phase 3) */}
            <Card hoverEffect className="transition-all border-purple-100 bg-white">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <Badge variant="info" className="text-[10px]">
                  Curriculum
                </Badge>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-bold text-purple-700 font-heading">
                  {stats?.subjects?.total ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Course Subjects</div>
              </div>
            </Card>

            {/* 4. Total Classes (Phase 3) */}
            <Card hoverEffect className="transition-all border-emerald-100 bg-white">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <Badge variant="success" withDot className="text-[10px]">
                  Batches
                </Badge>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-bold text-emerald-700 font-heading">
                  {stats?.classes?.total ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Academic Classes</div>
              </div>
            </Card>
          </div>

          {/* Quick Actions Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading">
              Quick Administrative Actions
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/admin/students">
                <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add Student
                </Button>
              </Link>
              <Link to="/admin/teachers">
                <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add Teacher
                </Button>
              </Link>
              <Link to="/admin/subjects">
                <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add Subject
                </Button>
              </Link>
              <Link to="/admin/classes">
                <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add Class
                </Button>
              </Link>
              <Link to="/admin/assignments">
                <Button size="sm" variant="outline" leftIcon={<UserCheck2 className="w-3.5 h-3.5" />}>
                  Assign Teacher
                </Button>
              </Link>
              <Link to="/admin/attendance">
                <Button size="sm" leftIcon={<Users className="w-3.5 h-3.5" />}>
                  Attendance History
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Teaching Assignments Overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Recent Teaching Assignments
                </h3>
                <p className="text-xs text-slate-500">
                  Live allocations linking faculty to course subjects and class batches
                </p>
              </div>
              <Link to="/admin/assignments" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                <span>View All Assignments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats?.recent_assignments && stats.recent_assignments.length > 0 ? (
              <Card className="overflow-hidden p-0 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">Faculty Member</th>
                        <th className="py-3 px-4">Assigned Subject</th>
                        <th className="py-3 px-4">Class Batch</th>
                        <th className="py-3 px-4">Department</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.recent_assignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900 font-heading">
                            {assignment.teacher_name} ({assignment.teacher_employee_id})
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">{assignment.subject_name}</span>{' '}
                            <span className="font-mono text-[11px] text-indigo-600">({assignment.subject_code})</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {assignment.class_name} &bull; Sem {assignment.semester} &bull; Sec {assignment.section}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{assignment.department}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-xs text-slate-500">
                No teaching assignments created yet. Click "Assign Teacher" to allocate subjects to classes.
              </Card>
            )}
          </div>

          {/* Recent Activity Feed (Feature #16) */}
          <ActivityFeedCard
            role="ADMIN"
            limit={5}
            title="Recent College Attendance Activity"
            subtitle="Authoritative log of lecture sessions, check-ins, manual modifications, and proof receipts across your college"
          />
        </>
      )}
    </div>
  );
};
