import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Printer,
  Clock,
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');

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
        return r.name.toLowerCase().includes(q) || r.roll_number.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
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
  const duration = session.duration_minutes || Math.max(1, Math.round((new Date(session.expires_at).getTime() - new Date(session.started_at).getTime()) / 60000));
  const absentCount = Math.max(0, data.total_students - data.present_count);
  const isLive = session.is_active && !session.is_expired;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={`${session.subject_name} — Attendance Roster`}
        description={`Classroom attendance report for ${session.class_name} • Semester ${session.semester} (${session.section}).`}
        badge={
          isLive ? (
            <Badge variant="success" withDot>
              LIVE SESSION
            </Badge>
          ) : session.is_expired ? (
            <Badge variant="neutral">EXPIRED</Badge>
          ) : (
            <Badge variant="warning">COMPLETED</Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/teacher/attendance/history">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Sessions
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Students</span>
          <p className="text-2xl font-bold text-slate-900 font-heading">{data.total_students}</p>
          <span className="text-[11px] text-slate-400 font-medium">Enrolled Roster</span>
        </Card>

        <Card className="p-4 bg-white border-emerald-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Present</span>
          <p className="text-2xl font-bold text-emerald-800 font-heading">{data.present_count}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Verified Marks</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Absent</span>
          <p className="text-2xl font-bold text-slate-700 font-heading">{absentCount}</p>
          <span className="text-[11px] text-slate-400 font-medium">Not Marked</span>
        </Card>

        <Card className="p-4 bg-white border-indigo-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Attendance Rate</span>
          <p className="text-2xl font-bold text-indigo-900 font-heading font-mono">{data.percentage}%</p>
          <span className="text-[11px] text-indigo-600 font-medium">Class Turnout</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Session Window</span>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-800 pt-0.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{duration} Minutes</span>
          </div>
          <span className="text-[11px] text-slate-400 block font-mono">
            {new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </Card>
      </div>

      {/* Student Roster Table Card */}
      <Card className="p-0 overflow-hidden bg-white border-slate-200/80 shadow-sm">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-heading">
              Student Attendance List ({filteredRecords.length})
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Status Segmented Buttons */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs shadow-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({data.records.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PRESENT')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'PRESENT' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Present ({data.present_count})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ABSENT')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'ABSENT' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Absent ({absentCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-60">
              <Input
                placeholder="Search student or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs py-1.5"
              />
            </div>
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
                    No matching student records found.
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

