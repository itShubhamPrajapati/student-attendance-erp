import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  RefreshCw,
  Users,
  BookOpen,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
  X,
  Layers,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import {
  TeacherStudentSearchResponse,
  TeacherStudentAttendanceDetailResponse,
  TeacherAssignmentItem,
} from '../types';
import {
  apiSearchTeacherStudents,
  apiGetTeacherAssignments,
  apiGetTeacherStudentAttendanceDetail,
} from '../services/api';

export const TeacherStudentAttendanceSearchPage: React.FC = () => {
  // Master Search Data
  const [searchResponse, setSearchResponse] = useState<TeacherStudentSearchResponse | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter Form State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Student Attendance Detail Inspection Modal State
  const [inspectingStudentId, setInspectingStudentId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<TeacherStudentAttendanceDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Detail Modal Filters
  const [detailSubjectId, setDetailSubjectId] = useState('');
  const [detailStatus, setDetailStatus] = useState('');
  const [detailFromDate, setDetailFromDate] = useState('');
  const [detailToDate, setDetailToDate] = useState('');
  const [detailPage, setDetailPage] = useState(1);
  const detailLimit = 15;

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load teacher assigned classes and subjects for filter dropdowns
  useEffect(() => {
    apiGetTeacherAssignments()
      .then((res) => setAssignments(res.data || []))
      .catch(() => setAssignments([]));
  }, []);

  // Unique Classes and Subjects list
  const uniqueClasses = useMemo(() => {
    const classMap = new Map<string, { id: string; name: string }>();
    for (const a of assignments) {
      if (!classMap.has(a.class_id)) {
        classMap.set(a.class_id, {
          id: a.class_id,
          name: `${a.class} (${a.department} Sem ${a.semester}-${a.section})`,
        });
      }
    }
    return Array.from(classMap.values());
  }, [assignments]);

  const uniqueSubjects = useMemo(() => {
    const subMap = new Map<string, { id: string; name: string; code: string }>();
    for (const a of assignments) {
      if (!subMap.has(a.subject_id)) {
        subMap.set(a.subject_id, {
          id: a.subject_id,
          name: a.subject,
          code: a.code,
        });
      }
    }
    return Array.from(subMap.values());
  }, [assignments]);

  // Fetch search results
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Validate from <= to
    if (fromDate && toDate && fromDate > toDate) {
      setError("'From' date cannot be after 'To' date.");
      setLoading(false);
      return;
    }

    try {
      const res = await apiSearchTeacherStudents({
        q: debouncedQuery.trim() || undefined,
        class_id: selectedClassId || undefined,
        subject_id: selectedSubjectId || undefined,
        status: selectedStatus || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page: currentPage,
        page_size: pageSize,
        sort: sortBy,
        order: sortOrder,
      });
      setSearchResponse(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to search students');
    } finally {
      setLoading(false);
    }
  }, [
    debouncedQuery,
    selectedClassId,
    selectedSubjectId,
    selectedStatus,
    fromDate,
    toDate,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Fetch student detail when modal opens or detail filters change
  const fetchStudentDetail = useCallback(async (studentId: string) => {
    setDetailLoading(true);
    setDetailError(null);

    if (detailFromDate && detailToDate && detailFromDate > detailToDate) {
      setDetailError("'From' date cannot be after 'To' date.");
      setDetailLoading(false);
      return;
    }

    try {
      const res = await apiGetTeacherStudentAttendanceDetail(studentId, {
        subject_id: detailSubjectId || undefined,
        status: detailStatus || undefined,
        from: detailFromDate || undefined,
        to: detailToDate || undefined,
        page: detailPage,
        limit: detailLimit,
      });
      setDetailData(res.data);
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : 'Unable to load student attendance details');
    } finally {
      setDetailLoading(false);
    }
  }, [detailSubjectId, detailStatus, detailFromDate, detailToDate, detailPage, detailLimit]);

  useEffect(() => {
    if (inspectingStudentId) {
      fetchStudentDetail(inspectingStudentId);
    }
  }, [inspectingStudentId, fetchStudentDetail]);

  const handleOpenDetailModal = (studentId: string) => {
    setInspectingStudentId(studentId);
    setDetailSubjectId('');
    setDetailStatus('');
    setDetailFromDate('');
    setDetailToDate('');
    setDetailPage(1);
    setDetailData(null);
  };

  const handleCloseDetailModal = () => {
    setInspectingStudentId(null);
    setDetailData(null);
    setDetailError(null);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedClassId('');
    setSelectedSubjectId('');
    setSelectedStatus('');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
    setSortBy('name');
    setSortOrder('asc');
  };

  const handleSortToggle = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedClassId ||
    selectedSubjectId ||
    selectedStatus ||
    fromDate ||
    toDate
  );

  const items = searchResponse?.items || [];
  const pagination = searchResponse?.pagination || { page: 1, page_size: 20, total: 0, total_pages: 0 };
  const summary = searchResponse?.summary || {
    total_students: 0,
    students_meeting_requirement: 0,
    students_below_requirement: 0,
    students_critical: 0,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title="Student Attendance Search & Audit"
        description="Search enrolled students across your assigned academic classes, inspect verified attendance rates, and audit lecture logs."
        badge={
          <Badge variant="info" withDot>
            Teacher Portal
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/teacher">
              <Button variant="outline" size="sm" leftIcon={<Layers className="w-3.5 h-3.5" />}>
                Dashboard
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStudents}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-white border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Students
          </span>
          <p className="text-2xl font-extrabold text-slate-900 font-heading mt-1">
            {summary.total_students}
          </p>
          <span className="text-[11px] text-slate-500 mt-1">Enrolled in your classes</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Requirement Met (≥75%)
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 font-heading mt-1">
            {summary.students_meeting_requirement}
          </p>
          <span className="text-[11px] text-slate-500 mt-1">Good attendance standing</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
            Below 75%
          </span>
          <p className="text-2xl font-extrabold text-amber-600 font-heading mt-1">
            {summary.students_below_requirement}
          </p>
          <span className="text-[11px] text-slate-500 mt-1">Attendance warning level</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
            Critical (&lt;60%)
          </span>
          <p className="text-2xl font-extrabold text-rose-600 font-heading mt-1">
            {summary.students_critical}
          </p>
          <span className="text-[11px] text-slate-500 mt-1">Severe attendance deficit</span>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <Card className="p-4 sm:p-5 bg-white border-slate-200/80 shadow-xs space-y-3.5">
        {/* Main Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name, roll number (e.g. 24, CS101), or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 py-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            >
              <option value="">All Assigned Classes</option>
              {uniqueClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-slate-400" />
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            >
              <option value="">All Assigned Subjects</option>
              {uniqueSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              Attendance Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            >
              <option value="">All Standings</option>
              <option value="REQUIREMENT_MET">Requirement Met (≥75%)</option>
              <option value="BELOW_REQUIREMENT">Below Requirement (&lt;75%)</option>
              <option value="CRITICAL">Critical (&lt;60%)</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              From Date
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1"
            />
          </div>

          {/* To Date & Clear */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                To Date
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs py-1"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs mb-0.5"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Unable to perform search</p>
              <p className="text-rose-600">{error}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStudents} className="bg-white">
            Retry
          </Button>
        </div>
      )}

      {/* 4. Results List / Table */}
      {loading ? (
        <div className="min-h-[35vh] flex flex-col items-center justify-center p-8">
          <LoadingSpinner size="lg" label="Searching and computing student attendance records..." />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No Students Found"
          description={
            hasActiveFilters
              ? 'No students matching your active search query or filter criteria were found in your assigned classes. Try adjusting your filters.'
              : 'You currently do not have any students enrolled in your assigned classes.'
          }
          icon={<Search className="w-8 h-8 text-slate-400" />}
          action={
            hasActiveFilters ? (
              <Button size="sm" variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">
                    <button
                      onClick={() => handleSortToggle('name')}
                      className="flex items-center gap-1 hover:text-slate-900 transition font-bold"
                    >
                      Student
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => handleSortToggle('roll_number')}
                      className="flex items-center gap-1 hover:text-slate-900 transition font-bold"
                    >
                      Roll No
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => handleSortToggle('attendance_percentage')}
                      className="flex items-center gap-1 hover:text-slate-900 transition font-bold"
                    >
                      Attendance Rate
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleSortToggle('present')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 transition font-bold"
                    >
                      Attended / Total
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-center">Standing</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((st) => {
                  const isHealthy = st.attendance_percentage >= 75.0;
                  const isCrit = st.attendance_percentage < 60.0;

                  return (
                    <tr key={st.student_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-heading text-xs">
                          {st.name}
                        </div>
                        <div className="text-[11px] text-slate-400">{st.email}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-700 text-xs">
                        {st.roll_number}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{st.class_name}</div>
                        <div className="text-[10px] text-slate-400">
                          {st.department} &bull; Sem {st.semester}-{st.section}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1 w-28">
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`font-black font-mono ${
                                isCrit
                                  ? 'text-rose-600'
                                  : !isHealthy
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {st.attendance_percentage}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isCrit
                                  ? 'bg-rose-500'
                                  : !isHealthy
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, st.attendance_percentage))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-slate-800">{st.present}</span>
                        <span className="text-slate-400"> / {st.total_sessions}</span>
                        {st.absent > 0 && (
                          <span className="text-[10px] text-rose-600 block">({st.absent} missed)</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={isCrit ? 'error' : !isHealthy ? 'warning' : 'success'}
                          withDot
                          className="text-[10px] font-bold"
                        >
                          {isCrit ? 'Critical' : !isHealthy ? 'Below 75%' : 'Met'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetailModal(st.student_id)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          className="text-xs py-1"
                        >
                          View Attendance
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {items.map((st) => {
              const isHealthy = st.attendance_percentage >= 75.0;
              const isCrit = st.attendance_percentage < 60.0;

              return (
                <Card key={st.student_id} className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 font-heading text-sm">{st.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Roll: {st.roll_number} &bull; {st.email}
                      </p>
                    </div>
                    <Badge
                      variant={isCrit ? 'error' : !isHealthy ? 'warning' : 'success'}
                      withDot
                      className="text-[10px]"
                    >
                      {isCrit ? 'Critical' : !isHealthy ? 'Below 75%' : 'Good Standing'}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Class:</span>
                      <span className="font-semibold text-slate-800">{st.class_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Attendance Rate:</span>
                      <span
                        className={`font-black font-mono ${
                          isCrit
                            ? 'text-rose-600'
                            : !isHealthy
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {st.attendance_percentage}% ({st.present}/{st.total_sessions})
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDetailModal(st.student_id)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    className="w-full text-xs"
                  >
                    View Full Attendance
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-xs">
              <span className="text-slate-500">
                Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.total_pages}</strong>{' '}
                ({pagination.total} total students)
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
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

      {/* ========================================================================= */}
      {/* 5. STUDENT ATTENDANCE DRILL-DOWN MODAL                                    */}
      {/* ========================================================================= */}
      {inspectingStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-heading">
                    {detailData?.student.name || 'Student Attendance Details'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Roll No: {detailData?.student.roll_number} &bull; Class: {detailData?.student.class_name}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseDetailModal}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {detailLoading && !detailData ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <LoadingSpinner size="lg" label="Loading student attendance details..." />
                </div>
              ) : detailError ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                  <span>{detailError}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchStudentDetail(inspectingStudentId)}
                    className="bg-white"
                  >
                    Retry
                  </Button>
                </div>
              ) : detailData ? (
                <>
                  {/* Overall Attendance Summary Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                      <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                        Overall Attendance
                      </span>
                      <p className="text-2xl font-black font-heading text-indigo-600 mt-1">
                        {detailData.summary.overall_percentage}%
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total Sessions
                      </span>
                      <p className="text-xl font-bold font-heading text-slate-900 mt-1">
                        {detailData.summary.total_sessions}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                        Present
                      </span>
                      <p className="text-xl font-bold font-heading text-emerald-600 mt-1">
                        {detailData.summary.total_present}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                        Absent
                      </span>
                      <p className="text-xl font-bold font-heading text-rose-600 mt-1">
                        {detailData.summary.total_absent}
                      </p>
                    </div>
                  </div>

                  {/* Subject Performance Breakdown */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      Subject Performance Breakdown
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {detailData.subjects.map((sub) => {
                        const isSubCrit = sub.total > 0 && sub.percentage < 60.0;
                        const isSubBelow = sub.total > 0 && sub.percentage < 75.0;

                        return (
                          <div
                            key={sub.subject_id}
                            className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 font-mono">
                                  {sub.subject_code}
                                </span>
                                <h5 className="text-xs font-bold text-slate-900 font-heading">
                                  {sub.subject_name}
                                </h5>
                              </div>
                              <Badge
                                variant={isSubCrit ? 'error' : isSubBelow ? 'warning' : 'success'}
                                className="text-[10px] font-mono"
                              >
                                {sub.percentage}%
                              </Badge>
                            </div>

                            {/* Mini Bar */}
                            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isSubCrit
                                    ? 'bg-rose-500'
                                    : isSubBelow
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, sub.percentage))}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span>Present: {sub.present}</span>
                              <span>Absent: {sub.absent}</span>
                              <span>Total: {sub.total}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Attendance History Audit Log */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        Verified Attendance Session Records
                      </h4>

                      {/* Detail Filters */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={detailSubjectId}
                          onChange={(e) => {
                            setDetailSubjectId(e.target.value);
                            setDetailPage(1);
                          }}
                          className="text-[11px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700"
                        >
                          <option value="">All Subjects</option>
                          {detailData.subjects.map((s) => (
                            <option key={s.subject_id} value={s.subject_id}>
                              {s.subject_name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={detailStatus}
                          onChange={(e) => {
                            setDetailStatus(e.target.value);
                            setDetailPage(1);
                          }}
                          className="text-[11px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700"
                        >
                          <option value="">All Statuses</option>
                          <option value="PRESENT">Present</option>
                          <option value="ABSENT">Absent</option>
                        </select>
                      </div>
                    </div>

                    {detailData.history.records.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">
                        No attendance history records match your filters.
                      </p>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                              <th className="py-2.5 px-3.5">Date & Time</th>
                              <th className="py-2.5 px-3.5">Subject</th>
                              <th className="py-2.5 px-3.5">Status</th>
                              <th className="py-2.5 px-3.5">Marked At</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {detailData.history.records.map((r) => (
                              <tr key={r.session_id} className="hover:bg-slate-50/60">
                                <td className="py-2.5 px-3.5 font-medium text-slate-800">
                                  {new Date(r.started_at).toLocaleDateString(undefined, {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    {new Date(r.started_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3.5">
                                  <span className="font-semibold text-slate-800">{r.subject_name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    {r.subject_code}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3.5">
                                  <Badge
                                    variant={r.status === 'PRESENT' ? 'success' : 'error'}
                                    withDot
                                    className="text-[10px] font-bold"
                                  >
                                    {r.status}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3.5 text-slate-400 text-[11px]">
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
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/60">
              <Button variant="outline" size="sm" onClick={handleCloseDetailModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
