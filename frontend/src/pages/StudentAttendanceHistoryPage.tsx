import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Camera,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Building2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AttendanceProofModal } from '../components/AttendanceProofModal';
import {
  StudentAttendanceHistoryRecord,
  StudentAttendanceHistoryResponse,
  Subject,
} from '../types';
import {
  apiGetStudentAttendanceHistory,
  apiGetStudentSubjects,
} from '../services/api';

export const StudentAttendanceHistoryPage: React.FC = () => {
  const [historyData, setHistoryData] = useState<StudentAttendanceHistoryResponse | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofAttendanceId, setProofAttendanceId] = useState<string | null>(null);

  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 15;

  // Modal State for inspecting single session
  const [selectedSession, setSelectedSession] = useState<StudentAttendanceHistoryRecord | null>(null);

  // Load subject list for dropdown filter
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await apiGetStudentSubjects();
      setSubjects(res.data || []);
    } catch {
      // Non-blocking fallback
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Load history records from backend with pagination & filters
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetStudentAttendanceHistory({
        subject_id: selectedSubjectId || undefined,
        status: selectedStatus || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        search: searchQuery.trim() || undefined,
        page: currentPage,
        limit: limit,
      });
      setHistoryData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load attendance history');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, selectedStatus, fromDate, toDate, searchQuery, currentPage, limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedSubjectId('');
    setSelectedStatus('');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSubjectId !== '' ||
    selectedStatus !== '' ||
    fromDate !== '' ||
    toDate !== '';

  const summary = historyData?.summary || {
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0,
  };

  const pagination = historyData?.pagination || {
    page: 1,
    limit: limit,
    total_records: 0,
    total_pages: 0,
  };

  const records = historyData?.records || [];

  // Helper date/time formatters
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const formatDuration = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      if (diffMinutes > 0) {
        return `${diffMinutes} mins`;
      }
    } catch {
      // Fallback
    }
    return 'Standard Session';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Cross-Feature Navigation */}
      <PageHeader
        title="Attendance History"
        description="Comprehensive log of all conducted lectures, verified check-in timestamps, and session details."
        badge={
          <Badge variant="info" withDot>
            Student History
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/student">
              <Button variant="outline" size="sm" leftIcon={<Layers className="w-3.5 h-3.5" />}>
                Overview
              </Button>
            </Link>
            <Link to="/student/attendance/calendar">
              <Button variant="outline" size="sm" leftIcon={<Calendar className="w-3.5 h-3.5" />}>
                Calendar View
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
              onClick={fetchHistory}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* 2. Top Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Lectures */}
        <Card className="p-4 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Lectures
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.total}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Sessions</span>
          </div>
        </Card>

        {/* Attended (Present) */}
        <Card className="p-4 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Attended
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary.present}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Present</span>
          </div>
        </Card>

        {/* Missed (Absent) */}
        <Card className="p-4 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Missed
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {summary.absent}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Absent</span>
          </div>
        </Card>

        {/* Attendance Rate */}
        <Card className="p-4 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Attendance Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                summary.percentage >= 75
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {summary.percentage.toFixed(1)}%
            </span>
            <Badge variant={summary.percentage >= 75 ? 'success' : 'warning'}>
              {summary.percentage >= 75 ? 'Requirement Met' : 'Low (<75%)'}
            </Badge>
          </div>
        </Card>
      </div>

      {/* 3. Filter Bar */}
      <Card className="p-4 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>Filter Attendance Records</span>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject or code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Subject Filter */}
            <div>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="PRESENT">On-Time (Present)</option>
                <option value="LATE">Late (Attended)</option>
                <option value="ABSENT">Absent (Missed)</option>
              </select>
            </div>

            {/* From Date */}
            <div>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                title="From Date"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* To Date */}
            <div>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCurrentPage(1);
                }}
                title="To Date"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Error Banner with Retry */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Unable to load attendance history: {error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchHistory}>
            Retry
          </Button>
        </div>
      )}

      {/* 4. Attendance Table / Cards */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner />
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-10 h-10 text-slate-400" />}
          title={hasActiveFilters ? 'No matching attendance records' : 'No attendance records yet'}
          description={
            hasActiveFilters
              ? 'Try modifying your search query or clearing active filters to see historical sessions.'
              : 'Your verified attendance records will appear here as your teachers conduct class sessions.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Active Filters
              </Button>
            ) : (
              <Link to="/attendance/scan">
                <Button variant="primary" size="sm" leftIcon={<Camera className="w-3.5 h-3.5" />}>
                  Scan Attendance QR
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50/75 dark:bg-slate-800/60">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Subject & Code
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Marked At
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {records.map((rec) => (
                  <tr
                    key={rec.session_id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Date & Time */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {formatDate(rec.started_at)}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {formatTime(rec.started_at)} – {formatTime(rec.ended_at)}
                        </span>
                      </div>
                    </td>

                    {/* Subject & Code */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {rec.subject_name}
                      </div>
                      <div className="mt-0.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {rec.subject_code}
                        </span>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rec.class_name}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {rec.status === 'PRESENT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          PRESENT
                        </span>
                      ) : rec.status === 'LATE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/50">
                          <Clock className="w-3.5 h-3.5" />
                          LATE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50">
                          <XCircle className="w-3.5 h-3.5" />
                          ABSENT
                        </span>
                      )}
                    </td>

                    {/* Marked At */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {rec.marked_at ? (
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                          {formatTime(rec.marked_at)}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 dark:text-slate-500 italic">
                          Not marked
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-1.5">
                        {rec.attendance_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProofAttendanceId(rec.attendance_id!)}
                            leftIcon={<FileText className="w-3.5 h-3.5 text-indigo-600" />}
                          >
                            Proof
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSession(rec)}
                          leftIcon={<Eye className="w-3.5 h-3.5 text-slate-500" />}
                        >
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {records.map((rec) => (
              <Card
                key={rec.session_id}
                className="p-4 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {rec.subject_name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      {rec.subject_code} • {rec.class_name}
                    </div>
                  </div>
                  {rec.status === 'PRESENT' ? (
                    <Badge variant="success">
                      ✓ Present
                    </Badge>
                  ) : rec.status === 'LATE' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      ⏰ Late
                    </span>
                  ) : (
                    <Badge variant="error">
                      ✕ Absent
                    </Badge>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    <span>{formatDate(rec.started_at)}</span>
                    <span className="mx-1">•</span>
                    <span>{formatTime(rec.started_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rec.attendance_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProofAttendanceId(rec.attendance_id!)}
                        leftIcon={<FileText className="w-3 h-3 text-indigo-600" />}
                      >
                        Proof
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSession(rec)}
                      leftIcon={<Eye className="w-3 h-3" />}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 5. Server-Side Pagination Controls */}
          {pagination.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {Math.min(pagination.page * pagination.limit, pagination.total_records)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {pagination.total_records}
                </span>{' '}
                records
              </div>

              <div className="flex items-center gap-1.5">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.total_pages }, (_, idx) => idx + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === pagination.total_pages ||
                        Math.abs(p - pagination.page) <= 1
                    )
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const isGap = prev && p - prev > 1;
                      return (
                        <React.Fragment key={p}>
                          {isGap && (
                            <span className="px-1 text-slate-400 text-xs">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(p)}
                            className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-colors ${
                              pagination.page === p
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Session Details Inspection Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Lecture Session Details
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Session ID: <span className="font-mono">{selectedSession.session_id.slice(0, 8)}...</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {/* Subject Info */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Course Module
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {selectedSession.subject_code}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {selectedSession.subject_name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Class: {selectedSession.class_name}</span>
                </div>
              </div>

              {/* Timing & Schedule */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Lecture Date
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    {formatDate(selectedSession.started_at)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Session Time & Span
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    {formatTime(selectedSession.started_at)} – {formatTime(selectedSession.ended_at)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Duration: {formatDuration(selectedSession.started_at, selectedSession.ended_at)}
                  </div>
                </div>
              </div>

              {/* Attendance Status & Verification */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Attendance Status
                  </span>
                  {selectedSession.status === 'PRESENT' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300/60">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ✓ PRESENT (On-Time)
                    </span>
                  ) : selectedSession.status === 'LATE' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300/60">
                      <Clock className="w-3.5 h-3.5" />
                      ⏰ LATE (Attended)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300/60">
                      <XCircle className="w-3.5 h-3.5" />
                      ✕ ABSENT (Missed)
                    </span>
                  )}
                </div>

                {selectedSession.status === 'LATE' && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200/60">
                    💡 <strong>Academic Standing:</strong> Recorded after the late threshold. Per attendance policy, late attendance counts as <strong>ATTENDED</strong> towards your overall percentage.
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Verified Check-In</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                    {selectedSession.marked_at ? (
                      `Marked at ${formatTime(selectedSession.marked_at)}`
                    ) : (
                      <span className="text-slate-400 italic">No check-in log recorded</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              {selectedSession.attendance_id ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const attId = selectedSession.attendance_id!;
                    setSelectedSession(null);
                    setProofAttendanceId(attId);
                  }}
                  leftIcon={<FileText className="w-3.5 h-3.5" />}
                >
                  View Attendance Proof
                </Button>
              ) : (
                <div />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSession(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Attendance Proof Modal */}
      <AttendanceProofModal
        isOpen={!!proofAttendanceId}
        onClose={() => setProofAttendanceId(null)}
        attendanceId={proofAttendanceId}
        role="STUDENT"
      />
    </div>
  );
};
