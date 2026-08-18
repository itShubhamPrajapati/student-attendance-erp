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
  CheckCircle2,
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { LoadingSpinner } from './LoadingSpinner';
import { AttendanceAuditItem } from '../types';
import { apiGetAttendanceAudit } from '../services/api';

interface AttendanceAuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceId: string;
  studentName: string;
  rollNumber: string;
  subjectName: string;
}

export const AttendanceAuditHistoryModal: React.FC<AttendanceAuditHistoryModalProps> = ({
  isOpen,
  onClose,
  attendanceId,
  studentName,
  rollNumber,
  subjectName,
}) => {
  const [logs, setLogs] = useState<AttendanceAuditItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && attendanceId) {
      setLoading(true);
      setError(null);
      apiGetAttendanceAudit(attendanceId)
        .then((res) => {
          setLogs(res.data || []);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Failed to load audit history.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, attendanceId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-history-title"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 id="audit-history-title" className="text-base font-bold font-heading">
                Attendance Audit Trail
              </h3>
              <p className="text-xs text-indigo-200">
                {studentName} (Roll #{rollNumber}) &bull; {subjectName}
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
              <LoadingSpinner size="md" label="Loading audit history..." />
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Audit Record Unavailable</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{error}</p>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-medium text-slate-600 dark:text-slate-300">No manual changes or corrections recorded.</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                This attendance was marked automatically via student QR scan.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
                <span>Timeline ({logs.length} audit {logs.length === 1 ? 'event' : 'events'})</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">Immutable System Log</span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {logs.map((item, idx) => {
                  const isManualMark = item.action === 'MANUAL_MARK';
                  const isPresent = item.new_status === 'PRESENT';

                  return (
                    <div key={item.id || idx} className="relative space-y-2">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 bg-white dark:bg-slate-900 flex items-center justify-center shadow-xs ${
                          isManualMark
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-amber-500 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isManualMark ? 'bg-indigo-600' : 'bg-amber-600'
                          }`}
                        />
                      </div>

                      {/* Event Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isManualMark ? 'neutral' : 'warning'}
                            className="text-[10px] font-bold uppercase tracking-wider"
                          >
                            {isManualMark ? 'Manual Attendance' : 'Attendance Correction'}
                          </Badge>

                          {item.previous_status ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              <span>{item.previous_status}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span
                                className={
                                  isPresent ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-rose-700 dark:text-rose-300 font-bold'
                                }
                              >
                                {item.new_status}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              {item.new_status}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Reason Box */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Explanatory Reason:</span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 italic bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                          &ldquo;{item.reason}&rdquo;
                        </p>
                      </div>

                      {/* Actor Meta */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Logged by: <strong className="text-slate-700 dark:text-slate-200">{item.actor_name}</strong>
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-300 font-semibold">
                            {item.actor_role}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="font-semibold text-[10px]">Verified Audit</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Close Audit Trail
          </Button>
        </div>
      </div>
    </div>
  );
};
