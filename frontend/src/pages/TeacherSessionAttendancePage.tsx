import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Printer,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SessionAttendanceDetails } from '../types';
import { apiGetSessionAttendanceRecords } from '../services/api';

export const TeacherSessionAttendancePage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [data, setData] = useState<SessionAttendanceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter students by name or roll number
  const filteredRecords = data?.records.filter((r) => {
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.roll_number.toLowerCase().includes(q);
  }) || [];

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
          <div className="pt-2">
            <Link to="/teacher">
              <Button size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to Teacher Portal
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { session } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={`${session.subject_name} — Attendance Roster`}
        description={`Classroom attendance report for ${session.class_name} • Semester ${session.semester} (${session.section}).`}
        badge={
          <Badge variant="info" withDot>
            {data.percentage}% Overall Attendance
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/teacher">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Dashboard
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex"
            >
              Print Roster
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

      {/* Session Overview KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Course Subject</span>
          <p className="text-sm font-bold text-slate-900 font-heading truncate">{session.subject_name}</p>
          <span className="font-mono text-xs text-indigo-600 font-semibold">{session.subject_code}</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Batch</span>
          <p className="text-sm font-bold text-slate-900 font-heading truncate">{session.class_name}</p>
          <span className="text-xs text-slate-500 font-medium">
            Sem {session.semester} &bull; Sec {session.section}
          </span>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Session Timing</span>
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date(session.started_at).toLocaleDateString()}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </Card>

        <Card className="p-4 bg-white border-emerald-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Attendance Rate</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-800 font-heading">
              {data.present_count} / {data.total_students}
            </span>
            <span className="text-sm font-bold text-emerald-700 font-mono">{data.percentage}%</span>
          </div>
        </Card>
      </div>

      {/* Student Roster Table Card */}
      <Card className="p-0 overflow-hidden bg-white border-slate-200/80 shadow-sm">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-heading">
              Student Attendance List ({filteredRecords.length})
            </h4>
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Search by student or roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Attendance Status</th>
                <th className="py-3 px-4 text-right">Marked Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    No matching student records found for this class.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((st) => (
                  <tr key={st.student_id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-600 bg-indigo-50/20 rounded">
                      {st.roll_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 font-heading">{st.name}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{st.email}</td>
                    <td className="py-3 px-4">
                      {st.status === 'PRESENT' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PRESENT</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 border border-slate-200">
                          <span>ABSENT</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 text-[11px]">
                      {st.marked_at
                        ? new Date(st.marked_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
