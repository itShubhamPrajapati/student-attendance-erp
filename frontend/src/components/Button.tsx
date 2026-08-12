import React from 'react';
import { cn } from '../utils/cn';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
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
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none';

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow focus:ring-indigo-500',
    secondary: 'bg-slate-800 hover:bg-slate-900 text-white shadow-xs focus:ring-slate-700',
    outline:
      'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 focus:ring-indigo-500 shadow-xs',
    ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus:ring-slate-400',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-[34px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[42px] gap-2',
    lg: 'text-base px-5 py-3 min-h-[48px] gap-2.5',
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
