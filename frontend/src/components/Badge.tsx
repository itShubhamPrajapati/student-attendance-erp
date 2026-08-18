import React from 'react';
import { cn } from '../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  withDot = false,
  ...props
}) => {
  const variants = {
    primary:
      'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-500/30',
    secondary:
      'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30',
    tertiary:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30',
    success:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 dark:border-emerald-500/30',
    warning:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 dark:border-amber-500/30',
    error:
      'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 dark:border-rose-500/30',
    info:
      'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 dark:border-blue-500/30',
    neutral:
      'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80',
  };

  const dotVariants = {
    primary: 'bg-indigo-500',
    secondary: 'bg-purple-500',
    tertiary: 'bg-emerald-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-400',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider uppercase font-semibold',
    md: 'text-xs px-2.5 py-0.5 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {withDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse shrink-0', dotVariants[variant])} />
      )}
      <span>{children}</span>
    </span>
  );
};
