import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Printer,
  Download,
  FileText,
  FileSpreadsheet,
  FileDown,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ManualAttendanceModal } from '../components/ManualAttendanceModal';
import { CorrectAttendanceModal } from '../components/CorrectAttendanceModal';
import { AttendanceAuditHistoryModal } from '../components/AttendanceAuditHistoryModal';
import { SessionAttendanceDetails, AttendanceExportFormat } from '../types';
import { apiGetSessionAttendanceRecords, apiExportTeacherAttendance } from '../services/api';

export const TeacherSessionAttendancePage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [data, setData] = useState<SessionAttendanceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'LATE' | 'ABSENT'>('ALL');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<AttendanceExportFormat | null>(null);

  // Feature #11 Modals State
  const [manualModalOpen, setManualModalOpen] = useState<boolean>(false);
  const [selectedStudentForManual, setSelectedStudentForManual] = useState<string | undefined>(undefined);
  const [correctModalOpen, setCorrectModalOpen] = useState<boolean>(false);
  const [correctingStudent, setCorrectingStudent] = useState<{
    student: { name: string; roll_number: string };
    attendanceId: string;
    status: 'PRESENT' | 'LATE' | 'ABSENT';
  } | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);
  const [auditStudent, setAuditStudent] = useState<{
    attendanceId: string;
    studentName: string;
    rollNumber: string;
    subjectName: string;
  } | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetSessionAttendanceRecords(sessionId);
      setData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Filter students by name, roll number, and status
  const filteredRecords = useMemo(() => {
    if (!data) return [];
    return data.records.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.roll_number.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" label="Loading classroom attendance roster..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center space-y-4">
        <Card className="p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">Attendance Record Error</h3>
            <p className="text-xs text-slate-500 mt-1">{error || 'Session records not found.'}</p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <Link to="/teacher/attendance/history">
              <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Sessions
              </Button>
            </Link>
            <Link to="/teacher">
              <Button size="sm" variant="primary">
                Teacher Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { session } = data;
  const lateCount = data.late_count ?? 0;
  const attendedCount = data.present_count + lateCount;
  const absentCount = Math.max(0, data.total_students - attendedCount);
  const duration = session.duration_minutes || Math.max(1, Math.round((new Date(session.expires_at).getTime() - new Date(session.started_at).getTime()) / 60000));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/teacher/attendance/history"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Attendance Sessions</span>
        </Link>

        <div className="flex items-center gap-2">
          {session.is_active && !session.is_expired ? (
            <Link to={`/teacher/attendance/live/${session.id}`}>
              <Button size="sm" variant="primary" className="text-xs">
                Open Live QR Projector
              </Button>
            </Link>
          ) : (
            <Badge variant="neutral" className="text-xs">
              Session Closed
            </Badge>
          )}
        </div>
      </div>

      <PageHeader
        title={`${session.subject_name} — Attendance Roster`}
        description={`${session.class_name} (${session.department}, Sem ${session.semester}) • Subject Code: ${session.subject_code} • Duration: ${duration}m • Late Threshold: ${session.late_threshold_minutes ?? 10}m`}
        badge={
          session.is_active && !session.is_expired ? (
            <Badge variant="success" withDot>LIVE SESSION</Badge>
          ) : session.is_expired ? (
            <Badge variant="neutral">EXPIRED</Badge>
          ) : (
            <Badge variant="neutral">CLOSED</Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Manual Attendance Trigger */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedStudentForManual(undefined);
                setManualModalOpen(true);
              }}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
            >
              Manual Mark
            </Button>

            {/* Export Roster Dropdown */}
            <div className="relative inline-block text-left">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                isLoading={isExporting}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                rightIcon={<ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              >
                {isExporting ? `Exporting ${exportingFormat?.toUpperCase()}...` : 'Export Roster'}
              </Button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-2xl bg-white border border-slate-200/90 shadow-xl py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Export Session Report
                  </div>
                  <button
                    onClick={async () => {
                      setIsExportMenuOpen(false);
                      setIsExporting(true);
                      setExportingFormat('csv');
                      try {
                        await apiExportTeacherAttendance('csv', {
                          class_id: session.class_id,
                          subject_id: session.subject_id,
                          from: session.started_at.slice(0, 10),
                          to: session.started_at.slice(0, 10),
                        });
                      } finally {
                        setIsExporting(false);
                        setExportingFormat(null);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2.5 transition"
                  >
                    <FileText className="w-4 h-4 text-sky-600" />
                    CSV (.csv)
                  </button>
                  <button
                    onClick={async () => {
                      setIsExportMenuOpen(false);
                      setIsExporting(true);
                      setExportingFormat('excel');
                      try {
                        await apiExportTeacherAttendance('excel', {
                          class_id: session.class_id,
                          subject_id: session.subject_id,
                          from: session.started_at.slice(0, 10),
                          to: session.started_at.slice(0, 10),
                        });
                      } finally {
                        setIsExporting(false);
                        setExportingFormat(null);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2.5 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Excel (.xlsx)
                  </button>
                  <button
                    onClick={async () => {
                      setIsExportMenuOpen(false);
                      setIsExporting(true);
                      setExportingFormat('pdf');
                      try {
                        await apiExportTeacherAttendance('pdf', {
                          class_id: session.class_id,
                          subject_id: session.subject_id,
                          from: session.started_at.slice(0, 10),
                          to: session.started_at.slice(0, 10),
                        });
                      } finally {
                        setIsExporting(false);
                        setExportingFormat(null);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2.5 transition"
                  >
                    <FileDown className="w-4 h-4 text-rose-600" />
                    PDF Document (.pdf)
                  </button>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex"
            >
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecords}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Overview Stats (Feature #12: Total, Present, Late, Absent, Attendance Rate) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3.5 border-slate-200">
          <p className="text-[10px] font-bold uppercase text-slate-400">Total Enrolled</p>
          <p className="text-xl font-extrabold text-slate-900 font-heading">{data.total_students}</p>
        </Card>
        <Card className="p-3.5 border-emerald-100 bg-emerald-50/40">
          <p className="text-[10px] font-bold uppercase text-emerald-700">On-Time</p>
          <p className="text-xl font-extrabold text-emerald-800 font-heading">{data.present_count}</p>
        </Card>
        <Card className="p-3.5 border-amber-200 bg-amber-50/50">
          <p className="text-[10px] font-bold uppercase text-amber-700">Late ({data.late_percentage}%)</p>
          <p className="text-xl font-extrabold text-amber-800 font-heading">{lateCount}</p>
        </Card>
        <Card className="p-3.5 border-slate-200">
          <p className="text-[10px] font-bold uppercase text-slate-500">Absent</p>
          <p className="text-xl font-extrabold text-slate-700 font-heading">{absentCount}</p>
        </Card>
        <Card className="p-3.5 border-indigo-100 bg-indigo-50/40 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold uppercase text-indigo-700">Attended Rate</p>
          <p className="text-xl font-extrabold text-indigo-900 font-heading font-mono">{data.percentage}%</p>
        </Card>
      </div>

      {/* Roster Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase">Students ({filteredRecords.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs shadow-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({data.records.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PRESENT')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'PRESENT' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                On-Time ({data.present_count})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('LATE')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'LATE' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Late ({lateCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ABSENT')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'ABSENT' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Absent ({absentCount})
              </button>
            </div>

            <div className="w-48 sm:w-60">
              <Input
                placeholder="Search name, roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Roll</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Marked</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((st) => (
                <tr key={st.student_id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{st.roll_number}</td>
                  <td className="py-3 px-4 font-semibold">{st.name}</td>
                  <td className="py-3 px-4">
                    {st.status === 'PRESENT' ? (
                      <Badge variant="success" className="text-[10px]">PRESENT</Badge>
                    ) : st.status === 'LATE' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                        LATE
                      </span>
                    ) : (
                      <Badge variant="neutral" className="text-[10px]">ABSENT</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500">
                    {st.marked_at ? new Date(st.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {st.attendance_id ? (
                      <>
                        <button onClick={() => {
                          setCorrectingStudent({ student: { name: st.name, roll_number: st.roll_number }, attendanceId: st.attendance_id!, status: st.status });
                          setCorrectModalOpen(true);
                        }} className="text-amber-600 font-bold hover:underline">Correct</button>
                        <button onClick={() => {
                          setAuditStudent({ attendanceId: st.attendance_id!, studentName: st.name, rollNumber: st.roll_number, subjectName: session.subject_name });
                          setAuditModalOpen(true);
                        }} className="text-indigo-600 font-bold hover:underline">Audit</button>
                      </>
                    ) : (
                      <button onClick={() => {
                        setSelectedStudentForManual(st.student_id);
                        setManualModalOpen(true);
                      }} className="text-emerald-600 font-bold hover:underline">Mark Manual</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      {manualModalOpen && (
        <ManualAttendanceModal
          isOpen={manualModalOpen}
          onClose={() => setManualModalOpen(false)}
          onSuccess={fetchRecords}
          session={{ id: session.id, subject_name: session.subject_name, subject_code: session.subject_code, class_name: session.class_name }}
          students={data.records}
          initialStudentId={selectedStudentForManual}
        />
      )}
      {correctModalOpen && correctingStudent && (
        <CorrectAttendanceModal
          isOpen={correctModalOpen}
          onClose={() => setCorrectModalOpen(false)}
          onSuccess={fetchRecords}
          attendanceId={correctingStudent.attendanceId}
          student={correctingStudent.student}
          sessionInfo={{ subject_name: session.subject_name, subject_code: session.subject_code, class_name: session.class_name }}
          currentStatus={correctingStudent.status}
        />
      )}
      {auditModalOpen && auditStudent && (
        <AttendanceAuditHistoryModal
          isOpen={auditModalOpen}
          onClose={() => setAuditModalOpen(false)}
          attendanceId={auditStudent.attendanceId}
          studentName={auditStudent.studentName}
          rollNumber={auditStudent.rollNumber}
          subjectName={auditStudent.subjectName}
        />
      )}
    </div>
  );
};
