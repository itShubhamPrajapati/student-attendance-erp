import React from 'react';
import { cn } from '../utils/cn';
import { LoadingSpinner } from './LoadingSpinner';

export type LoadingVariant = 'page' | 'table' | 'kpi' | 'chart' | 'section' | 'activity' | 'inline';

export interface LoadingStateProps {
  variant?: LoadingVariant;
  message?: string;
  className?: string;
  rows?: number;
  columns?: number;
  cards?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'page',
  message = 'Loading...',
  className,
  rows = 4,
  columns = 4,
  cards = 4,
}) => {
  // 1. Full Page Centered Spinner
  if (variant === 'page') {
    return (
      <div
        className={cn(
          'min-h-[50vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <LoadingSpinner size="lg" className="mb-3.5 text-indigo-600" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{message}</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Please wait while we retrieve your records.</p>
      </div>
    );
  }

  // 2. Inline Spinner
  if (variant === 'inline') {
    return (
      <div className={cn('inline-flex items-center gap-2 py-1', className)} role="status" aria-live="polite">
        <LoadingSpinner size="sm" className="text-indigo-600" />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{message}</span>
      </div>
    );
  }

  // 3. Table Skeleton Rows
  if (variant === 'table') {
    return (
      <div
        className={cn(
          'w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs',
          className
        )}
        role="status"
        aria-label={message}
        aria-live="polite"
      >
        <div className="animate-pulse divide-y divide-slate-100 dark:divide-slate-800">
          {/* Table Header Skeleton */}
          <div className="bg-slate-50/70 dark:bg-slate-800/60 p-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
            ))}
          </div>

          {/* Table Body Skeleton Rows */}
          {Array.from({ length: rows }).map((_, rIdx) => (
            <div
              key={rIdx}
              className="p-4 grid gap-4 items-center"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }).map((_, cIdx) => (
                <div
                  key={cIdx}
                  className={cn(
                    'h-3.5 bg-slate-100 dark:bg-slate-800 rounded-md',
                    cIdx === 0 ? 'w-5/6' : cIdx === 1 ? 'w-2/3' : 'w-1/2'
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. KPI Cards Grid Skeleton
  if (variant === 'kpi') {
    return (
      <div
        className={cn(
          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse',
          className
        )}
        role="status"
        aria-label={message}
      >
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2" />
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3" />
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  // 5. Chart Skeleton Area
  if (variant === 'chart') {
    return (
      <div
        className={cn(
          'p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 animate-pulse',
          className
        )}
        role="status"
        aria-label={message}
      >
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/3" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/6" />
        </div>
        <div className="h-56 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-end justify-between p-4 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-200 dark:bg-slate-700 rounded-t-md w-full"
              style={{ height: `${20 + (i * 12) % 65}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // 6. Activity Feed Skeleton Rows
  if (variant === 'activity') {
    return (
      <div className={cn('space-y-2.5 animate-pulse', className)} role="status" aria-label={message}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 w-full">
                <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                <div className="space-y-1.5 w-3/4">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-md w-5/6" />
                </div>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-md w-12 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 7. General Section Skeleton
  return (
    <div
      className={cn(
        'p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 animate-pulse',
        className
      )}
      role="status"
      aria-label={message}
    >
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/4" />
      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4" />
      <div className="h-20 bg-slate-50 dark:bg-slate-800/30 rounded-xl" />
    </div>
  );
};
