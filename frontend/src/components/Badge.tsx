import React from 'react';
import { cn } from '../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  withDot = false,
  ...props
}) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    error: 'bg-rose-50 text-rose-700 border-rose-200/80',
    info: 'bg-blue-50 text-blue-700 border-blue-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const dotVariants = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
      {...props}
    >
      {withDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotVariants[variant])} />
      )}
      <span>{children}</span>
    </span>
  );
};
