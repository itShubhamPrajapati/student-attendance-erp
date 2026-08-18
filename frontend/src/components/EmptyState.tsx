import React from 'react';
import {
  Inbox,
  Search,
  Calendar,
  Layers,
  BarChart2,
  Users,
  Activity,
  Filter,
} from 'lucide-react';
import { cn } from '../utils/cn';

export type EmptyStatePreset =
  | 'NO_DATA'
  | 'NO_RESULTS'
  | 'NO_ACTIVITY'
  | 'NO_ATTENDANCE'
  | 'NO_SESSIONS'
  | 'NO_STUDENTS'
  | 'NO_ANALYTICS'
  | 'FILTERED_EMPTY'
  | 'SEARCH_EMPTY';

export interface EmptyStateProps {
  preset?: EmptyStatePreset;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  badgeText?: string;
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  preset,
  icon,
  title,
  description,
  action,
  primaryAction,
  secondaryAction,
  badgeText,
  compact = false,
  className,
}) => {
  // Default values based on semantic preset
  let defaultIcon = <Inbox className="w-8 h-8 text-slate-400 dark:text-slate-500" />;
  let defaultTitle = 'No Information Available';
  let defaultDesc = 'There are no records to display at this time.';

  if (preset === 'NO_RESULTS' || preset === 'FILTERED_EMPTY') {
    defaultIcon = <Filter className="w-8 h-8 text-slate-400 dark:text-slate-500" />;
    defaultTitle = 'No Matching Records';
    defaultDesc = 'No records matched your selected filter criteria. Try adjusting or clearing your filters.';
  } else if (preset === 'SEARCH_EMPTY') {
    defaultIcon = <Search className="w-8 h-8 text-slate-400 dark:text-slate-500" />;
    defaultTitle = 'No Search Results Found';
    defaultDesc = 'No entries matched your search query. Try searching by different keywords or identifiers.';
  } else if (preset === 'NO_ATTENDANCE') {
    defaultIcon = <Calendar className="w-8 h-8 text-indigo-400 dark:text-indigo-400" />;
    defaultTitle = 'No Attendance Records Yet';
    defaultDesc = 'Verified lecture attendance records will appear here as sessions are conducted.';
  } else if (preset === 'NO_SESSIONS') {
    defaultIcon = <Layers className="w-8 h-8 text-indigo-400 dark:text-indigo-400" />;
    defaultTitle = 'No Attendance Sessions';
    defaultDesc = 'No active or historical attendance sessions have been created for this course.';
  } else if (preset === 'NO_STUDENTS') {
    defaultIcon = <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />;
    defaultTitle = 'No Enrolled Students';
    defaultDesc = 'There are no students assigned to this classroom batch yet.';
  } else if (preset === 'NO_ANALYTICS') {
    defaultIcon = <BarChart2 className="w-8 h-8 text-indigo-400 dark:text-indigo-400" />;
    defaultTitle = 'No Analytics Available Yet';
    defaultDesc = 'Attendance trend charts and performance insights will populate once attendance is marked.';
  } else if (preset === 'NO_ACTIVITY') {
    defaultIcon = <Activity className="w-8 h-8 text-slate-400 dark:text-slate-500" />;
    defaultTitle = 'No Recent Activity';
    defaultDesc = 'Real-time attendance markings, session updates, and proof generations will appear here.';
  }

  const effectiveIcon = icon !== undefined ? icon : defaultIcon;
  const effectiveTitle = title || defaultTitle;
  const effectiveDesc = description || defaultDesc;
  const effectiveAction = primaryAction || action;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 animate-in fade-in duration-150',
        compact ? 'p-6 sm:p-8' : 'p-8 sm:p-12',
        className
      )}
      role="status"
    >
      <div
        className={cn(
          'rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shadow-xs',
          compact ? 'w-11 h-11 mb-3' : 'w-14 h-14 mb-4'
        )}
      >
        {effectiveIcon}
      </div>

      {badgeText && (
        <span className="mb-2 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 rounded-full">
          {badgeText}
        </span>
      )}

      <h4 className={cn('font-bold text-slate-800 dark:text-slate-100 font-heading tracking-tight', compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base')}>
        {effectiveTitle}
      </h4>
      <p className={cn('mt-1.5 text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed', compact ? 'text-[11px]' : 'text-xs')}>
        {effectiveDesc}
      </p>

      {(effectiveAction || secondaryAction) && (
        <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
          {effectiveAction}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
