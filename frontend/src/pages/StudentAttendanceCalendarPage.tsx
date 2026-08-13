import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Camera,
  Layers,
  RefreshCw,
  Clock,
  Filter,
  Check,
  X,
  Minus,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import {
  StudentCalendarResponse,
  StudentCalendarDay,
  Subject,
} from '../types';
import {
  apiGetStudentAttendanceCalendar,
  apiGetStudentSubjects,
} from '../services/api';
import { MIN_ATTENDANCE_THRESHOLD } from './StudentDashboard';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const StudentAttendanceCalendarPage: React.FC = () => {
  // Current displayed month state (YYYY-MM)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [calendarData, setCalendarData] = useState<StudentCalendarResponse | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const monthStr = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, [currentDate]);

  // Load subject list for filter dropdown
  useEffect(() => {
    apiGetStudentSubjects()
      .then((res) => {
        setSubjects(res.data || []);
      })
      .catch(() => {
        // Fallback gracefully
      });
  }, []);

  // Fetch calendar records for month and subject
  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetStudentAttendanceCalendar(monthStr, selectedSubjectId);
      if (res.data) {
        setCalendarData(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve attendance calendar');
    } finally {
      setLoading(false);
    }
  }, [monthStr, selectedSubjectId]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Map of calendar days keyed by date "YYYY-MM-DD"
  const daysMap = useMemo(() => {
    const map = new Map<string, StudentCalendarDay>();
    if (calendarData?.days) {
      for (const d of calendarData.days) {
        map.set(d.date, d);
      }
    }
    return map;
  }, [calendarData]);

  // Generate calendar grid items for the current month
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 7 so Monday is 1, Sunday is 7
    const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: {
      dayNumber: number | null;
      dateStr: string | null;
      isToday: boolean;
      data: StudentCalendarDay | null;
    }[] = [];

    // Leading empty cells
    for (let i = 0; i < offset; i++) {
      cells.push({
        dayNumber: null,
        dateStr: null,
        isToday: false,
        data: null,
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Days of current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      cells.push({
        dayNumber: day,
        dateStr,
        isToday: dateStr === todayStr,
        data: daysMap.get(dateStr) || null,
      });
    }

    return cells;
  }, [currentDate, daysMap]);

  // Active selected day data
  const selectedDayInfo = useMemo(() => {
    if (!selectedDateStr) return null;
    return daysMap.get(selectedDateStr) || null;
  }, [selectedDateStr, daysMap]);

  // Format month name for display (e.g. "August 2026")
  const formattedMonthLabel = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [currentDate]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title="Attendance Calendar"
        description="Month-by-month academic attendance tracking, verified QR lecture check-ins, and session timestamps."
        badge={
          <Badge variant="success" withDot>
            Monthly Telemetry
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/student">
              <Button variant="outline" size="sm" leftIcon={<Layers className="w-3.5 h-3.5" />}>
                Dashboard Overview
              </Button>
            </Link>
            <Link to="/attendance/scan">
              <Button variant="primary" size="sm" leftIcon={<Camera className="w-3.5 h-3.5" />}>
                Scan Attendance QR
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCalendar}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Error Banner */}
      {error && (
        <ErrorState
          variant="banner"
          title="Unable to Load Attendance Calendar"
          error={error}
          onRetry={fetchCalendar}
          retryLabel="Retry"
        />
      )}

      {/* 2. Month Controls & Subject Filter */}
      <Card className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white px-3 min-w-[130px] text-center">
              {formattedMonthLabel}
            </span>
            <button
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleToday}
            className="text-xs"
            leftIcon={<CalendarIcon className="w-3.5 h-3.5" />}
          >
            Today
          </Button>
        </div>

        {/* Subject Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
            Subject:
          </span>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full sm:w-auto text-xs py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-medium transition"
          >
            <option value="">All Subjects ({subjects.length})</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code} &bull; {sub.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* 3. Month KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Sessions Held */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            Sessions Held
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading font-mono text-slate-900 dark:text-white">
              {calendarData?.summary.sessions_held ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">in {formattedMonthLabel}</span>
          </div>
        </Card>

        {/* Present */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            Present
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading font-mono text-emerald-600 dark:text-emerald-400">
              {calendarData?.summary.present ?? 0}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              ✓ Verified Check-Ins
            </span>
          </div>
        </Card>

        {/* Absent */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            Absent
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading font-mono text-rose-600 dark:text-rose-400">
              {calendarData?.summary.absent ?? 0}
            </span>
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
              ✕ Missed Classes
            </span>
          </div>
        </Card>

        {/* Monthly Attendance % */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Month Rate
            </span>
            {(calendarData?.summary.sessions_held ?? 0) > 0 && (
              <Badge
                variant={
                  (calendarData?.summary.percentage ?? 0) >= MIN_ATTENDANCE_THRESHOLD
                    ? 'success'
                    : 'warning'
                }
                className="text-[9px] px-1.5 py-0"
              >
                {(calendarData?.summary.percentage ?? 0) >= MIN_ATTENDANCE_THRESHOLD
                  ? '✓ Met'
                  : '⚠️ Low'}
              </Badge>
            )}
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading font-mono text-slate-900 dark:text-white">
              {calendarData?.summary.percentage ?? 0}%
            </span>
            <span className="text-[11px] font-mono text-slate-400">Target: {MIN_ATTENDANCE_THRESHOLD}%</span>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-6">
          <LoadingState variant="kpi" cards={4} message="Calculating month totals..." />
          <Card className="p-8 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs">
            <LoadingState variant="page" message={`Loading attendance records for ${formattedMonthLabel}...`} />
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* 4. Monthly Calendar Grid (2 Cols on Desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs">
              {/* Month Header Banner */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                    {formattedMonthLabel}
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {calendarData?.summary.sessions_held ?? 0} total sessions
                </span>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center pt-3 pb-2">
                {WEEKDAYS.map((wd) => (
                  <div
                    key={wd}
                    className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400"
                  >
                    <span className="hidden sm:inline">{wd}</span>
                    <span className="sm:hidden">{wd.slice(0, 2)}</span>
                  </div>
                ))}
              </div>

              {/* Calendar Days Matrix */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarGrid.map((cell, idx) => {
                  if (cell.dayNumber === null) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="h-16 sm:h-20 rounded-xl bg-slate-50/40 dark:bg-slate-800/20 border border-transparent"
                      />
                    );
                  }

                  const isSelected = selectedDateStr === cell.dateStr;
                  const hasData = cell.data !== null && cell.data.sessions.length > 0;
                  const dayStatus = cell.data?.status;

                  // Compute styling based on attendance status
                  let statusBg = 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 text-slate-400';
                  let statusChip = null;

                  if (hasData) {
                    if (dayStatus === 'PRESENT') {
                      statusBg = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200';
                      statusChip = (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span className="hidden sm:inline">Present</span>
                        </span>
                      );
                    } else if (dayStatus === 'ABSENT') {
                      statusBg = 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200';
                      statusChip = (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 dark:text-rose-300">
                          <X className="w-2.5 h-2.5 stroke-[3]" />
                          <span className="hidden sm:inline">Absent</span>
                        </span>
                      );
                    } else if (dayStatus === 'PARTIAL') {
                      statusBg = 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200';
                      statusChip = (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                          <Minus className="w-2.5 h-2.5 stroke-[3]" />
                          <span className="hidden sm:inline">Partial</span>
                        </span>
                      );
                    }
                  } else {
                    statusChip = (
                      <span className="text-[9px] text-slate-400 hidden sm:inline">No class</span>
                    );
                  }

                  return (
                    <button
                      key={`day-${cell.dayNumber}`}
                      type="button"
                      onClick={() => setSelectedDateStr(cell.dateStr)}
                      aria-label={`Select date ${cell.dateStr}`}
                      className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-xl border text-left flex flex-col justify-between transition relative focus:outline-hidden ${statusBg} ${
                        isSelected
                          ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 shadow-md scale-[1.02] z-10'
                          : 'hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {/* Top Row: Day Number + Today Badge */}
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`font-mono text-xs sm:text-sm font-bold ${
                            isSelected
                              ? 'text-indigo-700 dark:text-indigo-300'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {cell.isToday && (
                          <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-indigo-600 text-white leading-none">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Bottom Row: Status Indicator Badge */}
                      <div className="w-full flex items-center justify-start truncate">
                        {statusChip}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 5. Calendar Legend */}
              <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                  Legend:
                </span>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600" />
                    <span>🟢 Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600" />
                    <span>🔴 Absent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600" />
                    <span>🟠 Partial</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 border border-slate-400" />
                    <span>🟡 No Class</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 6. Date Details Panel (1 Col on Desktop) */}
          <div className="space-y-4">
            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 sticky top-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider block">
                  Date Inspection
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading mt-0.5">
                  {selectedDateStr
                    ? new Date(`${selectedDateStr}T00:00:00`).toLocaleDateString('en-US', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Select a calendar date'}
                </h4>
              </div>

              {!selectedDateStr ? (
                <div className="p-6 text-center text-slate-400 text-xs space-y-2">
                  <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p>Click on any date cell on the calendar to inspect individual lecture sessions and timestamps.</p>
                </div>
              ) : !selectedDayInfo || selectedDayInfo.sessions.length === 0 ? (
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 mx-auto flex items-center justify-center font-bold text-xs">
                    🟡
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    No Class Conducted
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    No attendance session was held for your class batch on this date.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{selectedDayInfo.sessions.length} Lecture Session{selectedDayInfo.sessions.length > 1 ? 's' : ''}</span>
                    <Badge
                      variant={
                        selectedDayInfo.status === 'PRESENT'
                          ? 'success'
                          : selectedDayInfo.status === 'ABSENT'
                          ? 'error'
                          : 'warning'
                      }
                      className="text-[10px]"
                    >
                      {selectedDayInfo.status}
                    </Badge>
                  </div>

                  <div className="space-y-2.5">
                    {selectedDayInfo.sessions.map((sess) => {
                      const isPresent = sess.status === 'PRESENT';

                      return (
                        <div
                          key={sess.session_id}
                          className={`p-3.5 rounded-xl border transition ${
                            isPresent
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80'
                              : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300">
                                {sess.subject_code}
                              </span>
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white font-heading mt-1">
                                {sess.subject_name}
                              </h5>
                            </div>
                            <Badge
                              variant={isPresent ? 'success' : 'error'}
                              className="text-[10px]"
                            >
                              {isPresent ? '✓ PRESENT' : '✕ ABSENT'}
                            </Badge>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>
                                Started:{' '}
                                {new Date(sess.started_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </span>
                            {isPresent && sess.marked_at ? (
                              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                Marked at{' '}
                                {new Date(sess.marked_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 font-medium">
                                No check-in log
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
