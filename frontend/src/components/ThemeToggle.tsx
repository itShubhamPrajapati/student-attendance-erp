import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'dropdown' | 'pill';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  variant = 'button',
  showLabel = false,
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  if (variant === 'pill') {
    return (
      <div
        role="group"
        aria-label="Theme selection"
        className={cn(
          'inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs',
          className
        )}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          aria-label="Set light theme"
          aria-pressed={theme === 'light'}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition active:scale-95',
            theme === 'light'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          aria-label="Set dark theme"
          aria-pressed={theme === 'dark'}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition active:scale-95',
            theme === 'dark'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          aria-label="Set system theme"
          aria-pressed={theme === 'system'}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition active:scale-95',
            theme === 'system'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Laptop className="w-3.5 h-3.5 text-slate-400" />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white transition shadow-2xs active:scale-95 cursor-pointer select-none',
        className
      )}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
      {showLabel && <span className="ml-2 text-xs font-semibold">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
    </button>
  );
};
