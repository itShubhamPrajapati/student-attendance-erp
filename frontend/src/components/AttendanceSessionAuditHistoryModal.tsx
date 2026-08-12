import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  AlertCircle,
  User,
  ShieldCheck,
  ArrowRight,
  FileText,
  Calendar,
  Lock,
  Unlock,
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { LoadingSpinner } from './LoadingSpinner';
import { SessionAuditItem } from '../types';
import { apiGetTeacherSessionAudit, apiGetAdminSessionAudit } from '../services/api';

interface AttendanceSessionAuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  subjectName: string;
  classNameStr: string;
  role?: 'TEACHER' | 'ADMIN';
}

export const AttendanceSessionAuditHistoryModal: React.FC<AttendanceSessionAuditHistoryModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  subjectName,
  classNameStr,
  role = 'TEACHER',
}) => {
  const [logs, setLogs] = useState<SessionAuditItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      setLoading(true);
      setError(null);

      const fetchAudit =
        role === 'ADMIN' ? apiGetAdminSessionAudit : apiGetTeacherSessionAudit;

      fetchAudit(sessionId)
        .then((res) => {
          setLogs(res.data || []);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Failed to load session audit history.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, sessionId, role]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-audit-history-title"
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 id="session-audit-history-title" className="text-base font-bold font-heading">
                Session Lifecycle Audit Trail
              </h3>
              <p className="text-xs text-indigo-200">
                {subjectName} &bull; {classNameStr}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <LoadingSpinner size="md" label="Loading lifecycle audit history..." />
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to Load Audit Trail</p>
                <p className="text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="font-medium text-slate-700">No Finalization Events Recorded</p>
              <p className="text-slate-400 text-[11px] max-w-xs mx-auto">
                This attendance session is currently open and has not been finalized or reopened yet.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {logs.map((log) => {
                const isFinalize = log.action === 'FINALIZE';
                const isReopen = log.action === 'REOPEN';

                return (
                  <div key={log.id} className="relative group">
                    {/* Node Icon */}
                    <div
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                        isFinalize
                          ? 'bg-rose-500 text-white'
                          : isReopen
                          ? 'bg-amber-500 text-white'
                          : 'bg-indigo-500 text-white'
                      }`}
                    >
                      {isFinalize ? (
                        <Lock className="w-2.5 h-2.5" />
                      ) : (
                        <Unlock className="w-2.5 h-2.5" />
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-2.5 hover:border-slate-300 transition">
                      {/* Action Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isFinalize
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isFinalize ? 'Session Finalized / Locked' : 'Session Reopened'}
                          </span>
                          <Badge variant="neutral" className="text-[10px] py-0 px-1.5 bg-white">
                            {log.actor_role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* State Transition */}
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/60 text-[11px]">
                        <span className="font-semibold text-slate-500">Lifecycle Transition:</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.previous_status === 'FINALIZED'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {log.previous_status || 'OPEN'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.new_status === 'FINALIZED'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {log.new_status}
                          </span>
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100/80 text-indigo-950 space-y-1">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-900">
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Action Reason:</span>
                        </div>
                        <p className="text-indigo-900/90 text-xs italic leading-relaxed">
                          &ldquo;{log.reason || 'No specific reason provided.'}&rdquo;
                        </p>
                      </div>

                      {/* Actor Info */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Logged by: <strong className="text-slate-700">{log.actor_name}</strong>
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          ID: {log.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Immutable Institutional Audit Log</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
