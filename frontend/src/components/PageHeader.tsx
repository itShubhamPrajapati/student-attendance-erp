import React from 'react';
import { cn } from '../utils/cn';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  breadcrumb,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-6 border-b border-slate-200/70 dark:border-white/10',
        className
      )}
    >
      <div className="space-y-1.5 min-w-0">
        {breadcrumb && <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{breadcrumb}</div>}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#131b2e] dark:text-[#f8fafc] font-heading">
            {title}
          </h1>
          {badge}
        </div>
        {description && <p className="text-xs sm:text-sm text-[#464554] dark:text-slate-400 font-normal leading-relaxed">{description}</p>}
      </div>

      {actions && <div className="flex items-center gap-2.5 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
};
