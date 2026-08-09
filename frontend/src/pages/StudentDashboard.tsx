import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Building2,
  BookOpen,
  LogOut,
  RefreshCw,
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  Search,
  Filter,
  TrendingUp,
  ShieldAlert,
  Info,
  History,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
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
    // Fallback if subjects exist in class curriculum but summary hasn't had sessions yet
    return subjects.map((s) => ({
      subject_id: s.id,
      subject_name: s.name,
      subject_code: s.code,
      present_sessions: 0,
      absent_sessions: 0,
      total_sessions: 0,
      percentage: 0.0,
    }));
  }, [summary?.subjects, subjects]);

  // Low attendance subjects list (< 75% with held sessions)
  const lowAttendanceSubjects = useMemo(() => {
    return allSubjectStats.filter(
      (sub) => sub.total_sessions > 0 && sub.percentage < MIN_ATTENDANCE_THRESHOLD
    );
  }, [allSubjectStats]);

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
  const absentClasses = summary?.total_absent ?? Math.max(0, totalClasses - presentClasses);
  const overallPercentage = summary?.overall_percentage ?? 0.0;
  const isOverallLowAttendance = totalClasses > 0 && overallPercentage < MIN_ATTENDANCE_THRESHOLD;
  const allSubjectsHealthy = totalClasses > 0 && lowAttendanceSubjects.length === 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title={`Hello, ${profile?.name || user?.name || 'Student'}`}
        description="Student academic portal. Real-time verified attendance dashboard, subject breakdown, and QR check-in telemetry."
        badge={
          <Badge variant="success" withDot>
            Student Workspace
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
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
              <Button variant="primary" size="sm" leftIcon={<Camera className="w-3.5 h-3.5" />}>
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

      {/* Error Banner with Retry */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Unable to load attendance</p>
              <p className="text-rose-600">{error || "We couldn't retrieve your attendance data."}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStudentData} className="bg-white">
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8">
          <LoadingSpinner size="lg" label="Computing your attendance metrics and subject records..." />
        </div>
      ) : (
        <>
          {/* 2. Overall Low-Attendance Warning or Healthy State Banner */}
          {totalClasses > 0 && (
            <div>
              {isOverallLowAttendance ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-50/80 to-white dark:from-amber-950/40 dark:via-amber-950/20 dark:to-slate-900 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0 font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold font-heading text-amber-950 dark:text-amber-100">
                          ⚠️ Overall Attendance Warning
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                          Below {MIN_ATTENDANCE_THRESHOLD}% Minimum
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        Your overall attendance is currently{' '}
                        <strong className="font-mono text-amber-950 dark:text-amber-100 font-bold">{overallPercentage}%</strong>{' '}
                        (minimum required: <strong>{MIN_ATTENDANCE_THRESHOLD}%</strong>). You have attended{' '}
                        <strong>{presentClasses}</strong> of <strong>{totalClasses}</strong> scheduled classes{' '}
                        (<strong>{absentClasses}</strong> missed). Attend upcoming classes consistently to improve your attendance percentage.
                      </p>
                    </div>
                  </div>
                  <Link to="/attendance/scan" className="flex-shrink-0 w-full sm:w-auto">
                    <Button size="sm" variant="primary" className="w-full text-xs" leftIcon={<Camera className="w-3.5 h-3.5" />}>
                      Scan Lecture QR
                    </Button>
                  </Link>
                </div>
              ) : allSubjectsHealthy ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-white dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-slate-900 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200 shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold font-heading text-emerald-950 dark:text-emerald-100">
                          ✓ Attendance Requirements Met
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                          Good Standing
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                        Your attendance is currently above the {MIN_ATTENDANCE_THRESHOLD}% minimum required percentage across all enrolled subjects.
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right flex-shrink-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Status</span>
                    <span className="text-xs font-mono font-bold text-emerald-900 dark:text-emerald-100">
                      {presentClasses} / {totalClasses} Attended
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* 3. Professional Subject-Specific Low Attendance Warning Section */}
          {lowAttendanceSubjects.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 dark:border-amber-800/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100 font-heading">
                      ⚠️ Attendance Attention Required
                    </h3>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      You currently have attendance below the minimum required percentage ({MIN_ATTENDANCE_THRESHOLD}%) in{' '}
                      <strong>
                        {lowAttendanceSubjects.length} subject{lowAttendanceSubjects.length > 1 ? 's' : ''}
                      </strong>
                      .
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs bg-white dark:bg-slate-900 border-amber-300 text-amber-900 dark:text-amber-200 hover:bg-amber-100"
                  onClick={() => {
                    setStatusFilter('LOW');
                    const el = document.getElementById('subject-breakdown-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  View Affected Subjects ({lowAttendanceSubjects.length})
                </Button>
              </div>

              {/* Grid of Subject Warning Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowAttendanceSubjects.map((sub) => {
                  const isCritical = sub.percentage < CRITICAL_ATTENDANCE_THRESHOLD;

                  return (
                    <div
                      key={sub.subject_id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCritical
                          ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80 text-rose-950 dark:text-rose-100'
                          : 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700/80 text-slate-900 dark:text-slate-100 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {sub.subject_code}
                          </span>
                          <h4 className="text-xs font-bold font-heading mt-1 leading-snug">
                            {sub.subject_name}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isCritical
                              ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-300'
                              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300'
                          }`}
                        >
                          {isCritical ? 'Critical (<60%)' : 'Below Requirement'}
                        </span>
                      </div>

                      {/* Percentage & Counts */}
                      <div className="mt-3 flex items-baseline justify-between">
                        <div className="font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
                          {sub.percentage}%
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">{sub.present_sessions} Present</span> &bull;{' '}
                          <span className="font-semibold text-rose-700 dark:text-rose-400">{sub.absent_sessions} Absent</span> &bull;{' '}
                          <span>{sub.total_sessions} Total</span>
                        </div>
                      </div>

                      {/* Progress Bar with 75% target threshold marker */}
                      <div className="space-y-1 mt-2.5">
                        <div className="relative w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isCritical ? 'bg-rose-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, sub.percentage)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span>Current: {sub.percentage}%</span>
                          <span className="text-amber-700 dark:text-amber-400 font-semibold">
                            Required: {MIN_ATTENDANCE_THRESHOLD}%
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                        <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>Attend upcoming classes consistently to improve your attendance percentage.</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Four Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Overall Attendance % */}
            <Card className="p-5 shadow-xs bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-1.5 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                    Overall Attendance
                  </span>
                  <Badge
                    variant={overallPercentage >= MIN_ATTENDANCE_THRESHOLD ? 'success' : 'warning'}
                    className={`text-[10px] ${
                      overallPercentage >= MIN_ATTENDANCE_THRESHOLD
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {totalClasses === 0
                      ? 'No Data'
                      : overallPercentage >= MIN_ATTENDANCE_THRESHOLD
                      ? `✓ Met (≥${MIN_ATTENDANCE_THRESHOLD}%)`
                      : `⚠️ Below ${MIN_ATTENDANCE_THRESHOLD}%`}
                  </Badge>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-4xl font-extrabold font-heading font-mono text-white">
                    {overallPercentage}%
                  </span>
                  <span className="text-xs font-mono text-indigo-200">
                    Target: {MIN_ATTENDANCE_THRESHOLD}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${
                      overallPercentage >= MIN_ATTENDANCE_THRESHOLD ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, overallPercentage)}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-300 pt-3 relative z-10">
                Calculated across all courses & lectures held for your class batch.
              </p>
            </Card>

            {/* KPI 2: Total Present */}
            <Card className="p-5 shadow-xs bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Lectures Attended
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading font-mono">
                    {presentClasses}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">sessions</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Verified Presence</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Marked via QR</span>
              </div>
            </Card>

            {/* KPI 3: Total Absent / Missed */}
            <Card className="p-5 shadow-xs bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Lectures Missed
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                    <XCircle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading font-mono">
                    {absentClasses}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">sessions</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Unrecorded Sessions</span>
                <span className={`font-semibold ${absentClasses > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500'}`}>
                  {absentClasses === 0 ? 'Zero Absences' : `${absentClasses} Missed`}
                </span>
              </div>
            </Card>

            {/* KPI 4: Total Held Classes */}
            <Card className="p-5 shadow-xs bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Total Held Classes
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading font-mono">
                    {totalClasses}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">total lectures</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Curriculum Total</span>
                <span className="font-semibold text-indigo-700 dark:text-indigo-400">{allSubjectStats.length} Subjects</span>
              </div>
            </Card>
          </div>

          {/* 5. Student Profile Summary + Assigned Class Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Profile Card */}
            <Card className="p-5 shadow-xs bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                      {profile?.name || user?.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{profile?.email || user?.email}</p>
                  </div>
                </div>
                <Badge variant="success" withDot className="text-[10px]">
                  Enrolled Student
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Roll Number</span>
                  <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs mt-0.5">
                    {profile?.roll_number || 'N/A'}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Department</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5 truncate">
                    {profile?.department || 'Computer Science'}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Semester & Section</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5">
                    Sem {profile?.semester} &bull; Sec {profile?.section}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Attendance Status</span>
                  <p
                    className={`font-semibold text-xs mt-0.5 ${
                      isOverallLowAttendance ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {totalClasses === 0
                      ? 'Awaiting Sessions'
                      : isOverallLowAttendance
                      ? '⚠️ Needs Improvement'
                      : '✓ In Good Standing'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Assigned Class Batch Card */}
            <Card className="p-5 shadow-xs bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                        Assigned Class Batch
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Academic classroom allocation</p>
                    </div>
                  </div>
                  {profile?.class ? (
                    <Badge variant="info">Batch Active</Badge>
                  ) : (
                    <Badge variant="neutral">Pending</Badge>
                  )}
                </div>

                {profile?.class ? (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/60 space-y-1">
                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 font-heading">
                      {profile.class.name}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Department: {profile.class.department}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-mono text-indigo-700 dark:text-indigo-300 pt-1">
                      <span>Sem {profile.class.semester}</span>
                      <span>&bull;</span>
                      <span>Sec {profile.class.section}</span>
                      <span>&bull;</span>
                      <span>{profile.class.academic_year}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No class assigned</p>
                    <p className="text-[11px] text-slate-400">
                      Awaiting classroom batch assignment from administration.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Link to="/attendance/scan">
                  <Button size="sm" variant="outline" leftIcon={<Camera className="w-3.5 h-3.5" />}>
                    Open Scanner
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* 6. Section: Subject-Wise Attendance Breakdown */}
          <div id="subject-breakdown-section" className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  Subject-Wise Attendance Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Individual presence percentages, attended sessions, and requirement status per course
                </p>
              </div>

              {/* Status Segmented Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    statusFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({allSubjectStats.length})
                </button>
                <button
                  onClick={() => setStatusFilter('LOW')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    statusFilter === 'LOW'
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-amber-700'
                  }`}
                >
                  Low &lt;{MIN_ATTENDANCE_THRESHOLD}% ({lowAttendanceSubjects.length})
                </button>
                <button
                  onClick={() => setStatusFilter('MET')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    statusFilter === 'MET'
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700'
                  }`}
                >
                  Met &ge;{MIN_ATTENDANCE_THRESHOLD}% ({allSubjectStats.length - lowAttendanceSubjects.length})
                </button>
              </div>
            </div>

            {/* Search Input Filter */}
            <div className="relative max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by subject name or course code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition"
              />
            </div>

            {/* Empty State when no subjects enrolled or no attendance recorded yet */}
            {allSubjectStats.length === 0 ? (
              <Card className="p-8 text-center bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white font-heading">No attendance records yet</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                    Your attendance statistics will appear here automatically after your classes begin and
                    you scan your first attendance QR code.
                  </p>
                </div>
                <div>
                  <Link to="/attendance/scan">
                    <Button variant="primary" size="sm" leftIcon={<Camera className="w-3.5 h-3.5" />}>
                      Scan QR Code
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : filteredSubjects.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400">
                <Filter className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p>No subjects match the selected filter query "{searchQuery}".</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 text-xs"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              /* Grid of Subject Attendance Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map((sub) => {
                  const hasSessions = sub.total_sessions > 0;
                  const isMet = !hasSessions || sub.percentage >= MIN_ATTENDANCE_THRESHOLD;
                  const isCritical = hasSessions && sub.percentage < CRITICAL_ATTENDANCE_THRESHOLD;

                  return (
                    <Card
                      key={sub.subject_id}
                      hoverEffect
                      className={`p-5 flex flex-col justify-between shadow-xs space-y-4 ${
                        !isMet
                          ? isCritical
                            ? 'bg-rose-50/20 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                            : 'bg-amber-50/20 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Subject Header & Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold flex-shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <Badge variant="info" className="font-mono text-[10px]">
                              {sub.subject_code}
                            </Badge>
                            {hasSessions && (
                              <Badge
                                variant={isMet ? 'success' : isCritical ? 'error' : 'warning'}
                                className={`text-[10px] ${
                                  isMet
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : isCritical
                                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                {isMet
                                  ? '✓ Requirement Met'
                                  : isCritical
                                  ? '⚠️ Critical (<60%)'
                                  : '⚠️ Below Requirement'}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading leading-snug">
                            {sub.subject_name}
                          </h4>
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">{sub.subject_code}</p>
                        </div>

                        {/* Progress Bar & Rate */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-baseline text-xs font-mono">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-sans">
                              Attendance Rate
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                !hasSessions
                                  ? 'text-slate-400'
                                  : sub.percentage >= MIN_ATTENDANCE_THRESHOLD
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : isCritical
                                  ? 'text-rose-700 dark:text-rose-400'
                                  : 'text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {sub.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ${
                                !hasSessions
                                  ? 'bg-slate-300'
                                  : sub.percentage >= MIN_ATTENDANCE_THRESHOLD
                                  ? 'bg-emerald-600'
                                  : sub.percentage >= CRITICAL_ATTENDANCE_THRESHOLD
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, sub.percentage)}%` }}
                            />
                          </div>
                        </div>

                        {/* Metrics Breakdown Grid */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2 text-center text-xs">
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">
                              Present
                            </span>
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                              {sub.present_sessions}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">
                              Absent
                            </span>
                            <span
                              className={`font-mono font-bold text-xs ${
                                sub.absent_sessions > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500'
                              }`}
                            >
                              {sub.absent_sessions}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">
                              Total
                            </span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {sub.total_sessions}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <TrendingUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>Status</span>
                        </span>
                        <span
                          className={`font-semibold ${
                            !hasSessions
                              ? 'text-slate-400'
                              : isMet
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : isCritical
                              ? 'text-rose-700 dark:text-rose-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {!hasSessions
                            ? 'No Lectures Held'
                            : isMet
                            ? 'Healthy Attendance'
                            : isCritical
                            ? 'Critical Action Required'
                            : 'Attendance Action Required'}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7. Section: Recent Attendance Log */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  Recent Attendance Check-Ins
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your verified QR scan history across recent lectures
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {recentAttendance.length} logs recorded
              </span>
            </div>

            {recentAttendance.length === 0 ? (
              <Card className="p-6 text-center bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 space-y-2">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No attendance scans recorded yet. Use the "Scan Attendance QR" button when your teacher starts a live session.
                </p>
              </Card>
            ) : (
              <Card className="p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Classroom</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Marked Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {recentAttendance.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white font-heading">{item.subject_name}</div>
                            <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                              {item.subject_code}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{item.class_name}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{item.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {new Date(item.marked_at).toLocaleDateString()}{' '}
                            <span className="text-slate-800 dark:text-slate-200 font-semibold">
                              {new Date(item.marked_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};
