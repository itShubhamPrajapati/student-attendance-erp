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
  Activity,
  Shield,
  ArrowUpRight,
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

  const quickActions = [
    { label: 'Assign Teacher', icon: <Plus className="w-3.5 h-3.5" />, path: '/admin/assignments', primary: true },
    { label: 'Student Directory', icon: <Users className="w-3.5 h-3.5" />, path: '/admin/students', primary: false },
    { label: 'Faculty Roster', icon: <School className="w-3.5 h-3.5" />, path: '/admin/teachers', primary: false },
    { label: 'Course Catalog', icon: <BookOpen className="w-3.5 h-3.5" />, path: '/admin/subjects', primary: false },
    { label: 'Class Batches', icon: <Building2 className="w-3.5 h-3.5" />, path: '/admin/classes', primary: false },
    { label: 'Audit Attendance', icon: <Shield className="w-3.5 h-3.5" />, path: '/admin/attendance', primary: false },
  ];

  const totalStudents = stats?.students?.total || 0;
  const totalTeachers = stats?.teachers?.total || 0;
  const totalSubjects = stats?.subjects?.total || 0;
  const totalClasses = stats?.classes?.total || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-0">
      {/* Header */}
      <PageHeader
        title="Good Morning, Admin"
        description="Campus operational status is optimal. Manage students, faculty allocations, course catalogs, and academic attendance ledgers."
        badge={
          <Badge variant="tertiary" withDot>
            Institutional Ledger Online
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Link to="/admin/assignments">
              <Button size="sm" className="bg-[#4648d4] hover:bg-[#383ab6]" leftIcon={<UserCheck2 className="w-3.5 h-3.5" />}>
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
          {/* Stitch Mobile #eaca9bcc High-Level Metrics Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Total Students */}
            <Card variant="solid" className="p-4 sm:p-5 flex flex-col justify-between bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-[#4648d4] dark:text-indigo-400 shadow-xs">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] font-bold font-heading text-[#006c49] dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Enrolled
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-heading text-2xl sm:text-3xl font-black text-[#131b2e] dark:text-white">
                  {totalStudents.toLocaleString()}
                </h3>
                <p className="text-xs text-[#464554] dark:text-slate-400 font-heading font-medium mt-0.5">
                  Total Students
                </p>
              </div>
            </Card>

            {/* 2. Active Faculty */}
            <Card variant="solid" className="p-4 sm:p-5 flex flex-col justify-between bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800/60 flex items-center justify-center text-[#6b38d4] dark:text-purple-400 shadow-xs">
                  <School className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] font-bold font-heading text-[#006c49] dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Active
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-heading text-2xl sm:text-3xl font-black text-[#131b2e] dark:text-white">
                  {totalTeachers.toLocaleString()}
                </h3>
                <p className="text-xs text-[#464554] dark:text-slate-400 font-heading font-medium mt-0.5">
                  Faculty Teachers
                </p>
              </div>
            </Card>

            {/* 3. Course Subjects */}
            <Card variant="solid" className="p-4 sm:p-5 flex flex-col justify-between bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] font-bold font-heading text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  Curriculum
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-heading text-2xl sm:text-3xl font-black text-[#131b2e] dark:text-white">
                  {totalSubjects.toLocaleString()}
                </h3>
                <p className="text-xs text-[#464554] dark:text-slate-400 font-heading font-medium mt-0.5">
                  Course Subjects
                </p>
              </div>
            </Card>

            {/* 4. Class Batches */}
            <Card variant="solid" className="p-4 sm:p-5 flex flex-col justify-between bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center text-[#006c49] dark:text-emerald-400 shadow-xs">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] font-bold font-heading text-[#006c49] dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Cohorts
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-heading text-2xl sm:text-3xl font-black text-[#131b2e] dark:text-white">
                  {totalClasses.toLocaleString()}
                </h3>
                <p className="text-xs text-[#464554] dark:text-slate-400 font-heading font-medium mt-0.5">
                  Class Batches
                </p>
              </div>
            </Card>
          </div>

          {/* System Health Card matching Stitch Mobile #eaca9bcc */}
          <Card className="p-4 sm:p-5 bg-gradient-to-r from-[#006c49]/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#006c49] text-white flex items-center justify-center shadow-sm">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading font-bold text-sm text-[#131b2e] dark:text-white">
                      Institutional System Health
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#006c49] dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                      Operational
                    </span>
                  </div>
                  <p className="text-xs text-[#464554] dark:text-slate-400 mt-0.5">
                    GORM PostgreSQL Database Connected &bull; QR Dynamic Refresh Daemon Active
                  </p>
                </div>
              </div>

              {/* Sparkline Bar Indicator */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <div className="w-2 h-6 bg-[#006c49] rounded-t-sm opacity-60" />
                <div className="w-2 h-8 bg-[#006c49] rounded-t-sm opacity-80" />
                <div className="w-2 h-5 bg-[#006c49] rounded-t-sm opacity-50" />
                <div className="w-2 h-9 bg-[#006c49] rounded-t-sm opacity-100" />
                <div className="w-2 h-7 bg-[#006c49] rounded-t-sm opacity-75" />
                <div className="w-2 h-10 bg-[#006c49] rounded-t-sm opacity-100" />
                <span className="text-xs font-bold font-mono text-[#006c49] dark:text-emerald-400 ml-2">99.9% Uptime</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions Horizontal Scroll matching Stitch Mobile #eaca9bcc */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold font-heading text-[#464554] dark:text-slate-400 uppercase tracking-wider">
              Quick Administrative Actions
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {quickActions.map((action, idx) => (
                <Link key={idx} to={action.path} className="flex-shrink-0">
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-heading font-semibold transition-all cursor-pointer ${
                      action.primary
                        ? 'bg-[#4648d4] text-white shadow-sm hover:bg-[#383ab6]'
                        : 'bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 text-[#131b2e] dark:text-white hover:border-[#4648d4]'
                    }`}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          </div>

          {/* Management Shortcuts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/admin/students">
              <Card variant="solid" hoverEffect className="p-4 bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-[#4648d4]">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[#131b2e] dark:text-white">Students</h4>
                    <p className="text-[11px] text-[#464554] dark:text-slate-400">Enrollments &amp; Roll calls</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </Card>
            </Link>

            <Link to="/admin/teachers">
              <Card variant="solid" hoverEffect className="p-4 bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-[#6b38d4]">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[#131b2e] dark:text-white">Faculty</h4>
                    <p className="text-[11px] text-[#464554] dark:text-slate-400">Instructors &amp; Staff</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </Card>
            </Link>

            <Link to="/admin/subjects">
              <Card variant="solid" hoverEffect className="p-4 bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[#131b2e] dark:text-white">Subjects</h4>
                    <p className="text-[11px] text-[#464554] dark:text-slate-400">Courses &amp; Modules</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </Card>
            </Link>

            <Link to="/admin/classes">
              <Card variant="solid" hoverEffect className="p-4 bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-[#006c49]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[#131b2e] dark:text-white">Classes</h4>
                    <p className="text-[11px] text-[#464554] dark:text-slate-400">Batches &amp; Sections</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </Card>
            </Link>
          </div>

          {/* Activity Feed Card */}
          <ActivityFeedCard role="ADMIN" />
        </>
      )}
    </div>
  );
};
