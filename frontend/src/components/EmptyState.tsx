import React from 'react';
import { cn } from '../utils/cn';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  badgeText?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  badgeText = 'Phase 2 Feature',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
        {icon}
      </div>

      {badgeText && (
        <span className="mb-2 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 rounded-full">
          {badgeText}
        </span>
      )}

      <h4 className="text-base font-semibold text-slate-800 tracking-tight">{title}</h4>
      <p className="mt-1.5 text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
