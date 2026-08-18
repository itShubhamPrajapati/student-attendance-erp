import React from 'react';
import { cn } from '../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  variant?: 'solid' | 'glass' | 'glass-strong' | 'elevated' | 'container' | 'outline';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  variant = 'solid',
  ...props
}) => {
  const variantStyles = {
    solid: 'border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#111726] shadow-xs',
    glass: 'glass-surface border border-slate-200/70 dark:border-white/10 text-[#131b2e] dark:text-[#f8fafc] shadow-sm',
    'glass-strong': 'glass-surface-strong border border-slate-200/90 dark:border-white/15 text-[#131b2e] dark:text-white shadow-md',
    elevated: 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151c2e] shadow-lg',
    container: 'border border-indigo-100/70 dark:border-indigo-950/70 bg-[#f2f3ff] dark:bg-[#171f33]',
    outline: 'border border-slate-200/90 dark:border-slate-800 bg-transparent',
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-5 text-[#131b2e] dark:text-[#f8fafc] transition-all duration-200',
        variantStyles[variant],
        hoverEffect &&
          'hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-300/80 dark:hover:border-indigo-500/40 transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-800/80', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <h3 className={cn('font-semibold text-lg text-[#131b2e] dark:text-white font-heading tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className, ...props }) => (
  <p className={cn('text-xs text-[#464554] dark:text-slate-400', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('pt-4 space-y-3', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('pt-4 mt-2 flex items-center border-t border-slate-100 dark:border-slate-800/80', className)} {...props}>
    {children}
  </div>
);
