import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  StudentProfile,
  Subject,
  StudentAttendanceSummary,
  StudentRecentAttendanceItem,
} from '../types';
import {
  apiGetStudentProfile,
  apiGetStudentSubjects,
  apiGetStudentAttendanceSummary,
  apiGetStudentRecentAttendance,
} from '../services/api';
import { useAuth } from '../auth/AuthContext';

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<StudentRecentAttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : 'Unable to load student profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <PageHeader
        title={`Hello, ${profile?.name || user?.name || 'Student'}`}
        description="Student academic portal. Scan live lecture QR codes, track your overall attendance percentage, and review course metrics."
        badge={
          <Badge variant="success" withDot>
            Student Workspace
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/attendance/scan">
              <Button variant="primary" size="sm" leftIcon={<Camera className="w-3.5 h-3.5" />}>
                Scan Attendance QR
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
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStudentData}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="min-h-[35vh] flex flex-col items-center justify-center p-8">
          <LoadingSpinner size="lg" label="Loading your academic profile & attendance summary..." />
        </div>
      ) : (
        <>
          {/* Top Grid: Profile + Class + Attendance KPI Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Student Profile Details */}
            <Card className="p-5 shadow-xs bg-white border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">
                      {profile?.name || user?.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">{profile?.email || user?.email}</p>
                  </div>
                </div>
                <Badge variant="success" withDot className="text-[10px]">
                  Enrolled
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Roll Number</span>
                  <p className="font-mono font-bold text-indigo-600 text-xs mt-0.5">
                    {profile?.roll_number || 'N/A'}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Department</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5 truncate">
                    {profile?.department || 'Computer Science'}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Semester & Section</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">
                    Sem {profile?.semester} &bull; Sec {profile?.section}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">System Role</span>
                  <p className="font-semibold text-emerald-700 text-xs mt-0.5">Student</p>
                </div>
              </div>
            </Card>

            {/* 2. Assigned Class Batch Card */}
            <Card className="p-5 shadow-xs bg-white border-slate-200/80 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-heading">
                        Assigned Class
                      </h3>
                      <p className="text-xs text-slate-500">Academic grouping</p>
                    </div>
                  </div>
                  {profile?.class ? (
                    <Badge variant="info">Assigned</Badge>
                  ) : (
                    <Badge variant="neutral">Pending</Badge>
                  )}
                </div>

                {profile?.class ? (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                    <h4 className="text-sm font-bold text-indigo-900 font-heading">
                      {profile.class.name}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Department: {profile.class.department}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-mono text-indigo-700 pt-1">
                      <span>Sem {profile.class.semester}</span>
                      <span>&bull;</span>
                      <span>Sec {profile.class.section}</span>
                      <span>&bull;</span>
                      <span>{profile.class.academic_year}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-700">No class assigned</p>
                    <p className="text-[11px] text-slate-400">
                      Awaiting batch assignment from admin.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* 3. Overall Attendance KPI Card */}
            <Card className="p-5 shadow-xs bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                    Attendance Overview
                  </span>
                  <Badge variant="success" withDot className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    Verified Metric
                  </Badge>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <div className="font-heading text-4xl font-extrabold text-white">
                    {summary ? summary.overall_percentage : 0}%
                  </div>
                  <span className="text-xs font-mono text-indigo-200 font-semibold">
                    {summary ? summary.total_present : 0} / {summary ? summary.total_sessions : 0} Lectures
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Cumulative presence across all subjects and lectures held for your class batch.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <Link to="/attendance/scan">
                  <Button variant="primary" size="sm" className="w-full text-xs" leftIcon={<Camera className="w-3.5 h-3.5" />}>
                    Scan Live QR Code
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Section: Subject-Wise Attendance Breakdown */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Subject-Wise Attendance Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Track your presence in each individual course module
                </p>
              </div>
              <Badge variant="info">
                {summary?.subjects?.length || subjects.length} Subjects
              </Badge>
            </div>

            {(!summary || summary.subjects.length === 0) && subjects.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-8 h-8" />}
                title="No subjects enrolled"
                description="Once your class is assigned to faculty courses, attendance metrics will be calculated here."
                badgeText="Curriculum Pending"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(summary?.subjects && summary.subjects.length > 0
                  ? summary.subjects
                  : subjects.map((s) => ({
                      subject_id: s.id,
                      subject_name: s.name,
                      subject_code: s.code,
                      present_sessions: 0,
                      total_sessions: 0,
                      percentage: 0.0,
                    }))
                ).map((sub) => (
                  <Card key={sub.subject_id} hoverEffect className="p-5 flex flex-col justify-between border-slate-200/80 shadow-xs space-y-3 bg-white">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <Badge variant="info" className="font-mono text-[11px]">
                          {sub.subject_code}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-heading">{sub.subject_name}</h4>
                        <div className="flex items-baseline justify-between text-xs pt-2">
                          <span className="text-slate-500">Lectures Attended:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {sub.present_sessions} / {sub.total_sessions}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Attendance Rate</span>
                          <span
                            className={`font-bold ${
                              sub.percentage >= 75 ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {sub.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              sub.percentage >= 75 ? 'bg-emerald-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, sub.percentage)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section: Recent Attendance Log */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Recent Attendance Check-Ins
                </h3>
                <p className="text-xs text-slate-500">
                  Your verified QR scan history across recent lectures
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {recentAttendance.length} logs recorded
              </span>
            </div>

            {recentAttendance.length === 0 ? (
              <Card className="p-6 text-center bg-white border-slate-200/80 space-y-2">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">
                  No attendance scans recorded yet. Use the "Scan Attendance QR" button when your teacher starts a live session.
                </p>
              </Card>
            ) : (
              <Card className="p-0 overflow-hidden bg-white border-slate-200/80 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Classroom</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Marked Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentAttendance.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 font-heading">{item.subject_name}</div>
                            <span className="font-mono text-[10px] text-indigo-600 font-semibold">
                              {item.subject_code}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">{item.class_name}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{item.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500">
                            {new Date(item.marked_at).toLocaleDateString()}{' '}
                            <span className="text-slate-800 font-semibold">
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
