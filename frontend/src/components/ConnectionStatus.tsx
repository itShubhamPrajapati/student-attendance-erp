import React from 'react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { Badge } from './Badge';
import { Button } from './Button';
import { RefreshCw, Server, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ConnectionStatusProps {
  className?: string;
  compact?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className, compact = false }) => {
  const { backendConnected, databaseConnected, loading, refetch, lastChecked } = useHealthCheck(8000);

  if (compact) {
    return (
      <div className={cn('inline-flex items-center gap-2 text-xs bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-200', className)}>
        <div className="flex items-center gap-1.5">
          <span className={cn('w-2 h-2 rounded-full', backendConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse')} />
          <span className="font-medium text-slate-700 dark:text-slate-300">API</span>
        </div>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <div className="flex items-center gap-1.5">
          <span className={cn('w-2 h-2 rounded-full', databaseConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse')} />
          <span className="font-medium text-slate-700 dark:text-slate-300">DB</span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition ml-1 cursor-pointer"
          title="Refresh connection status"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-indigo-600 dark:text-indigo-400')} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 sm:p-5 shadow-soft backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-heading">System Environment & Health Status</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lastChecked ? `Verified ${lastChecked.toLocaleTimeString()}` : 'Verifying local servers...'}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          isLoading={loading}
          leftIcon={<RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />}
          className="self-start sm:self-auto text-xs"
        >
          Re-Check Status
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3.5">
        {/* Backend Status Card */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold',
              backendConnected ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
            )}>
              {backendConnected ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Backend API</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                {backendConnected ? 'Go / Gin REST API' : 'Service Offline'}
              </div>
            </div>
          </div>

          <Badge variant={backendConnected ? 'success' : 'error'} withDot>
            {backendConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* Database Status Card */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold',
              databaseConnected ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
            )}>
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Database</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                {databaseConnected ? 'PostgreSQL Database' : 'Database Offline'}
              </div>
            </div>
          </div>

          <Badge variant={databaseConnected ? 'success' : 'error'} withDot>
            {databaseConnected ? 'Connected' : 'Unavailable'}
          </Badge>
        </div>
      </div>
    </div>
  );
};
