import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  BookOpen,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Award,
  Lock,
  History,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  TeacherAttendanceAnalyticsResponse,
  TeacherAttendanceAnalyticsParams,
  TeacherStudentAttendanceDetailResponse,
} from '../types';
import {
  apiGetTeacherAttendanceAnalytics,
  apiGetTeacherStudentAttendanceDetail,
} from '../services/api';

export const TeacherAttendanceAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<TeacherAttendanceAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all_time');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [finalizationStatus, setFinalizationStatus] = useState<string>('ALL');

  // Student Detail Modal (Feature #9 Integration)
  const [inspectingStudentId, setInspectingStudentId] = useState<string | null>(null);
  const [inspectingDetail, setInspectingDetail] = useState<TeacherStudentAttendanceDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params: TeacherAttendanceAnalyticsParams = {
      class_id: selectedClass || undefined,
      subject_id: selectedSubject || undefined,
      period: selectedPeriod !== 'all_time' ? selectedPeriod : undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      finalization_status: finalizationStatus !== 'ALL' ? finalizationStatus : undefined,
    };

    try {
      const res = await apiGetTeacherAttendanceAnalytics(params);
      setData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load teacher attendance analytics.');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSubject, selectedPeriod, fromDate, toDate, finalizationStatus]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleClearFilters = () => {
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedPeriod('all_time');
    setFromDate('');
    setToDate('');
    setFinalizationStatus('ALL');
  };

  const hasActiveFilters =
    selectedClass !== '' ||
    selectedSubject !== '' ||
    selectedPeriod !== 'all_time' ||
    fromDate !== '' ||
    toDate !== '' ||
    finalizationStatus !== 'ALL';

  // Open Student Detail (Feature #9)
  const handleOpenStudentDetail = async (studentId: string) => {
    setInspectingStudentId(studentId);
    setDetailLoading(true);
    try {
      const res = await apiGetTeacherStudentAttendanceDetail(studentId);
      setInspectingDetail(res.data);
    } catch (err: unknown) {
      console.error('Failed to load student detail', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const summary = data?.summary;
  const distribution = data?.distribution;
  const lateAnalysis = data?.late_analysis;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Faculty Attendance Analytics & Insights"
        description="Comprehensive attendance rates, student standings, trends, and lecture performance across your assigned curriculum."
        badge={
          <Badge variant="info" withDot>
            Authoritative Analytics
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Link to="/teacher/students/search">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Search className="w-3.5 h-3.5" />}
              >
                Student Search
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-4 sm:p-5 bg-white border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Analytics Query Filters
            </h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Class Filter */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Assigned Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            >
              <option value="">All Authorized Classes</option>
              {data?.classes.map((c) => (
                <option key={c.class_id} value={c.class_id}>
                  {c.class_name} ({c.department})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Assigned Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            >
              <option value="">All Authorized Subjects</option>
              {data?.subjects.map((s) => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.subject_name} ({s.subject_code})
                </option>
              ))}
            </select>
          </div>

          {/* Period Preset */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                if (e.target.value !== 'custom') {
                  setFromDate('');
                  setToDate('');
                }
              }}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            >
              <option value="all_time">All Time (Full Academic History)</option>
              <option value="today">Today</option>
              <option value="this_week">This Week (Mon – Sun)</option>
              <option value="this_month">This Month</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="current_semester">Current Semester (~6 Months)</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* Finalization Filter */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Session Lifecycle</label>
            <select
              value={finalizationStatus}
              onChange={(e) => setFinalizationStatus(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            >
              <option value="ALL">All Session States</option>
              <option value="OPEN">Open Sessions Only</option>
              <option value="FINALIZED">Finalized Sessions Only</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {selectedPeriod === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">From Date (YYYY-MM-DD)</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">To Date (YYYY-MM-DD)</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Main Content Area */}
      {loading ? (
        <Card className="p-16 bg-white border-slate-200/80 shadow-xs flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" label="Computing authoritative attendance metrics and performance insights..." />
        </Card>
      ) : error ? (
        <Card className="p-8 text-center bg-rose-50 border-rose-200 text-rose-800 space-y-3">
          <AlertTriangle className="w-8 h-8 mx-auto text-rose-600" />
          <h3 className="text-sm font-bold font-heading">Unable to Load Analytics</h3>
          <p className="text-xs text-rose-600 max-w-md mx-auto">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchAnalytics} className="mt-2">
            Retry Loading
          </Button>
        </Card>
      ) : summary?.total_sessions === 0 ? (
        <Card className="p-12 text-center bg-white border-slate-200/80 shadow-xs space-y-3">
          <BarChart3 className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-base font-bold font-heading text-slate-800">
            No Attendance Analytics Available Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {hasActiveFilters
              ? 'No attendance sessions matched your selected filter criteria. Try clearing filters or broadening the date range.'
              : 'You have not conducted any attendance sessions yet. Start an attendance session to begin generating class performance analytics.'}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Link to="/teacher/attendance/sessions">
              <Button variant="primary" size="sm">
                Start an Attendance Session
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* SECTION 1: TOP KPI OVERVIEW CARDS                                        */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* 1. Overall Attendance Rate */}
            <Card className="p-4 sm:p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md rounded-3xl col-span-2 sm:col-span-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                  Overall Attendance Rate
                </span>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-3xl sm:text-4xl font-black font-heading tracking-tight text-white">
                    {summary?.attendance_percentage ?? 0}%
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-300 flex items-center justify-between">
                <span>Total Attended:</span>
                <span className="font-mono font-bold text-white">
                  {summary?.total_attended.toLocaleString()}
                </span>
              </div>
            </Card>

            {/* 2. Total Enrolled Students */}
            <Card className="p-4 sm:p-5 bg-white border-slate-200/80 shadow-xs rounded-3xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Enrolled Students
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 mt-1.5 block">
                  {summary?.total_students.toLocaleString()}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Across Classes:</span>
                <span className="font-bold text-slate-800">{summary?.total_classes} Classes</span>
              </div>
            </Card>

            {/* 3. Sessions Held */}
            <Card className="p-4 sm:p-5 bg-white border-slate-200/80 shadow-xs rounded-3xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Sessions Conducted
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 mt-1.5 block">
                  {summary?.total_sessions.toLocaleString()}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span className="text-emerald-600 font-semibold">{summary?.finalized_sessions} Locked</span>
                <span className="text-indigo-600 font-semibold">{summary?.open_sessions} Open</span>
              </div>
            </Card>

            {/* 4. Attendance Breakdown */}
            <Card className="p-4 sm:p-5 bg-white border-slate-200/80 shadow-xs rounded-3xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Status Breakdown
                </span>
                <div className="flex items-center gap-3 mt-1.5">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 block">Present</span>
                    <span className="text-base font-extrabold font-mono text-slate-900">
                      {summary?.total_present.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <span className="text-xs font-bold text-amber-600 block">Late</span>
                    <span className="text-base font-extrabold font-mono text-slate-900">
                      {summary?.total_late.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Missed / Absent:</span>
                <span className="font-bold text-rose-600">{summary?.total_absent.toLocaleString()}</span>
              </div>
            </Card>

            {/* 5. Standing Attention Needed */}
            <Card className="p-4 sm:p-5 bg-white border-slate-200/80 shadow-xs rounded-3xl col-span-2 sm:col-span-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                  Standing Attention
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold font-heading text-rose-600">
                    {summary?.critical_students ?? 0}
                  </span>
                  <span className="text-xs text-rose-600/80 font-semibold">Critical (&lt;60%)</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Below 75%:</span>
                <span className="font-bold text-amber-600">{summary?.below_requirement_students} Students</span>
              </div>
            </Card>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: ATTENDANCE TRENDS & DAY-OF-WEEK DISTRIBUTION                  */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Monthly Trend Chart */}
            <Card className="p-5 sm:p-6 bg-white border-slate-200/80 shadow-xs rounded-3xl lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                      Monthly Attendance Trajectory
                    </h3>
                    <p className="text-[11px] text-slate-400">Chronological attendance rate across academic terms</p>
                  </div>
                </div>
              </div>

              {data?.monthly_trend.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No monthly trend history available for selected timeframe.
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {data?.monthly_trend.map((m) => (
                    <div key={m.month} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{m.month_label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-400">{m.total_sessions} Sessions</span>
                          {m.late_percentage > 0 && (
                            <span className="text-[11px] text-amber-700 font-medium">
                              Late: {m.late_percentage}%
                            </span>
                          )}
                          <span className="font-mono font-extrabold text-slate-900">
                            {m.attendance_percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Visual Trend Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex shadow-inner">
                        <div
                          className={`h-full transition-all duration-300 ${
                            m.attendance_percentage >= 75
                              ? 'bg-emerald-500'
                              : m.attendance_percentage >= 60
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, m.attendance_percentage))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Day of Week Attendance Distribution */}
            <Card className="p-5 sm:p-6 bg-white border-slate-200/80 shadow-xs rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                      Day-of-Week Distribution
                    </h3>
                    <p className="text-[11px] text-slate-400">Attendance by weekday schedule</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-1 text-xs">
                {data?.weekly_trend.map((w) => (
                  <div key={w.day_of_week} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700 w-24">{w.day_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{w.total_sessions} sessions</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        w.total_sessions === 0
                          ? 'text-slate-400 bg-slate-100'
                          : w.attendance_percentage >= 75
                          ? 'text-emerald-700 bg-emerald-100/80'
                          : w.attendance_percentage >= 60
                          ? 'text-amber-800 bg-amber-100/80'
                          : 'text-rose-700 bg-rose-100/80'
                      }`}
                    >
                      {w.total_sessions === 0 ? '—' : `${w.attendance_percentage}%`}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: CLASS & SUBJECT COMPARISON TABLES                             */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Class Performance Breakdown */}
            <Card className="p-5 bg-white border-slate-200/80 shadow-xs rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                    Class Performance Comparison
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">{data?.classes.length} Classes</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-2 text-center">Sessions</th>
                      <th className="py-2.5 px-2 text-center">Students</th>
                      <th className="py-2.5 px-2 text-center">Below 75%</th>
                      <th className="py-2.5 px-3 text-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.classes.map((c) => (
                      <tr key={c.class_id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">{c.class_name}</span>
                          <span className="text-[10px] text-slate-400">{c.department} &bull; Sem {c.semester} ({c.section})</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">{c.total_sessions}</td>
                        <td className="py-2.5 px-2 text-center font-mono">{c.total_students}</td>
                        <td className="py-2.5 px-2 text-center">
                          {c.below_requirement_students > 0 ? (
                            <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              {c.below_requirement_students}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-full ${
                              c.total_sessions === 0
                                ? 'text-slate-400 bg-slate-100'
                                : c.attendance_percentage >= 75
                                ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                : c.attendance_percentage >= 60
                                ? 'text-amber-800 bg-amber-50 border border-amber-200'
                                : 'text-rose-700 bg-rose-50 border border-rose-200'
                            }`}
                          >
                            {c.total_sessions === 0 ? '—' : `${c.attendance_percentage}%`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Subject Performance Breakdown */}
            <Card className="p-5 bg-white border-slate-200/80 shadow-xs rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                    Subject Performance Comparison
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">{data?.subjects.length} Subjects</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-2 text-center">Sessions</th>
                      <th className="py-2.5 px-2 text-center">Classes</th>
                      <th className="py-2.5 px-2 text-center">Below 75%</th>
                      <th className="py-2.5 px-3 text-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.subjects.map((s) => (
                      <tr key={s.subject_id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">{s.subject_name}</span>
                          <span className="font-mono text-[10px] text-indigo-600 font-semibold">{s.subject_code}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">{s.total_sessions}</td>
                        <td className="py-2.5 px-2 text-center font-mono">{s.classes_count}</td>
                        <td className="py-2.5 px-2 text-center">
                          {s.below_requirement_students > 0 ? (
                            <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              {s.below_requirement_students}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-full ${
                              s.total_sessions === 0
                                ? 'text-slate-400 bg-slate-100'
                                : s.attendance_percentage >= 75
                                ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                : s.attendance_percentage >= 60
                                ? 'text-amber-800 bg-amber-50 border border-amber-200'
                                : 'text-rose-700 bg-rose-50 border border-rose-200'
                            }`}
                          >
                            {s.total_sessions === 0 ? '—' : `${s.attendance_percentage}%`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: STUDENT DISTRIBUTION & TOP STUDENTS                           */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Student Standing Distribution */}
            <Card className="p-5 bg-white border-slate-200/80 shadow-xs rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                    Student Standing Distribution
                  </h3>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {/* Met */}
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-900 block">&ge; 75% Requirement Met</span>
                    <span className="text-[11px] text-emerald-700">Good Standing</span>
                  </div>
                  <span className="font-mono text-lg font-black text-emerald-800">
                    {distribution?.requirement_met ?? 0}
                  </span>
                </div>

                {/* Below */}
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-900 block">60% – 74.9% Below Target</span>
                    <span className="text-[11px] text-amber-700">Attendance Attention Required</span>
                  </div>
                  <span className="font-mono text-lg font-black text-amber-800">
                    {distribution?.below_requirement ?? 0}
                  </span>
                </div>

                {/* Critical */}
                <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-rose-900 block">&lt; 60% Critical Deficit</span>
                    <span className="text-[11px] text-rose-700">Severe Attendance Risk</span>
                  </div>
                  <span className="font-mono text-lg font-black text-rose-800">
                    {distribution?.critical ?? 0}
                  </span>
                </div>
              </div>
            </Card>

            {/* Top Attendance Students */}
            <Card className="p-5 bg-white border-slate-200/80 shadow-xs rounded-3xl lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                    Highest Attendance Performers
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Top Assigned Students</span>
              </div>

              <div className="space-y-2 text-xs">
                {data?.top_students.length === 0 ? (
                  <p className="text-slate-400 italic py-4 text-center">No student rankings available yet.</p>
                ) : (
                  data?.top_students.map((st, idx) => (
                    <div
                      key={st.student_id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/60 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900">{st.name}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {st.roll_number} &bull; {st.class_name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500 font-mono">
                          {st.present + st.late}/{st.total_sessions} Attended
                        </span>
                        <Badge variant="success" className="font-mono text-xs px-2.5 py-0.5">
                          {st.attendance_percentage}%
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 5: STUDENTS REQUIRING ATTENTION                                  */}
          {/* ========================================================================= */}
          <Card className="p-5 sm:p-6 bg-white border-slate-200/80 shadow-xs rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                  Students Requiring Faculty Attention (Below 75%)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-rose-600">
                {data?.attention_students.length} Students Listed
              </span>
            </div>

            {data?.attention_students.length === 0 ? (
              <div className="py-6 text-center text-xs text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-200">
                ✓ Excellent! All enrolled students currently satisfy the 75% minimum attendance requirement.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Roll Number</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-2 text-center">Attended</th>
                      <th className="py-2.5 px-2 text-center">Missed</th>
                      <th className="py-2.5 px-3 text-center">Status Tier</th>
                      <th className="py-2.5 px-3 text-right">Attendance %</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.attention_students.map((st) => (
                      <tr key={st.student_id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{st.name}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{st.roll_number}</td>
                        <td className="py-2.5 px-3 text-slate-600">{st.class_name}</td>
                        <td className="py-2.5 px-2 text-center font-mono">{st.present + st.late}/{st.total_sessions}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-rose-600">{st.absent}</td>
                        <td className="py-2.5 px-3 text-center">
                          {st.status === 'CRITICAL' ? (
                            <Badge variant="error" withDot className="text-[10px] font-bold">
                              CRITICAL (&lt;60%)
                            </Badge>
                          ) : (
                            <Badge variant="warning" withDot className="text-[10px] font-bold">
                              BELOW TARGET (60-74.9%)
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-xs">
                          <span className={st.status === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'}>
                            {st.attendance_percentage}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenStudentDetail(st.student_id)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            View Record
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ========================================================================= */}
          {/* SECTION 6: LATE ATTENDANCE DIAGNOSTICS & AUDIT SUMMARY                    */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Late Attendance Diagnostics */}
            <Card className="p-5 bg-white border-slate-200/80 shadow-xs rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                    Late Attendance Deep-Dive
                  </h3>
                </div>
                <Badge variant="warning" className="text-xs font-bold">
                  {lateAnalysis?.late_percentage ?? 0}% Late Rate
                </Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                      Total Late Check-ins
                    </span>
                    <p className="text-xl font-extrabold text-amber-900 font-heading mt-0.5">
                      {lateAnalysis?.total_late ?? 0}
                    </p>
                  </div>
                  <span className="text-[11px] text-amber-800 font-medium">Per policy: Counts as ATTENDED</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Most Frequent Late Student
                    </span>
                    {lateAnalysis?.most_late_student ? (
                      <div>
                        <span className="font-bold text-slate-900 block">{lateAnalysis.most_late_student.name}</span>
                        <span className="text-[11px] text-amber-700 font-mono font-semibold">
                          {lateAnalysis.most_late_student.late} late check-ins
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No late records</span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Highest Late Subject
                    </span>
                    {lateAnalysis?.highest_late_subject ? (
                      <div>
                        <span className="font-bold text-slate-900 block">{lateAnalysis.highest_late_subject.subject_name}</span>
                        <span className="text-[11px] text-amber-700 font-mono font-semibold">
                          {lateAnalysis.highest_late_subject.late_percentage}% late rate
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No late records</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Manual Corrections & Audit Activity */}
            <Card className="p-5 bg-white border-slate-200/80 shadow-xs rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                    Manual Corrections & Audit Log
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Feature #11 Immutable Audit</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Manual Marks</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    {data?.corrections.total_manual_marks ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-400">Direct faculty entries</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Corrections</span>
                  <span className="text-2xl font-black text-indigo-600 mt-1 block">
                    {data?.corrections.total_corrections ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-400">Audited status updates</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Absent &rarr; Present:</span>
                  <span className="font-mono font-bold text-slate-800">{data?.corrections.absent_to_present ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Absent &rarr; Late:</span>
                  <span className="font-mono font-bold text-slate-800">{data?.corrections.absent_to_late ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Late &rarr; Present:</span>
                  <span className="font-mono font-bold text-slate-800">{data?.corrections.late_to_present ?? 0}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 7: RECENT SESSIONS PERFORMANCE TABLE                             */}
          {/* ========================================================================= */}
          <Card className="p-5 sm:p-6 bg-white border-slate-200/80 shadow-xs rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                  Recent Lecture Session Performance
                </h3>
              </div>
              <Link
                to="/teacher/attendance/sessions"
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
              >
                View Full History <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-2 text-center">Present</th>
                    <th className="py-2.5 px-2 text-center">Late</th>
                    <th className="py-2.5 px-2 text-center">Absent</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Attendance %</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.recent_sessions.map((ses) => (
                    <tr key={ses.session_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900 block">
                          {new Date(ses.started_at).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ses.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-800 block">{ses.subject_name}</span>
                        <span className="text-[10px] font-mono text-indigo-600">{ses.subject_code}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{ses.class_name}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-emerald-700">{ses.present}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-amber-700">{ses.late}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-rose-700">{ses.absent}</td>
                      <td className="py-2.5 px-3 text-center">
                        {ses.finalization_status === 'FINALIZED' ? (
                          <Badge variant="neutral" className="text-[10px] flex items-center gap-1 mx-auto w-max">
                            <Lock className="w-2.5 h-2.5" /> Locked
                          </Badge>
                        ) : (
                          <Badge variant="info" className="text-[10px] flex items-center gap-1 mx-auto w-max">
                            Open
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-xs">
                        <span
                          className={
                            ses.attendance_percentage >= 75
                              ? 'text-emerald-700'
                              : ses.attendance_percentage >= 60
                              ? 'text-amber-800'
                              : 'text-rose-700'
                          }
                        >
                          {ses.attendance_percentage}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link to={`/teacher/attendance/${ses.session_id}/records`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ========================================================================= */}
      {/* FEATURE #9 INTEGRATION: STUDENT DETAIL MODAL                             */}
      {/* ========================================================================= */}
      {inspectingStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Student Attendance History & Details
                </h3>
                <p className="text-[11px] text-slate-400">
                  Authoritative student record across your authorized courses
                </p>
              </div>
              <button
                onClick={() => {
                  setInspectingStudentId(null);
                  setInspectingDetail(null);
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {detailLoading ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner size="md" label="Loading student attendance history..." />
                </div>
              ) : inspectingDetail ? (
                <div className="space-y-4 text-xs">
                  {/* Profile Strip */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Name</span>
                      <p className="font-bold text-slate-900 mt-0.5">{inspectingDetail.student.name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Roll Number</span>
                      <p className="font-mono font-bold text-slate-800 mt-0.5">{inspectingDetail.student.roll_number}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Class</span>
                      <p className="font-medium text-slate-800 mt-0.5">{inspectingDetail.student.class_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Overall Attendance</span>
                      <p className="font-mono font-extrabold text-sm text-indigo-600 mt-0.5">
                        {inspectingDetail.summary.overall_percentage}%
                      </p>
                    </div>
                  </div>

                  {/* Subject Attendance breakdown */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Course Performance Breakdown
                    </h4>
                    <div className="space-y-2">
                      {inspectingDetail.subjects.map((sub) => (
                        <div
                          key={sub.subject_id}
                          className="p-3 rounded-xl border border-slate-100 bg-white space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900">{sub.subject_name}</span>
                              <span className="text-[10px] font-mono text-indigo-600 ml-1.5">
                                ({sub.subject_code})
                              </span>
                            </div>
                            <span className="font-mono font-bold text-slate-900">{sub.percentage}%</span>
                          </div>

                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                sub.percentage >= 75
                                  ? 'bg-emerald-500'
                                  : sub.percentage >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, sub.percentage))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInspectingStudentId(null);
                  setInspectingDetail(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
