import React from 'react';
import { cn } from '../utils/cn';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  label,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <div
        className={cn(
          'rounded-full animate-spin border-t-transparent border-indigo-600',
          sizeMap[size],
          className
        )}
      />
      {label && <span className="text-xs text-slate-600 font-medium">{label}</span>}
    </div>
  );
};
