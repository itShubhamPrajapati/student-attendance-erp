import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Users,
  Eye,
  RefreshCw,
  X,
  Lock,
  Unlock,
  History,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ReopenAttendanceSessionModal } from '../components/ReopenAttendanceSessionModal';
import { AttendanceSessionAuditHistoryModal } from '../components/AttendanceSessionAuditHistoryModal';
import {
  AttendanceSession,
  Subject,
  Class,
  SessionAttendanceDetails,
} from '../types';
import {
  apiGetAdminAttendanceSessions,
  apiGetAdminSessionRecords,
  apiGetSubjects,
  apiGetClasses,
  apiFinalizeAdminSession,
} from '../services/api';

export const AdminAttendancePage: React.FC = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Selected session for roster inspection modal
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [rosterDetails, setRosterDetails] = useState<SessionAttendanceDetails | null>(null);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Feature #13 - Reopen & Audit modal state
  const [reopenModalSession, setReopenModalSession] = useState<AttendanceSession | null>(null);
  const [sessionAuditSession, setSessionAuditSession] = useState<AttendanceSession | null>(null);
  const [finalizingSessionId, setFinalizingSessionId] = useState<string | null>(null);

  const fetchFiltersAndSessions = useCallback(async () => {
    setLoading(true);
    try {
      const [sessRes, subRes, clsRes] = await Promise.all([
        apiGetAdminAttendanceSessions({
          date: dateFilter || undefined,
          subject_id: subjectFilter || undefined,
          class_id: classFilter || undefined,
        }),
        apiGetSubjects().catch(() => ({ data: [] })),
        apiGetClasses().catch(() => ({ data: [] })),
      ]);

      setSessions(sessRes.data || []);
      setSubjects(subRes.data || []);
      setClasses(clsRes.data || []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }, [dateFilter, subjectFilter, classFilter]);

  useEffect(() => {
    fetchFiltersAndSessions();
  }, [fetchFiltersAndSessions]);

  // Open session detail modal
  const handleOpenRoster = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setLoadingRoster(true);
    try {
      const res = await apiGetAdminSessionRecords(sessionId);
      setRosterDetails(res.data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to fetch session records');
      setSelectedSessionId(null);
    } finally {
      setLoadingRoster(false);
    }
  };

  // Feature #13: Finalize session (admin)
  const handleAdminFinalizeSession = async (sessionId: string) => {
    if (!confirm('Finalize this attendance session? Teachers will no longer be able to mark or correct attendance.')) return;
    setFinalizingSessionId(sessionId);
    try {
      await apiFinalizeAdminSession(sessionId);
      await fetchFiltersAndSessions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to finalize session');
    } finally {
      setFinalizingSessionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="College Attendance History"
        description="Comprehensive audit of all QR attendance sessions initiated by faculty across departments."
        badge={
          <Badge variant="info" withDot>
            {sessions.length} Total Sessions Recorded
          </Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFiltersAndSessions}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Logs
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Filter by Date
            </label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFilter(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Filter by Subject
            </label>
            <select
              value={subjectFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSubjectFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Filter by Class
            </label>
            <select
              value={classFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setClassFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — Sem {c.semester} ({c.section})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setDateFilter('');
                setSubjectFilter('');
                setClassFilter('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Sessions Table Card */}
      <Card className="p-0 overflow-hidden bg-white border-slate-200/80 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-heading">
              Attendance Sessions
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-medium">{sessions.length} sessions</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner size="md" label="Loading college attendance records..." />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No attendance sessions matching the specified criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Faculty Teacher</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Class Batch</th>
                  <th className="py-3 px-4">Attendance Rate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <div className="font-semibold text-slate-900">{new Date(s.started_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 font-heading">{s.teacher_name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{s.teacher_employee_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{s.subject_name}</div>
                      <div className="font-mono text-[10px] text-indigo-600">{s.subject_code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{s.class_name}</div>
                      <div className="text-[10px] text-slate-400">
                        Sem {s.semester} &bull; Sec {s.section}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-slate-900">{s.present_count}</span>
                      <span className="text-slate-400"> / {s.total_students}</span>
                      <span className="ml-1 text-[11px] font-bold text-indigo-600">({s.percentage}%)</span>
                    </td>
                    <td className="py-3 px-4">
                      {s.finalization_status === 'FINALIZED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                          <Lock className="w-2.5 h-2.5" /> FINALIZED
                        </span>
                      ) : s.is_active && !s.is_expired ? (
                        <Badge variant="success" withDot>
                          Active
                        </Badge>
                      ) : s.is_expired ? (
                        <Badge variant="neutral">Expired</Badge>
                      ) : (
                        <Badge variant="warning">Ended</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenRoster(s.id)}
                          leftIcon={<Eye className="w-3 h-3" />}
                          className="text-xs"
                        >
                          View Roster
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSessionAuditSession(s)}
                          leftIcon={<History className="w-3 h-3 text-indigo-500" />}
                          className="text-xs"
                        >
                          Audit
                        </Button>
                        {s.finalization_status === 'FINALIZED' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReopenModalSession(s)}
                            leftIcon={<Unlock className="w-3 h-3 text-amber-600" />}
                            className="text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                          >
                            Reopen
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdminFinalizeSession(s.id)}
                            isLoading={finalizingSessionId === s.id}
                            leftIcon={<Lock className="w-3 h-3 text-purple-600" />}
                            className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            Finalize
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Roster Inspection Modal */}
      {selectedSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 font-heading">Session Attendance Details</h3>
              </div>
              <button
                onClick={() => setSelectedSessionId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {loadingRoster || !rosterDetails ? (
                <div className="p-8 text-center">
                  <LoadingSpinner size="md" label="Loading roster..." />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 text-xs p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div>
                      <span className="text-slate-400 uppercase font-bold text-[10px]">Subject</span>
                      <p className="font-bold text-slate-900">{rosterDetails.session.subject_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-bold text-[10px]">Class</span>
                      <p className="font-bold text-slate-900">{rosterDetails.session.class_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-bold text-[10px]">Attendance</span>
                      <p className="font-bold text-emerald-700">
                        {rosterDetails.present_count} / {rosterDetails.total_students} ({rosterDetails.percentage}%)
                      </p>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/70 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="py-2 px-3">Roll No</th>
                        <th className="py-2 px-3">Student Name</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Marked Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rosterDetails.records.map((r) => (
                        <tr key={r.student_id}>
                          <td className="py-2 px-3 font-mono font-semibold text-indigo-600">{r.roll_number}</td>
                          <td className="py-2 px-3 font-medium text-slate-800">{r.name}</td>
                          <td className="py-2 px-3">
                            {r.status === 'PRESENT' ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                PRESENT
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                ABSENT
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-500">
                            {r.marked_at
                              ? new Date(r.marked_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedSessionId(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Finalized Session Modal (Feature #13) */}
      {reopenModalSession && (
        <ReopenAttendanceSessionModal
          isOpen={!!reopenModalSession}
          onClose={() => setReopenModalSession(null)}
          sessionId={reopenModalSession.id}
          subjectName={reopenModalSession.subject_name}
          classNameStr={reopenModalSession.class_name}
          onSuccess={() => {
            setReopenModalSession(null);
            fetchFiltersAndSessions();
          }}
        />
      )}

      {/* Session Audit Modal (Feature #13) */}
      {sessionAuditSession && (
        <AttendanceSessionAuditHistoryModal
          isOpen={!!sessionAuditSession}
          onClose={() => setSessionAuditSession(null)}
          sessionId={sessionAuditSession.id}
          subjectName={sessionAuditSession.subject_name}
          classNameStr={sessionAuditSession.class_name}
          role="ADMIN"
        />
      )}
    </div>
  );
};
