import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  School,
  BookOpen,
  Building2,
  QrCode,
  LogOut,
  RefreshCw,
  AlertCircle,
  Play,
  Clock,
  Eye,
  X,
  Users,
  TrendingUp,
  User,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { ActivityFeedCard } from '../components/ActivityFeedCard';
import {
  TeacherAssignmentItem,
  TeacherProfile,
  AttendanceSession,
} from '../types';
import {
  apiGetTeacherProfile,
  apiGetTeacherAssignments,
  apiGetTeacherSessions,
  apiCreateAttendanceSession,
} from '../services/api';
import { useAuth } from '../auth/AuthContext';

export const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Start Session Modal State
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignmentItem | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  const [startingSession, setStartingSession] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchTeacherData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, assignmentsRes, sessionsRes] = await Promise.all([
        apiGetTeacherProfile().catch(() => null),
        apiGetTeacherAssignments(),
        apiGetTeacherSessions().catch(() => ({ data: [] })),
      ]);
      if (profileRes) {
        // Support both legacy { profile } and new { data: { teacher } } shapes
        const teacherData = (profileRes as any).data?.teacher || (profileRes as any).profile || null;
        setProfile(teacherData);
      }
      setAssignments(assignmentsRes.data || []);
      setSessions(sessionsRes.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load teacher data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  // Open session launch modal
  const openLaunchModal = (assignment: TeacherAssignmentItem) => {
    setSelectedAssignment(assignment);
    setDurationMinutes(5);
    setModalError(null);
  };

  const confirmLaunchSession = async () => {
    if (!selectedAssignment) return;
    setStartingSession(true);
    setModalError(null);
    try {
      const res = await apiCreateAttendanceSession({
        subject_id: selectedAssignment.subject_id,
        class_id: selectedAssignment.class_id,
        duration_minutes: durationMinutes,
      });
      if (res.data) {
        navigate(`/teacher/attendance/${res.data.id}`);
      }
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Failed to start attendance session');
    } finally {
      setStartingSession(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <PageHeader
        title={`Welcome back, ${user?.name || 'Faculty Member'}`}
        description="Faculty portal for academic course management, assigned classroom lecture batches, and attendance sessions."
        badge={
          <Badge variant="warning" withDot>
            Faculty Workspace
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/teacher/profile">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<User className="w-3.5 h-3.5" />}
              >
                My Profile
              </Button>
            </Link>
            <Link to="/teacher/attendance/analytics">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<TrendingUp className="w-3.5 h-3.5" />}
              >
                Analytics & Insights
              </Button>
            </Link>
            <Link to="/teacher/students/attendance">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Users className="w-3.5 h-3.5" />}
              >
                Student Search
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTeacherData}
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
          title="Unable to Load Faculty Dashboard"
          error={error}
          onRetry={fetchTeacherData}
          retryLabel="Retry"
        />
      )}

      {/* Teacher Profile Banner & Quick Status */}
      <Card variant="glass" className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                {profile?.name || user?.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Employee ID: <span className="font-semibold text-amber-700 dark:text-amber-400">{profile?.employee_id || 'Faculty Account'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <Badge variant="neutral" className="text-xs">
              Department: {profile?.department || 'Academic Faculty'}
            </Badge>
            <Badge variant="success" withDot className="text-xs">
              Active Instructor
            </Badge>
            <Link to="/teacher/profile">
              <Button variant="outline" size="sm" leftIcon={<User className="w-3.5 h-3.5" />} className="text-xs">
                My Profile
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Section 1: Assigned Classes & Start Attendance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              My Classes & Teaching Allocations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a subject and classroom to start a live QR attendance session
            </p>
          </div>
          <Badge variant="info">
            {assignments.length} Allocated Courses
          </Badge>
        </div>

        {loading ? (
          <LoadingState variant="kpi" cards={3} message="Loading your assigned courses..." />
        ) : assignments.length === 0 ? (
          <EmptyState
            preset="NO_DATA"
            icon={<BookOpen className="w-8 h-8 text-indigo-400" />}
            title="No Classes Assigned Yet"
            description="You do not have any teaching allocations assigned by the administrator yet. Once assigned, you can start live QR attendance sessions here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((item) => (
              <Card key={item.assignment_id} variant="glass" hoverEffect className="p-5 flex flex-col justify-between shadow-xs space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold flex-shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <Badge variant="info" className="font-mono text-[11px]">
                      {item.code}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading">{item.subject}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.department}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{item.class}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Semester {item.semester} &bull; Section {item.section} ({item.academic_year})
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/50 dark:border-white/5">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    leftIcon={<Play className="w-3.5 h-3.5" />}
                    onClick={() => openLaunchModal(item)}
                  >
                    Start Attendance
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Recent Attendance Sessions History */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              Recent Attendance Sessions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review live and concluded lecture sessions and verify student records
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">{sessions.length} sessions</span>
            <Link to="/teacher/attendance/history">
              <Button variant="outline" size="sm" className="text-xs py-1">
                View All History &rarr;
              </Button>
            </Link>
          </div>
        </div>

        {sessions.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">No attendance sessions created yet. Click "Start Attendance" on any class above to launch your first session.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Class Batch</th>
                    <th className="py-3 px-4">Present / Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{new Date(s.started_at).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white font-heading">{s.subject_name}</div>
                        <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{s.subject_code}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{s.class_name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">Sem {s.semester} &bull; Sec {s.section}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{s.present_count}</span>
                        <span className="text-slate-400 dark:text-slate-500"> / {s.total_students}</span>
                        <span className="ml-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">({s.percentage}%)</span>
                      </td>
                      <td className="py-3 px-4">
                        {s.is_active && !s.is_expired ? (
                          <Badge variant="success" withDot>
                            Live
                          </Badge>
                        ) : s.is_expired ? (
                          <Badge variant="neutral">Expired</Badge>
                        ) : (
                          <Badge variant="warning">Ended</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {s.is_active && !s.is_expired && (
                          <Link to={`/teacher/attendance/${s.id}`}>
                            <Button size="sm" variant="primary" leftIcon={<QrCode className="w-3 h-3" />} className="text-xs py-1">
                              Show QR
                            </Button>
                          </Link>
                        )}
                        <Link to={`/teacher/attendance/${s.id}/records`}>
                          <Button size="sm" variant="outline" leftIcon={<Eye className="w-3 h-3" />} className="text-xs py-1">
                            View Roster
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Recent Activity Feed (Feature #16) */}
      <ActivityFeedCard
        role="TEACHER"
        limit={5}
        title="Recent Course Attendance Activity"
        subtitle="Live check-ins, late recordings, manual edits, and finalized sessions across your curriculum"
      />

      {/* Start Attendance Setup Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">Start Attendance Session</h3>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Assignment Details Confirmation */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Course Subject</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm font-heading">{selectedAssignment.subject}</p>
                  <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{selectedAssignment.code}</span>
                </div>
                <div className="pt-2 border-t border-indigo-100/60 dark:border-indigo-800/40">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Target Class</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedAssignment.class}</p>
                  <span className="text-slate-500 dark:text-slate-400">
                    Semester {selectedAssignment.semester} &bull; Section {selectedAssignment.section} ({selectedAssignment.academic_year})
                  </span>
                </div>
              </div>

              {/* Duration Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] block">
                  Session Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={1}>1 Minute (Fast Testing / Demo)</option>
                  <option value={5}>5 Minutes (Recommended Standard)</option>
                  <option value={10}>10 Minutes (Extended Lecture Window)</option>
                </select>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  The QR code will automatically expire when the timer reaches zero.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedAssignment(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmLaunchSession}
                isLoading={startingSession}
                leftIcon={<Play className="w-3.5 h-3.5" />}
              >
                Launch QR Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
