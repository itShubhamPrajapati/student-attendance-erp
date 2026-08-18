import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, RefreshCw, WifiOff, ShieldAlert, FileQuestion } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './Button';
import { apiErrorToUserMessage, classifyStatus } from '../utils/apiError';

export type ErrorVariant = 'card' | 'banner' | 'page' | 'inline';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: unknown;
  onRetry?: () => Promise<void> | void;
  retryLabel?: string;
  variant?: ErrorVariant;
  className?: string;
  icon?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  error,
  onRetry,
  retryLabel = 'Try Again',
  variant = 'card',
  className,
  icon,
}) => {
  const [retrying, setRetrying] = useState(false);

  // Compute clean user-safe message
  const userSafeDescription = message || apiErrorToUserMessage(error);

  // Determine appropriate icon if not provided
  let errorStatus: number | undefined;
  if (error && typeof error === 'object' && 'status' in error) {
    errorStatus = (error as { status?: number }).status;
  }
  const category = classifyStatus(errorStatus, typeof error === 'string' ? error : undefined);

  const getSemanticIcon = () => {
    if (icon) return icon;
    switch (category) {
      case 'NETWORK_ERROR':
        return <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'UNAUTHORIZED':
      case 'FORBIDDEN':
        return <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'NOT_FOUND':
        return <FileQuestion className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
    }
  };

  const handleRetryClick = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  // 1. Full Page Centered Error
  if (variant === 'page') {
    return (
      <div
        className={cn(
          'min-h-[50vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200',
          className
        )}
        role="alert"
        aria-live="assertive"
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400 shadow-xs">
          {getSemanticIcon()}
        </div>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-heading">
          {title || 'Unable to Load Information'}
        </h3>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
          {userSafeDescription}
        </p>

        {onRetry && (
          <div className="mt-5">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRetryClick}
              isLoading={retrying}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              {retryLabel}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // 2. Banner Format
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'p-3.5 sm:p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in',
          className
        )}
        role="alert"
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="mt-0.5 sm:mt-0">{getSemanticIcon()}</div>
          <div>
            {title && <span className="font-bold block leading-tight">{title}</span>}
            <span className="text-[11px] sm:text-xs text-rose-800 dark:text-rose-300 leading-snug">
              {userSafeDescription}
            </span>
          </div>
        </div>

        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryClick}
            isLoading={retrying}
            className="self-end sm:self-center text-xs py-1 px-3 bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 hover:bg-rose-50"
            leftIcon={<RefreshCw className="w-3 h-3" />}
          >
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  // 3. Inline Format
  if (variant === 'inline') {
    return (
      <div className={cn('inline-flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 py-1', className)} role="alert">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{userSafeDescription}</span>
        {onRetry && (
          <button
            onClick={handleRetryClick}
            disabled={retrying}
            className="font-semibold underline hover:text-rose-800 dark:hover:text-rose-200 ml-1 cursor-pointer"
          >
            {retryLabel}
          </button>
        )}
      </div>
    );
  }

  // 4. Default Card Format
  return (
    <div
      className={cn(
        'p-5 sm:p-6 rounded-2xl border border-rose-200 dark:border-rose-800/80 bg-white dark:bg-slate-900 text-center shadow-xs space-y-3 animate-in fade-in',
        className
      )}
      role="alert"
    >
      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-800">
        {getSemanticIcon()}
      </div>

      <div>
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-heading">
          {title || 'Unable to Load Data'}
        </h4>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          {userSafeDescription}
        </p>
      </div>

      {onRetry && (
        <div className="pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryClick}
            isLoading={retrying}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
