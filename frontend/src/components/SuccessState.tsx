import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';

export interface SuccessStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  icon?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title = 'Action Completed Successfully',
  description = 'Your changes have been verified and saved to authoritative records.',
  action,
  secondaryAction,
  icon,
  compact = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/30 animate-in fade-in duration-150',
        compact ? 'p-5 sm:p-6' : 'p-8 sm:p-10',
        className
      )}
      role="status"
    >
      <div
        className={cn(
          'rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs',
          compact ? 'w-10 h-10 mb-2.5' : 'w-12 h-12 mb-3.5'
        )}
      >
        {icon || <CheckCircle2 className={compact ? 'w-5 h-5' : 'w-6 h-6'} />}
      </div>

      <h4 className={cn('font-bold text-emerald-950 dark:text-emerald-100 font-heading tracking-tight', compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base')}>
        {title}
      </h4>
      <p className={cn('mt-1 text-emerald-800/80 dark:text-emerald-300/80 max-w-sm leading-relaxed', compact ? 'text-[11px]' : 'text-xs')}>
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
