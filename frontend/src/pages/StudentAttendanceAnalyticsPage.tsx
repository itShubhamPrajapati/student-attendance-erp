import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Info,
  ShieldCheck,
  Target,
  History,
  Layers,
  XCircle,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import {
  StudentAttendanceAnalyticsResponse,
  Subject,
} from '../types';
import {
  apiGetStudentAttendanceAnalytics,
  apiGetStudentSubjects,
} from '../services/api';

export const StudentAttendanceAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<StudentAttendanceAnalyticsResponse | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Fetch student curriculum subjects on mount
  useEffect(() => {
    apiGetStudentSubjects()
      .then((res) => setSubjects(res.data || []))
      .catch(() => setSubjects([]));
  }, []);

  // Fetch analytics with applied filters
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Validate from <= to before making request
    if (fromDate && toDate && fromDate > toDate) {
      setError("'From' date cannot be after 'To' date.");
      setLoading(false);
      return;
    }

    try {
      const res = await apiGetStudentAttendanceAnalytics({
        subject_id: selectedSubject || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setAnalytics(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load attendance analytics');
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, fromDate, toDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleClearFilters = () => {
    setSelectedSubject('');
    setFromDate('');
    setToDate('');
  };

  const hasActiveFilters = Boolean(selectedSubject || fromDate || toDate);

  // Extract metrics from analytics payload
  const summary = analytics?.summary;
  const trend = analytics?.trend;
  const projection = analytics?.projection;
  const monthly = analytics?.monthly || [];
  const subjectList = analytics?.subjects || [];
  const comparison = analytics?.comparison;
  const absence = analytics?.absence;

  const totalSessions = summary?.total_sessions ?? 0;
  const overallPercentage = summary?.overall_percentage ?? 0.0;
  const isHealthy = totalSessions > 0 && overallPercentage >= (summary?.min_threshold ?? 75.0);
  const isCritical = totalSessions > 0 && overallPercentage < (summary?.critical_threshold ?? 60.0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Page Header */}
      <PageHeader
        title="Attendance Analytics & Insights"
        description="Authoritative attendance performance trends, subject-wise analytics, monthly trajectory, and 75% target projection."
        badge={
          <Badge variant="info" withDot>
            Analytics Engine
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/student">
              <Button variant="outline" size="sm" leftIcon={<Layers className="w-3.5 h-3.5" />}>
                Dashboard
              </Button>
            </Link>
            <Link to="/student/attendance/calendar">
              <Button variant="outline" size="sm" leftIcon={<Calendar className="w-3.5 h-3.5" />}>
                Calendar
              </Button>
            </Link>
            <Link to="/student/attendance/history">
              <Button variant="outline" size="sm" leftIcon={<History className="w-3.5 h-3.5" />}>
                History
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* 2. Filter Bar */}
      <Card className="p-4 sm:p-5 bg-white border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-end gap-3.5">
          {/* Subject Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              Filter by Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            >
              <option value="">All Curriculum Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div className="w-full sm:w-44">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              From Date
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>

          {/* To Date */}
          <div className="w-full sm:w-44">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              To Date
            </label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs"
              >
                Clear Filters
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
              <p className="font-bold">Unable to load attendance analytics</p>
              <p className="text-rose-600">{error}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} className="bg-white">
            Retry
          </Button>
        </div>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8">
          <LoadingSpinner size="lg" label="Computing authoritative analytics & trends..." />
        </div>
      ) : !analytics || totalSessions === 0 ? (
        /* Empty State */
        <EmptyState
          title="No Attendance Analytics Available"
          description={
            hasActiveFilters
              ? 'No lecture sessions were found matching your selected subject or date range filters. Try adjusting your filter criteria.'
              : 'Attendance analytics and trends will appear here once lecture sessions are conducted and recorded for your academic class.'
          }
          icon={<Filter className="w-8 h-8 text-slate-400" />}
          action={
            hasActiveFilters ? (
              <Button size="sm" variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Link to="/student">
                <Button size="sm" variant="primary">
                  Back to Dashboard
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* SECTION 1: OVERALL ATTENDANCE SUMMARY KPIS                                */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {/* 1. Overall Percentage */}
            <Card className="col-span-2 p-5 bg-gradient-to-br from-indigo-50/60 via-white to-white border-indigo-100/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                    Overall Attendance
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className={`text-3xl sm:text-4xl font-black font-heading ${
                        isCritical
                          ? 'text-rose-600'
                          : !isHealthy
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {overallPercentage}%
                    </span>
                  </div>
                </div>
                <Badge
                  variant={isCritical ? 'error' : !isHealthy ? 'warning' : 'success'}
                  withDot
                  className="text-[11px]"
                >
                  {isCritical ? 'Critical' : !isHealthy ? 'Below 75%' : 'Good Standing'}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCritical
                        ? 'bg-rose-500'
                        : !isHealthy
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, overallPercentage))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Min Requirement: 75%</span>
                  <span>{summary?.total_present} / {summary?.total_sessions} Attended</span>
                </div>
              </div>
            </Card>

            {/* 2. Total Sessions */}
            <Card className="p-4 bg-white border-slate-200/80 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Held
              </span>
              <p className="text-2xl font-extrabold text-slate-900 font-heading mt-1">
                {summary?.total_sessions}
              </p>
              <span className="text-[11px] text-slate-500 mt-2">Scheduled classes</span>
            </Card>

            {/* 3. Present Sessions */}
            <Card className="p-4 bg-white border-slate-200/80 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Attended
              </span>
              <p className="text-2xl font-extrabold text-emerald-600 font-heading mt-1">
                {summary?.total_present}
              </p>
              <span className="text-[11px] text-slate-500 mt-2">Verified present</span>
            </Card>

            {/* 4. Absent Sessions */}
            <Card className="p-4 bg-white border-slate-200/80 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                Missed
              </span>
              <p className="text-2xl font-extrabold text-rose-600 font-heading mt-1">
                {summary?.total_absent}
              </p>
              <span className="text-[11px] text-slate-500 mt-2">Absent lectures</span>
            </Card>

            {/* 5. Subjects Status Counts */}
            <Card className="p-4 bg-white border-slate-200/80 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Below 75%
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-extrabold text-amber-600 font-heading">
                  {summary?.subjects_below_requirement}
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ {summary?.total_subjects}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-2">
                {summary?.subjects_critical ? `${summary.subjects_critical} critical (<60%)` : 'Subjects below target'}
              </span>
            </Card>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2 & 3: ATTENDANCE TREND & 75% TARGET PROJECTION                  */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Trajectory / Trend Card */}
            <Card className="p-5 bg-white border-slate-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                      Attendance Trajectory Trend
                    </h3>
                    <p className="text-[11px] text-slate-400">Month-over-month performance momentum</p>
                  </div>
                </div>

                <Badge
                  variant={
                    trend?.status === 'IMPROVING'
                      ? 'success'
                      : trend?.status === 'DECLINING'
                      ? 'error'
                      : trend?.status === 'STABLE'
                      ? 'info'
                      : 'neutral'
                  }
                  withDot
                  className="text-xs font-bold"
                >
                  {trend?.status === 'IMPROVING'
                    ? '📈 Improving'
                    : trend?.status === 'DECLINING'
                    ? '📉 Declining'
                    : trend?.status === 'STABLE'
                    ? '⚖️ Stable'
                    : 'Insufficient Data'}
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                {trend?.status === 'INSUFFICIENT_DATA' ? (
                  <p className="text-slate-600 leading-relaxed">
                    Attendance trend requires at least two distinct calendar months of lecture session history to establish momentum.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Current Month Rate:</span>
                      <span className="font-bold text-slate-900 font-heading">
                        {trend?.current_percentage !== null ? `${trend?.current_percentage}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Previous Month Rate:</span>
                      <span className="font-semibold text-slate-700">
                        {trend?.previous_percentage !== null ? `${trend?.previous_percentage}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 font-medium">
                      <span className="text-slate-600">Net Momentum:</span>
                      <span
                        className={`font-bold font-mono ${
                          (trend?.difference_percentage_points ?? 0) > 0
                            ? 'text-emerald-700'
                            : (trend?.difference_percentage_points ?? 0) < 0
                            ? 'text-rose-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {(trend?.difference_percentage_points ?? 0) > 0 ? '+' : ''}
                        {trend?.difference_percentage_points}% pts
                      </span>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* 75% Requirement Projection Card */}
            <Card className="p-5 bg-white border-slate-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                      75% Requirement Projection
                    </h3>
                    <p className="text-[11px] text-slate-400">Consecutive lecture attendance calculation</p>
                  </div>
                </div>

                <Badge
                  variant={projection?.is_meeting_requirement ? 'success' : 'warning'}
                  className="text-xs"
                >
                  {projection?.is_meeting_requirement ? 'Requirement Met' : 'Action Required'}
                </Badge>
              </div>

              <div
                className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                  projection?.is_meeting_requirement
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/60 border-amber-200 text-amber-900'
                }`}
              >
                {projection?.is_meeting_requirement ? (
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-950">You are currently meeting the 75% requirement.</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                        Maintain consistent attendance to remain eligible for examinations and in good academic standing.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-950">
                        Approximately{' '}
                        <span className="font-black font-mono text-sm underline text-amber-900">
                          {projection?.classes_needed} consecutive classes
                        </span>{' '}
                        needed.
                      </p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        At your current attendance level, you would need to attend approximately{' '}
                        <strong>{projection?.classes_needed}</strong> consecutive future classes to reach the{' '}
                        <strong>75% threshold</strong>, assuming no additional absences.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>Mathematical projection based on active attendance ratio (P/T).</span>
              </div>
            </Card>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: MONTHLY ATTENDANCE TREND BREAKDOWN                             */}
          {/* ========================================================================= */}
          <Card className="p-5 bg-white border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                    Monthly Attendance History
                  </h3>
                  <p className="text-[11px] text-slate-400">Monthly attendance rates and participation breakdown</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {monthly.length} {monthly.length === 1 ? 'Month' : 'Months'} Recorded
              </span>
            </div>

            {monthly.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No monthly records in this range.</p>
            ) : (
              <div className="space-y-3">
                {monthly.map((m) => {
                  const mHealthy = m.percentage >= 75.0;
                  const mCritical = m.percentage < 60.0;

                  return (
                    <div
                      key={m.month}
                      className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-50 transition space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-heading">
                            {new Date(`${m.month}-01T00:00:00Z`).toLocaleDateString('default', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">({m.month})</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-500">
                            <strong>{m.present}</strong> / {m.sessions} Present
                            {m.absent > 0 && <span className="text-rose-600 ml-1">({m.absent} Missed)</span>}
                          </span>
                          <Badge
                            variant={mCritical ? 'error' : !mHealthy ? 'warning' : 'success'}
                            className="font-mono text-xs font-bold"
                          >
                            {m.percentage}%
                          </Badge>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            mCritical
                              ? 'bg-rose-500'
                              : !mHealthy
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, m.percentage))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ========================================================================= */}
          {/* SECTION 5: SUBJECT PERFORMANCE COMPARISON & BREAKDOWN                     */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            {/* Best / Lowest Highlights */}
            {comparison && (comparison.best_percentage !== null || comparison.lowest_percentage !== null) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Best Subject */}
                <Card className="p-4 bg-emerald-50/40 border-emerald-200 text-xs space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Best Attendance Subject
                    </span>
                    <Badge variant="success" className="font-mono font-bold text-xs">
                      {comparison.best_percentage}%
                    </Badge>
                  </div>
                  <p className="font-bold text-slate-900 font-heading text-sm">
                    {comparison.best_subject_name || 'N/A'}
                  </p>
                </Card>

                {/* Lowest Subject */}
                <Card className="p-4 bg-rose-50/40 border-rose-200 text-xs space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Lowest Attendance Subject
                    </span>
                    <Badge
                      variant={(comparison.lowest_percentage ?? 0) < 60 ? 'error' : 'warning'}
                      className="font-mono font-bold text-xs"
                    >
                      {comparison.lowest_percentage}%
                    </Badge>
                  </div>
                  <p className="font-bold text-slate-900 font-heading text-sm">
                    {comparison.lowest_subject_name || 'N/A'}
                  </p>
                </Card>
              </div>
            )}

            {/* Subject Analytics Table / Cards */}
            <Card className="p-5 bg-white border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                      Subject-Wise Analytics Breakdown
                    </h3>
                    <p className="text-[11px] text-slate-400">Detailed course metrics, attendance rates, and status</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {subjectList.length} Subjects Evaluated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {subjectList.map((sub) => {
                  const isSubCritical = sub.total_sessions > 0 && sub.percentage < 60.0;
                  const isSubBelow = sub.total_sessions > 0 && sub.percentage < 75.0;

                  return (
                    <div
                      key={sub.subject_id}
                      className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 transition space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            {sub.subject_code}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 font-heading">
                            {sub.subject_name}
                          </h4>
                        </div>
                        <Badge
                          variant={isSubCritical ? 'error' : isSubBelow ? 'warning' : 'success'}
                          withDot
                          className="text-[10px] font-bold"
                        >
                          {isSubCritical ? 'Critical' : isSubBelow ? 'Below 75%' : 'Requirements Met'}
                        </Badge>
                      </div>

                      {/* Progress & Stat Row */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Attendance Rate:</span>
                          <span
                            className={`font-bold font-mono ${
                              isSubCritical
                                ? 'text-rose-600'
                                : isSubBelow
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {sub.percentage}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isSubCritical
                                ? 'bg-rose-500'
                                : isSubBelow
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, sub.percentage))}%` }}
                          />
                        </div>
                      </div>

                      {/* Session Counts */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                        <span>
                          Present: <strong className="text-slate-800">{sub.present_sessions}</strong>
                        </span>
                        <span>
                          Absent: <strong className="text-rose-600">{sub.absent_sessions}</strong>
                        </span>
                        <span>
                          Total: <strong className="text-slate-800">{sub.total_sessions}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 6: ATTENDANCE LOSS / ABSENCE ANALYSIS                             */}
          {/* ========================================================================= */}
          {absence && (
            <Card className="p-5 bg-white border-slate-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                      Attendance Loss & Absence Analysis
                    </h3>
                    <p className="text-[11px] text-slate-400">Audit of missed lectures across subjects</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Total Absence Volume</span>
                  <p className="text-lg font-bold text-rose-600 font-heading">
                    {absence.total_absent} Classes Missed
                  </p>
                  <span className="text-[10px] text-slate-400">({absence.absence_percentage}% of total schedule)</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Highest Absences In</span>
                  <p className="text-sm font-bold text-slate-900 font-heading truncate">
                    {absence.highest_absence_subject_name || 'None'}
                  </p>
                  <span className="text-[10px] text-rose-600 font-medium">
                    {absence.highest_absence_count > 0 ? `${absence.highest_absence_count} sessions missed` : 'No absences recorded'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Subjects Affected</span>
                  <p className="text-lg font-bold text-slate-900 font-heading">
                    {absence.subjects_affected_count} Courses
                  </p>
                  <span className="text-[10px] text-slate-400">Courses with at least 1 absence</span>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
