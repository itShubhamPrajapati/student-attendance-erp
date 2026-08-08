import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, School, ArrowRight, Database, RefreshCw, UserCheck, Plus } from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
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
        description="Oversee college academic directories, student enrollments, faculty allocations, and system authentication."
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
            <Link to="/admin/students">
              <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Manage Students
              </Button>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center p-8">
          <LoadingSpinner size="lg" label="Loading live database metrics..." />
        </div>
      ) : (
        <>
          {/* Summary KPI Cards with Real Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Students */}
            <Card hoverEffect className="transition-all border-indigo-100 bg-white">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <Badge variant="info" className="text-[10px]">
                  PostgreSQL
                </Badge>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-bold text-slate-900 font-heading">
                  {stats?.students?.total ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Total Registered Students</div>
              </div>
            </Card>

            {/* 2. Active Students */}
            <Card hoverEffect className="transition-all border-emerald-100 bg-white">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <Badge variant="success" withDot className="text-[10px]">
                  Active
                </Badge>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-bold text-emerald-700 font-heading">
                  {stats?.students?.active ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Active Student Accounts</div>
              </div>
            </Card>

            {/* 3. Total Teachers */}
            <Card hoverEffect className="transition-all border-amber-100 bg-white">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <School className="w-5 h-5 text-amber-600" />
                </div>
                <Badge variant="warning" className="text-[10px]">
                  Faculty
                </Badge>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-bold text-slate-900 font-heading">
                  {stats?.teachers?.total ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Total Registered Teachers</div>
              </div>
            </Card>

            {/* 4. Active Teachers */}
            <Card hoverEffect className="transition-all border-blue-100 bg-white">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <Badge variant="success" withDot className="text-[10px]">
                  Active
                </Badge>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-bold text-blue-700 font-heading">
                  {stats?.teachers?.active ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Active Faculty Accounts</div>
              </div>
            </Card>
          </div>

          {/* Quick Management Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <Card className="p-6 shadow-sm border-slate-200/80 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Students Management Portal
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Register new student enrollments, edit academic batch assignments (semester, section, roll number), and activate or deactivate login accounts.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  {stats?.students?.total ?? 0} Students currently in database
                </span>
                <Link to="/admin/students">
                  <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Open Students Directory
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 shadow-sm border-slate-200/80 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <School className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Faculty & Teachers Portal
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Register faculty members with employee identification numbers, assign academic departments, edit credentials, and control access permissions.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  {stats?.teachers?.total ?? 0} Faculty members in database
                </span>
                <Link to="/admin/teachers">
                  <Button size="sm" variant="secondary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Open Faculty Directory
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
