import React from 'react';
import { cn } from '../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  variant?: 'solid' | 'glass' | 'glass-strong' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  variant = 'solid',
  ...props
}) => {
  const variantStyles = {
    solid: 'border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs',
    glass: 'glass-surface border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-sm',
    'glass-strong': 'glass-surface-strong border border-slate-200/90 dark:border-white/15 text-slate-900 dark:text-white shadow-md',
    elevated: 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg',
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-5 text-slate-800 dark:text-slate-200 transition-all duration-200',
        variantStyles[variant],
        hoverEffect &&
          'hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-800', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <h3 className={cn('font-semibold text-lg text-slate-900 dark:text-white font-heading tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className, ...props }) => (
  <p className={cn('text-xs text-slate-500 dark:text-slate-400', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('pt-4 space-y-3', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('pt-4 mt-2 flex items-center border-t border-slate-100 dark:border-slate-800', className)} {...props}>
    {children}
  </div>
);

