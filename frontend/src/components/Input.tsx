import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, isPassword = false, type = 'text', className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold font-heading text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {label}
          </label>
        )}

        <div className="relative rounded-xl">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={resolvedType}
            className={cn(
              'block w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111726] px-3.5 py-2.5 text-sm text-[#131b2e] dark:text-[#f8fafc] placeholder-slate-400 dark:placeholder-slate-500 transition duration-150',
              'focus:border-[#4648d4] dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-[#4648d4]/15',
              leftIcon && 'pl-10',
              isPassword && 'pr-11',
              error && 'border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-300 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-500/20',
              'disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-500 dark:disabled:text-slate-400',
              className
            )}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
