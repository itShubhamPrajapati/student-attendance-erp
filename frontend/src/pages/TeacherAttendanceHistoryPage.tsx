import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  QrCode,
  Eye,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Play,
  Layers,
  Building2,
  X,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { AttendanceSession, TeacherAssignmentItem } from '../types';
import { apiGetTeacherSessions, apiGetTeacherAssignments } from '../services/api';

export const TeacherAttendanceHistoryPage: React.FC = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const fetchSessionsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionsRes, assignmentsRes] = await Promise.all([
        apiGetTeacherSessions(),
        apiGetTeacherAssignments().catch(() => ({ data: [] })),
      ]);
      setSessions(sessionsRes.data || []);
      setAssignments(assignmentsRes.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load attendance sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionsData();
  }, [fetchSessionsData]);

  // Derived filter options from assignments & sessions
  const subjectOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code: string }>();
    assignments.forEach((a) => {
      if (a.subject_id) map.set(a.subject_id, { id: a.subject_id, name: a.subject, code: a.code });
    });
    sessions.forEach((s) => {
      if (s.subject_id && !map.has(s.subject_id)) {
        map.set(s.subject_id, { id: s.subject_id, name: s.subject_name, code: s.subject_code });
      }
    });
    return Array.from(map.values());
  }, [assignments, sessions]);

  const classOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    assignments.forEach((a) => {
      if (a.class_id) map.set(a.class_id, { id: a.class_id, name: a.class });
    });
    sessions.forEach((s) => {
      if (s.class_id && !map.has(s.class_id)) {
        map.set(s.class_id, { id: s.class_id, name: s.class_name });
      }
    });
    return Array.from(map.values());
  }, [assignments, sessions]);

  // Client-side filtering
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // 1. Search text (subject name, code, class name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = s.subject_name.toLowerCase().includes(q) || s.subject_code.toLowerCase().includes(q);
        const matchClass = s.class_name.toLowerCase().includes(q);
        if (!matchSubject && !matchClass) return false;
      }

      // 2. Subject filter
      if (selectedSubjectId && s.subject_id !== selectedSubjectId) {
        return false;
      }

      // 3. Class filter
      if (selectedClassId && s.class_id !== selectedClassId) {
        return false;
      }

      // 4. Status filter
      if (selectedStatus) {
        const isLive = s.is_active && !s.is_expired;
        if (selectedStatus === 'ACTIVE' && !isLive) return false;
        if (selectedStatus === 'COMPLETED' && (s.is_active || s.is_expired)) return false;
        if (selectedStatus === 'EXPIRED' && !s.is_expired) return false;
      }

      // 5. Date filter (YYYY-MM-DD)
      if (selectedDate) {
        const sessionDate = new Date(s.started_at).toISOString().split('T')[0];
        if (sessionDate !== selectedDate) return false;
      }

      return true;
    });
  }, [sessions, searchQuery, selectedSubjectId, selectedClassId, selectedStatus, selectedDate]);

  // Summary Metrics KPIs
  const stats = useMemo(() => {
    let active = 0;
    let completed = 0;
    let totalPresent = 0;

    sessions.forEach((s) => {
      if (s.is_active && !s.is_expired) {
        active++;
      } else {
        completed++;
      }
      totalPresent += s.present_count;
    });

    return {
      total: sessions.length,
      active,
      completed,
      totalPresent,
    };
  }, [sessions]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubjectId('');
    setSelectedClassId('');
    setSelectedStatus('');
    setSelectedDate('');
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedSubjectId || selectedClassId || selectedStatus || selectedDate
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Attendance Sessions"
        description="View and manage your completed and active attendance sessions."
        badge={
          <Badge variant="warning" withDot>
            Faculty Workspace
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSessionsData}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Link to="/teacher">
              <Button variant="primary" size="sm" leftIcon={<Play className="w-3.5 h-3.5" />}>
                Start Attendance
              </Button>
            </Link>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Sessions</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-heading">{stats.total}</span>
            <span className="text-[11px] text-slate-400 font-medium">Lectures</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-emerald-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active / Live</span>
            <QrCode className="w-4 h-4" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-800 font-heading">{stats.active}</span>
            <span className="text-[11px] text-emerald-600 font-medium">Accepting Scans</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-amber-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-800 font-heading">{stats.completed}</span>
            <span className="text-[11px] text-amber-600 font-medium">Concluded</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-indigo-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Present Marks</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-900 font-heading">{stats.totalPresent}</span>
            <span className="text-[11px] text-indigo-600 font-medium">Records</span>
          </div>
        </Card>
      </div>

      {/* Filter Control Bar */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 font-heading">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Search & Filter Sessions</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[11px] font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"
            >
              <X className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Query */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subject or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>

          {/* Subject Dropdown */}
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition"
          >
            <option value="">All Subjects</option>
            {subjectOptions.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} ({sub.code})
              </option>
            ))}
          </select>

          {/* Class Dropdown */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition"
          >
            <option value="">All Classes</option>
            {classOptions.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active (Live QR)</option>
            <option value="COMPLETED">Completed</option>
            <option value="EXPIRED">Expired</option>
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>
      </Card>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState variant="table" rows={6} columns={6} message="Loading attendance sessions history..." />
      ) : error ? (
        <ErrorState
          variant="card"
          title="Unable to Load Attendance Sessions"
          error={error}
          onRetry={fetchSessionsData}
          retryLabel="Try Again"
        />
      ) : sessions.length === 0 ? (
        <EmptyState
          preset="NO_SESSIONS"
          title="No Attendance Sessions Yet"
          description="You haven't conducted any attendance sessions yet. Launch a live QR code session to start tracking classroom attendance."
          action={
            <Link to="/teacher">
              <Button variant="primary" size="sm" leftIcon={<Play className="w-3.5 h-3.5" />}>
                Start Attendance
              </Button>
            </Link>
          }
        />
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          preset="FILTERED_EMPTY"
          title="No Matching Sessions Found"
          description="No attendance sessions match your active search or filter criteria. Try clearing your filters."
          action={
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All Filters
            </Button>
          }
        />
      ) : (
        <Card className="p-0 overflow-hidden bg-white border-slate-200/80 shadow-xs">
          {/* Table View (Desktop & Tablet) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4 text-center">Present</th>
                  <th className="py-3 px-4 text-center">Absent</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((s) => {
                  const duration = s.duration_minutes || Math.max(1, Math.round((new Date(s.expires_at).getTime() - new Date(s.started_at).getTime()) / 60000));
                  const absent = s.absent_count !== undefined ? s.absent_count : Math.max(0, s.total_students - s.present_count);
                  const isLive = s.is_active && !s.is_expired;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(s.started_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 pl-5">
                          {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 font-heading">{s.subject_name}</div>
                        <span className="font-mono text-[10px] text-indigo-600 font-semibold">{s.subject_code}</span>
                      </td>

                      {/* Class */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{s.class_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Sem {s.semester} &bull; Sec {s.section}
                        </div>
                      </td>

                      {/* Present */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200/50">
                          {s.present_count}
                        </span>
                      </td>

                      {/* Absent */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200">
                          {absent}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{duration} min</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isLive ? (
                          <Badge variant="success" withDot className="text-[10px]">
                            ACTIVE
                          </Badge>
                        ) : s.is_expired ? (
                          <Badge variant="neutral" className="text-[10px]">
                            EXPIRED
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px]">
                            COMPLETED
                          </Badge>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {isLive && (
                          <Link to={`/teacher/attendance/${s.id}`}>
                            <Button size="sm" variant="primary" leftIcon={<QrCode className="w-3 h-3" />} className="text-xs py-1">
                              Show QR
                            </Button>
                          </Link>
                        )}
                        <Link to={`/teacher/attendance/${s.id}/records`}>
                          <Button size="sm" variant="outline" leftIcon={<Eye className="w-3 h-3" />} className="text-xs py-1">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
