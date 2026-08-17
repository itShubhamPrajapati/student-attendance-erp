import React from 'react';
import { cn } from '../utils/cn';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'container' | 'outline' | 'ghost' | 'danger' | 'glass' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium font-heading rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none';

  const variants = {
    primary:
      'bg-[#4648d4] hover:bg-[#383ab6] text-white shadow-xs hover:shadow-[0_4px_14px_rgba(70,72,212,0.28)] focus:ring-[#4648d4] font-semibold',
    secondary:
      'bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-xs focus:ring-slate-700 font-medium',
    container:
      'bg-[#eaedff] dark:bg-[#1e2840] text-[#4648d4] dark:text-[#c0c1ff] hover:bg-[#dae2fd] dark:hover:bg-[#283350] border border-indigo-200/60 dark:border-indigo-800/40 font-medium',
    outline:
      'border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111726] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 focus:ring-primary shadow-xs font-medium',
    ghost:
      'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white focus:ring-slate-400',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500 font-semibold',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-emerald-500/25 focus:ring-emerald-500 font-semibold',
    glass:
      'glass-surface text-[#131b2e] dark:text-[#f8fafc] border border-white/60 dark:border-white/10 hover:bg-white/90 dark:hover:bg-slate-800/80 shadow-xs focus:ring-primary font-medium',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-[34px] gap-1.5 rounded-lg',
    md: 'text-sm px-4 py-2.5 min-h-[42px] gap-2 rounded-xl',
    lg: 'text-base px-5 py-3 min-h-[48px] gap-2.5 rounded-xl',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" className="text-current" />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      <span>{isLoading && loadingText ? loadingText : children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};
