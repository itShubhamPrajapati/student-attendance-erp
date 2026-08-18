import React, { useState } from 'react';
import { X, Unlock, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { apiReopenAdminSession } from '../services/api';

interface ReopenAttendanceSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  subjectName: string;
  classNameStr: string;
  onSuccess: () => void;
}

export const ReopenAttendanceSessionModal: React.FC<ReopenAttendanceSessionModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  subjectName,
  classNameStr,
  onSuccess,
}) => {
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const trimmedReason = reason.trim();
  const isValidLength = trimmedReason.length >= 5 && trimmedReason.length <= 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidLength) {
      setError('Please provide a mandatory reason between 5 and 500 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiReopenAdminSession(sessionId, { reason: trimmedReason });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reopen attendance session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reopen-session-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <h3 id="reopen-session-title" className="text-base font-bold font-heading">
                Reopen Finalized Session
              </h3>
              <p className="text-xs text-amber-100">
                {subjectName} &bull; {classNameStr}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Warning Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Administrator Action Required</p>
              <p className="text-amber-800 dark:text-amber-300">
                Reopening this session unfreezes attendance records and allows authorized modifications. This action is immutable and logged in the institutional audit log.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {/* Mandatory Reason Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="reopen-reason" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mandatory Institutional Reason <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  trimmedReason.length < 5 || trimmedReason.length > 500
                    ? 'text-rose-500 dark:text-rose-400 font-medium'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {trimmedReason.length}/500 chars (min 5)
              </span>
            </div>
            <textarea
              id="reopen-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Approved retroactive adjustment following Dean's office verification."
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none transition bg-slate-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Provide a clear reason for the session audit trail.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !isValidLength}
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-xs border-transparent"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Reopening...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Reopen Session</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
