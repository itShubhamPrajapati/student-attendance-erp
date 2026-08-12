import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Edit3,
  UserCheck,
  PlayCircle,
  Lock,
  Unlock,
  FileCheck,
  Activity,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { ActivityItem, ActivityType } from '../types';
import { apiGetRecentActivity } from '../services/api';

interface ActivityFeedCardProps {
  limit?: number;
  showViewAllLink?: boolean;
  viewAllUrl?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  typeFilter?: string;
  role?: 'ADMIN' | 'TEACHER' | 'STUDENT' | string;
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

export function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'ATTENDANCE_MARKED':
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case 'ATTENDANCE_LATE':
      return <Clock className="w-4 h-4 text-amber-600" />;
    case 'ATTENDANCE_CORRECTED':
      return <Edit3 className="w-4 h-4 text-indigo-600" />;
    case 'MANUAL_ATTENDANCE':
      return <UserCheck className="w-4 h-4 text-indigo-600" />;
    case 'SESSION_STARTED':
      return <PlayCircle className="w-4 h-4 text-sky-600" />;
    case 'SESSION_FINALIZED':
      return <Lock className="w-4 h-4 text-slate-700" />;
    case 'SESSION_REOPENED':
      return <Unlock className="w-4 h-4 text-amber-600" />;
    case 'ATTENDANCE_PROOF_GENERATED':
      return <FileCheck className="w-4 h-4 text-emerald-600" />;
    default:
      return <Activity className="w-4 h-4 text-slate-500" />;
  }
}

export function getActivityBg(type: ActivityType) {
  switch (type) {
    case 'ATTENDANCE_MARKED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'ATTENDANCE_LATE':
      return 'bg-amber-50 text-amber-800 border-amber-100';
    case 'ATTENDANCE_CORRECTED':
    case 'MANUAL_ATTENDANCE':
      return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    case 'SESSION_STARTED':
      return 'bg-sky-50 text-sky-700 border-sky-100';
    case 'SESSION_FINALIZED':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    case 'SESSION_REOPENED':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'ATTENDANCE_PROOF_GENERATED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-100';
  }
}

export const ActivityFeedCard: React.FC<ActivityFeedCardProps> = ({
  limit = 5,
  showViewAllLink = true,
  viewAllUrl = '/activity',
  title = 'Recent Activity',
  subtitle = 'Authoritative real-time lecture & attendance events',
  className = '',
  typeFilter,
  role,
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetRecentActivity({
        limit,
        type: typeFilter,
      });
      setActivities(res.data.activities || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load activity feed');
    } finally {
      setLoading(false);
    }
  }, [limit, typeFilter]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return (
    <Card className={`p-4 sm:p-5 bg-white border-slate-200/80 shadow-xs rounded-3xl space-y-4 ${className}`}>
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
              {title}
            </h3>
            {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchActivity}
            disabled={loading}
            title="Refresh feed"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          {showViewAllLink && (
            <Link
              to={viewAllUrl}
              className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-0.5 ml-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Content Feed */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center">
          <LoadingSpinner size="sm" label="Loading activity..." />
        </div>
      ) : error ? (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchActivity}>
            Retry
          </Button>
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center space-y-1">
          <Activity className="w-7 h-7 mx-auto text-slate-300" />
          <p className="text-xs font-semibold text-slate-700">No recent activity yet</p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Live attendance markings, session lifecycle updates, and audit records will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activities.map((item) => {
            // Determine target link if relevant
            let targetLink: string | null = null;
            if (role === 'TEACHER' && item.session_id) {
              targetLink = `/teacher/attendance/${item.session_id}/records`;
            } else if (role === 'STUDENT' && item.proof_public_id) {
              targetLink = `/verify/${item.proof_public_id}`;
            } else if (role === 'ADMIN' && item.session_id) {
              targetLink = `/admin/attendance`;
            }

            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-xl border flex-shrink-0 ${getActivityBg(item.type)}`}>
                      {getActivityIcon(item.type)}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-600 leading-snug">
                        {item.description}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap flex-shrink-0">
                    {formatRelativeTime(item.created_at)}
                  </span>
                </div>

                {/* Metadata tags & Resource link */}
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/50 text-slate-500">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.subject_name && (
                      <span className="font-semibold text-slate-700">
                        {item.subject_name} {item.subject_code ? `(${item.subject_code})` : ''}
                      </span>
                    )}
                    {item.class_name && (
                      <span>&bull; {item.class_name}</span>
                    )}
                    {item.actor_name && (
                      <span className="text-slate-400">&bull; by {item.actor_name}</span>
                    )}
                  </div>

                  {targetLink && (
                    <Link
                      to={targetLink}
                      className="text-indigo-600 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      Details <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
