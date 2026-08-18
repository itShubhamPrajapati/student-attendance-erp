import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  LogOut,
  RefreshCw,
  Camera,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Search,
  TrendingUp,
  History,
  FileText,
  User,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { AttendanceProofModal } from '../components/AttendanceProofModal';
import { ActivityFeedCard } from '../components/ActivityFeedCard';
import {
  StudentProfile,
  Subject,
  StudentAttendanceSummary,
  StudentRecentAttendanceItem,
  SubjectAttendanceStat,
} from '../types';
import {
  apiGetStudentProfile,
  apiGetStudentSubjects,
  apiGetStudentAttendanceSummary,
  apiGetStudentRecentAttendance,
} from '../services/api';
import { useAuth } from '../auth/AuthContext';

// Institutional attendance thresholds
export const MIN_ATTENDANCE_THRESHOLD = 75.0;
export const CRITICAL_ATTENDANCE_THRESHOLD = 60.0;

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<StudentRecentAttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofAttendanceId, setProofAttendanceId] = useState<string | null>(null);

  // Subject filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW' | 'MET'>('ALL');

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, subjectsRes, summaryRes, recentRes] = await Promise.all([
        apiGetStudentProfile(),
        apiGetStudentSubjects(),
        apiGetStudentAttendanceSummary().catch(() => ({ data: null })),
        apiGetStudentRecentAttendance().catch(() => ({ data: [] })),
      ]);
      setProfile(profileRes.student);
      setSubjects(subjectsRes.data || []);
      if (summaryRes?.data) {
        setSummary(summaryRes.data);
      }
      setRecentAttendance(recentRes.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load attendance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  // Merge subjects from curriculum with calculated summary stats
  const allSubjectStats: SubjectAttendanceStat[] = useMemo(() => {
    if (summary?.subjects && summary.subjects.length > 0) {
      return summary.subjects;
    }
    return subjects.map((s) => ({
      subject_id: s.id,
      subject_name: s.name,
      subject_code: s.code,
      present_sessions: 0,
      late_sessions: 0,
      absent_sessions: 0,
      total_sessions: 0,
      percentage: 0.0,
      late_percentage: 0.0,
    }));
  }, [summary?.subjects, subjects]);

  // Filtered subjects based on search query and status filter tab
  const filteredSubjects = useMemo(() => {
    return allSubjectStats.filter((sub) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        sub.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.subject_code.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'LOW') {
        return sub.total_sessions > 0 && sub.percentage < MIN_ATTENDANCE_THRESHOLD;
      }
      if (statusFilter === 'MET') {
        return sub.total_sessions === 0 || sub.percentage >= MIN_ATTENDANCE_THRESHOLD;
      }
      return true;
    });
  }, [allSubjectStats, searchQuery, statusFilter]);

  // Metric computations
  const totalClasses = summary?.total_sessions ?? 0;
  const presentClasses = summary?.total_present ?? 0;
  const lateClasses = summary?.total_late ?? 0;
  const totalAttended = presentClasses + lateClasses;
  const absentClasses = summary?.total_absent ?? Math.max(0, totalClasses - totalAttended);
  const overallPercentage = summary?.overall_percentage ?? 0.0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-0">
      {/* 1. Page Header */}
      <PageHeader
        title={`Student Overview: ${profile?.name || user?.name || 'Student'}`}
        description="Student academic portal. Real-time verified attendance dashboard, subject breakdown, and QR check-in telemetry."
        badge={
          <Badge variant="tertiary" withDot>
            Student Workspace
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/student/profile">
              <Button variant="outline" size="sm" leftIcon={<User className="w-3.5 h-3.5" />}>
                Profile
              </Button>
            </Link>
            <Link to="/student/attendance/analytics">
              <Button variant="outline" size="sm" leftIcon={<TrendingUp className="w-3.5 h-3.5" />}>
                Analytics
              </Button>
            </Link>
            <Link to="/student/attendance/calendar">
              <Button variant="outline" size="sm" leftIcon={<Calendar className="w-3.5 h-3.5" />}>
                Calendar
              </Button>
            </Link>
            <Link to="/student/attendance/history">
              <Button variant="outline" size="sm" leftIcon={<History className="w-3.5 h-3.5" />}>
                History
              </Button>
            </Link>
            <Link to="/attendance/scan">
              <Button size="sm" className="bg-[#4648d4] hover:bg-[#383ab6] text-white" leftIcon={<Camera className="w-3.5 h-3.5" />}>
                Scan QR
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStudentData}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={logout} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
              Sign Out
            </Button>
          </div>
        }
      />

      {error && (
        <ErrorState
          variant="banner"
          title="Unable to Load Attendance Dashboard"
          error={error}
          onRetry={fetchStudentData}
          retryLabel="Retry"
        />
      )}

      {loading ? (
        <div className="space-y-6">
          <LoadingState variant="kpi" cards={4} message="Computing student attendance totals..." />
          <LoadingState variant="table" rows={4} columns={4} message="Retrieving course subject roster..." />
        </div>
      ) : (
        <>
          {/* 2. Hero Quick Action Bento Grid matching Stitch Desktop #2d3b2b04 */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Primary Action Card: Launch QR Scanner */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#4648d4] via-[#5550df] to-[#6b38d4] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 right-20 w-40 h-40 bg-[#8455ef]/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-heading font-semibold text-white">
                  <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
                  Live Academic Engine
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-black text-white">
                  Scan to Record Attendance
                </h2>
                <p className="text-xs sm:text-sm text-indigo-100 max-w-md font-normal">
                  {profile?.class?.name || 'Class Session'}: Point your camera at the teacher's screen to verify on-time attendance.
                </p>
              </div>

              <div className="relative z-10 mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link to="/attendance/scan">
                  <Button size="md" className="bg-white text-[#4648d4] hover:bg-slate-50 font-bold px-6 shadow-md shadow-black/10">
                    <Camera className="w-4 h-4 mr-1.5" />
                    <span>Launch Camera Scanner</span>
                  </Button>
                </Link>
                <span className="text-xs text-indigo-200 font-mono">
                  Roll: {profile?.roll_number || 'N/A'} &bull; Sem {profile?.semester || 1}
                </span>
              </div>
            </div>

            {/* Global Attendance Metric Card matching Stitch Desktop #2d3b2b04 */}
            <Card className="p-6 bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 rounded-3xl shadow-sm flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-[#4648d4] flex items-center justify-center font-bold">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold font-heading uppercase tracking-wider text-slate-400">
                      Overall Standing
                    </span>
                  </div>
                  <Badge
                    variant={overallPercentage >= MIN_ATTENDANCE_THRESHOLD ? 'tertiary' : 'warning'}
                    className="text-[11px] font-bold"
                  >
                    {totalClasses === 0
                      ? 'No Classes Held'
                      : overallPercentage >= MIN_ATTENDANCE_THRESHOLD
                      ? 'Good Standing'
                      : 'Below 75%'}
                  </Badge>
                </div>

                <div className="mt-4 flex items-baseline gap-3">
                  <span
                    className={`font-heading text-4xl sm:text-5xl font-black ${
                      totalClasses === 0
                        ? 'text-slate-400'
                        : overallPercentage >= MIN_ATTENDANCE_THRESHOLD
                        ? 'text-[#006c49] dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {totalClasses === 0 ? '—' : `${overallPercentage.toFixed(1)}%`}
                  </span>
                  <span className="text-xs text-[#464554] dark:text-slate-400 font-heading">
                    ({totalAttended}/{totalClasses} lectures)
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-[#464554] dark:text-slate-400">
                <span>Minimum Required: <strong className="text-slate-800 dark:text-slate-200">75.0%</strong></span>
                <Link to="/student/attendance/analytics" className="text-[#4648d4] dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5">
                  <span>Analytics</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>
          </section>

          {/* 3. Summary Metric Cards Row */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Lectures */}
            <Card className="p-4 bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-heading uppercase tracking-wider text-slate-400">
                  Total Lectures
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-[#4648d4] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-heading text-[#131b2e] dark:text-white">
                  {totalClasses}
                </span>
                <span className="text-xs text-slate-400">Held</span>
              </div>
            </Card>

            {/* Present (On-Time) */}
            <Card className="p-4 bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-heading uppercase tracking-wider text-slate-400">
                  On-Time Present
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-[#006c49] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-heading text-[#006c49] dark:text-emerald-400">
                  {presentClasses}
                </span>
                <span className="text-xs text-slate-400">Lectures</span>
              </div>
            </Card>

            {/* Late (Counted Attended) */}
            <Card className="p-4 bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-heading uppercase tracking-wider text-slate-400">
                  Late Attended
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-heading text-amber-600 dark:text-amber-400">
                  {lateClasses}
                </span>
                <span className="text-xs text-slate-400">Attended</span>
              </div>
            </Card>

            {/* Missed / Absent */}
            <Card className="p-4 bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-heading uppercase tracking-wider text-slate-400">
                  Missed Absent
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-heading text-rose-600 dark:text-rose-400">
                  {absentClasses}
                </span>
                <span className="text-xs text-slate-400">Missed</span>
              </div>
            </Card>
          </section>

          {/* 4. Subject Modules Breakdown Grid */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold font-heading text-[#131b2e] dark:text-white">
                  Enrolled Course Modules
                </h3>
                <p className="text-xs text-[#464554] dark:text-slate-400">
                  Subject-level attendance tracking and minimum 75% requirement health.
                </p>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search module..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
                  {(['ALL', 'LOW', 'MET'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setStatusFilter(tab)}
                      className={`px-3 py-1 text-xs font-semibold font-heading rounded-lg transition cursor-pointer ${
                        statusFilter === tab
                          ? 'bg-white dark:bg-slate-700 text-[#4648d4] dark:text-indigo-300 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tab === 'ALL' ? 'All' : tab === 'LOW' ? 'At Risk (<75%)' : 'Good (≥75%)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredSubjects.length === 0 ? (
              <Card className="p-8 text-center bg-white dark:bg-[#111726] border-slate-200/90 text-slate-400 text-xs">
                No matching course modules found.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map((sub) => {
                  const isLow = sub.total_sessions > 0 && sub.percentage < MIN_ATTENDANCE_THRESHOLD;
                  return (
                    <Card
                      key={sub.subject_id}
                      variant="solid"
                      hoverEffect
                      className={`p-5 bg-white dark:bg-[#111726] border rounded-2xl flex flex-col justify-between ${
                        isLow ? 'border-amber-300/80 dark:border-amber-800/80 shadow-xs' : 'border-slate-200/90 dark:border-white/10'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-[#4648d4] dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                              {sub.subject_code}
                            </span>
                            <h4 className="font-heading font-bold text-sm text-[#131b2e] dark:text-white mt-1.5">
                              {sub.subject_name}
                            </h4>
                          </div>
                          {isLow && (
                            <Badge variant="warning" className="text-[10px]">
                              At Risk
                            </Badge>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 mt-3">
                          <div className="flex justify-between text-xs font-semibold font-heading">
                            <span className="text-[#464554] dark:text-slate-400">Attendance:</span>
                            <span className={isLow ? 'text-amber-600 font-bold' : 'text-[#006c49] font-bold'}>
                              {sub.total_sessions === 0 ? 'No sessions' : `${sub.percentage.toFixed(1)}%`}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isLow ? 'bg-amber-500' : 'bg-[#006c49]'
                              }`}
                              style={{ width: `${Math.min(100, sub.percentage)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-[#464554] dark:text-slate-400">
                        <span>Attended: <strong className="text-slate-800 dark:text-slate-200">{sub.present_sessions + sub.late_sessions}</strong> / {sub.total_sessions}</span>
                        <span>Missed: <strong className="text-rose-600">{sub.absent_sessions}</strong></span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* 5. Recent Attendance Timeline & Activity Feed */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Attendance Records with Proof modal trigger */}
            <Card className="p-5 bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#4648d4]" />
                  <h3 className="font-heading font-bold text-sm text-[#131b2e] dark:text-white">
                    Recent Attendance Check-Ins
                  </h3>
                </div>
                <Link to="/student/attendance/history" className="text-xs text-[#4648d4] dark:text-indigo-400 font-bold hover:underline">
                  View All
                </Link>
              </div>

              {recentAttendance.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recent lecture attendance records.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {recentAttendance.slice(0, 5).map((rec, idx) => {
                    const recordId = rec.attendance_id || rec.session_id || String(idx);
                    return (
                      <div
                        key={recordId}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#171f33] border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-heading font-bold text-[#131b2e] dark:text-white">{rec.subject_name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {rec.marked_at ? new Date(rec.marked_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today'} &bull;{' '}
                            {rec.marked_at ? new Date(rec.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={rec.status === 'PRESENT' ? 'tertiary' : rec.status === 'LATE' ? 'warning' : 'error'}
                            className="text-[10px] font-bold"
                          >
                            {rec.status}
                          </Badge>
                          {rec.attendance_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setProofAttendanceId(rec.attendance_id || null)}
                              className="text-[11px] h-7 px-2"
                            >
                              <FileText className="w-3 h-3 mr-1 text-[#4648d4]" />
                              <span>Proof</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Activity Feed Card */}
            <ActivityFeedCard role="STUDENT" />
          </section>

          {/* Proof Modal */}
          {proofAttendanceId && (
            <AttendanceProofModal
              isOpen={Boolean(proofAttendanceId)}
              onClose={() => setProofAttendanceId(null)}
              attendanceId={proofAttendanceId}
              role="STUDENT"
            />
          )}
        </>
      )}
    </div>
  );
};
