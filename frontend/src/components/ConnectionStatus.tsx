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
      <div className={cn('inline-flex items-center gap-2 text-xs bg-slate-100/90 border border-slate-200/80 px-3 py-1.5 rounded-xl', className)}>
        <div className="flex items-center gap-1.5">
          <span className={cn('w-2 h-2 rounded-full', backendConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse')} />
          <span className="font-medium text-slate-700">API</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1.5">
          <span className={cn('w-2 h-2 rounded-full', databaseConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse')} />
          <span className="font-medium text-slate-700">DB</span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="text-slate-400 hover:text-indigo-600 transition ml-1"
          title="Refresh connection status"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-indigo-600')} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white/90 p-4 sm:p-5 shadow-soft backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">System Environment & Health Status</h4>
            <p className="text-xs text-slate-500">
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
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold',
              backendConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            )}>
              {backendConnected ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700">Backend API</div>
              <div className="text-[11px] text-slate-400 font-mono">Go :8080</div>
            </div>
          </div>

          <Badge variant={backendConnected ? 'success' : 'error'} withDot>
            {backendConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* Database Status Card */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold',
              databaseConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            )}>
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700">Database</div>
              <div className="text-[11px] text-slate-400 font-mono">PostgreSQL :5432</div>
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
