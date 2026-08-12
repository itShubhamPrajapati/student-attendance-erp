import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Filter,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  School,
  GraduationCap,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../auth/AuthContext';
import {
  ActivityItem,
  RecentActivityParams,
} from '../types';
import { apiGetRecentActivity } from '../services/api';
import {
  getActivityIcon,
  getActivityBg,
  formatRelativeTime,
} from '../components/ActivityFeedCard';

export const ActivityPage: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedType, setSelectedType] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 20;

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params: RecentActivityParams = {
      limit,
      page,
      type: selectedType || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
    };

    try {
      const res = await apiGetRecentActivity(params);
      setActivities(res.data.activities || []);
      setTotal(res.data.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load activity timeline.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedType, fromDate, toDate]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleClearFilters = () => {
    setSelectedType('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const hasActiveFilters = selectedType !== '' || fromDate !== '' || toDate !== '';

  const totalPages = Math.ceil(total / limit) || 1;

  const getRoleBadge = () => {
    if (user?.role === 'ADMIN') {
      return (
        <Badge variant="neutral" className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-indigo-600" /> College Admin Scope
        </Badge>
      );
    }
    if (user?.role === 'TEACHER') {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <School className="w-3 h-3 text-amber-600" /> Faculty Scope
        </Badge>
      );
    }
    return (
      <Badge variant="info" className="flex items-center gap-1">
        <GraduationCap className="w-3 h-3 text-indigo-600" /> Student Personal Scope
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-4 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Recent Activity Timeline"
        description="Comprehensive, chronological activity history aggregated from verified attendance records, sessions, and audit events."
        badge={getRoleBadge()}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchActivities}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Feed
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Filter Activity Events
            </h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Event Type Filter */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Event Type</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            >
              <option value="">All Event Categories</option>
              <option value="ATTENDANCE_MARKED">Attendance Marked (On-time)</option>
              <option value="ATTENDANCE_LATE">Late Check-ins</option>
              <option value="ATTENDANCE_CORRECTED">Attendance Corrections</option>
              <option value="MANUAL_ATTENDANCE">Manual Attendance Marks</option>
              <option value="SESSION_STARTED">Sessions Started</option>
              <option value="SESSION_FINALIZED">Sessions Finalized</option>
              <option value="SESSION_REOPENED">Sessions Reopened</option>
              <option value="ATTENDANCE_PROOF_GENERATED">Proof Receipts Generated</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">From Date</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="text-xs"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">To Date</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Main Timeline List */}
      {loading ? (
        <Card className="p-16 bg-white border-slate-200/80 shadow-xs flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" label="Retrieving live activity records..." />
        </Card>
      ) : error ? (
        <Card className="p-8 text-center bg-rose-50 border-rose-200 text-rose-800 space-y-3">
          <AlertTriangle className="w-8 h-8 mx-auto text-rose-600" />
          <h3 className="text-sm font-bold font-heading">Unable to Load Activity Timeline</h3>
          <p className="text-xs text-rose-600 max-w-md mx-auto">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchActivities} className="mt-2">
            Retry Loading
          </Button>
        </Card>
      ) : activities.length === 0 ? (
        <Card className="p-12 text-center bg-white border-slate-200/80 shadow-xs space-y-3">
          <Activity className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-base font-bold font-heading text-slate-800">
            No Activity Records Found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {hasActiveFilters
              ? 'No activity matched your selected filter criteria. Try clearing filters or broadening the date range.'
              : 'Activity will appear here as attendance sessions are conducted and verified check-ins occur.'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <span>Showing {activities.length} of {total} events</span>
            <span>Page {page} of {totalPages}</span>
          </div>

          <div className="space-y-2.5">
            {activities.map((item) => {
              let targetLink: string | null = null;
              let targetLabel: string = 'View';

              if (user?.role === 'TEACHER' && item.session_id) {
                targetLink = `/teacher/attendance/${item.session_id}/records`;
                targetLabel = 'Session Records';
              } else if (user?.role === 'STUDENT' && item.proof_public_id) {
                targetLink = `/verify/${item.proof_public_id}`;
                targetLabel = 'Verify Proof';
              } else if (user?.role === 'ADMIN' && item.session_id) {
                targetLink = `/admin/attendance`;
                targetLabel = 'Attendance Log';
              }

              return (
                <Card
                  key={item.id}
                  className="p-4 bg-white border-slate-200/80 shadow-xs rounded-2xl hover:border-slate-300 transition space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-xl border flex-shrink-0 ${getActivityBg(item.type)}`}>
                        {getActivityIcon(item.type)}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 font-heading">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatRelativeTime(item.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(item.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {targetLink && (
                        <Link to={targetLink}>
                          <Button variant="outline" size="sm" className="text-[11px] py-1 px-2.5">
                            {targetLabel} <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Context Metadata Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-3 flex-wrap">
                      {item.subject_name && (
                        <span className="font-semibold text-slate-800">
                          {item.subject_name} {item.subject_code ? `(${item.subject_code})` : ''}
                        </span>
                      )}
                      {item.class_name && (
                        <span>&bull; Class: {item.class_name}</span>
                      )}
                      {item.student_name && (
                        <span>&bull; Student: {item.student_name} {item.student_roll_number ? `(${item.student_roll_number})` : ''}</span>
                      )}
                      {item.actor_name && (
                        <span className="text-slate-400">&bull; Performed by {item.actor_name}</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>

              <span className="text-xs text-slate-600 font-semibold">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
