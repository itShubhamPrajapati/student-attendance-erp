import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  HelpCircle,
  FileText,
  User,
  Clock,
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { AttendanceStatus } from '../types';
import { apiCorrectAttendance } from '../services/api';

interface CorrectAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  attendanceId: string;
  student: {
    name: string;
    roll_number: string;
    email?: string;
  };
  sessionInfo: {
    subject_name: string;
    subject_code: string;
    class_name?: string;
  };
  currentStatus: AttendanceStatus;
}

export const CorrectAttendanceModal: React.FC<CorrectAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  attendanceId,
  student,
  sessionInfo,
  currentStatus,
}) => {
  const [targetStatus, setTargetStatus] = useState<AttendanceStatus>('PRESENT');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Default to an alternate status
      if (currentStatus === 'PRESENT') {
        setTargetStatus('LATE');
      } else if (currentStatus === 'LATE') {
        setTargetStatus('PRESENT');
      } else {
        setTargetStatus('PRESENT');
      }
      setReason('');
      setErrorMessage(null);
    }
  }, [isOpen, currentStatus]);

  if (!isOpen) return null;

  const trimmedReason = reason.trim();
  const charCount = trimmedReason.length;
  const isReasonValid = charCount >= 5 && charCount <= 500;
  const isStatusChanged = targetStatus !== currentStatus;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceId) {
      setErrorMessage('Attendance ID is missing.');
      return;
    }
    if (!isStatusChanged) {
      setErrorMessage('The new status must be different from the current status.');
      return;
    }
    if (!isReasonValid) {
      if (charCount < 5) {
        setErrorMessage('A mandatory explanatory reason of at least 5 characters is required.');
      } else {
        setErrorMessage('Reason cannot exceed 500 characters.');
      }
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiCorrectAttendance(attendanceId, {
        status: targetStatus,
        reason: trimmedReason,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to correct attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="correct-attendance-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 text-white flex items-center justify-between border-b border-amber-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="correct-attendance-title" className="text-base font-bold font-heading">
                Attendance Correction
              </h3>
              <p className="text-xs text-amber-200">
                {sessionInfo.subject_name} ({sessionInfo.subject_code})
                {sessionInfo.class_name ? ` \u2022 ${sessionInfo.class_name}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">Unable to correct attendance</p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Student Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white font-heading text-sm">{student.name}</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">Roll: #{student.roll_number}</p>
                </div>
              </div>
              <Badge
                variant={currentStatus === 'PRESENT' ? 'success' : currentStatus === 'LATE' ? 'warning' : 'neutral'}
                className="text-[10px] font-bold"
              >
                Recorded: {currentStatus}
              </Badge>
            </div>
          </div>

          {/* Status Change Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Status Change Transition
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetStatus('PRESENT')}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border font-bold transition text-xs ${
                  targetStatus === 'PRESENT'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>PRESENT</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetStatus('LATE')}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border font-bold transition text-xs ${
                  targetStatus === 'LATE'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/20'
                    : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>LATE</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetStatus('ABSENT')}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border font-bold transition text-xs ${
                  targetStatus === 'ABSENT'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>ABSENT</span>
              </button>
            </div>

            {/* Visual Transition Badge */}
            <div className="mt-2.5 p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center gap-2 text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Transition:</span>
              <span
                className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                  currentStatus === 'PRESENT'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : currentStatus === 'LATE'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {currentStatus}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span
                className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                  targetStatus === 'PRESENT'
                    ? 'bg-emerald-600 text-white'
                    : targetStatus === 'LATE'
                    ? 'bg-amber-500 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {targetStatus}
              </span>
            </div>

            {!isStatusChanged && (
              <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                * Please select a new status different from the recorded status ({currentStatus}).
              </p>
            )}
          </div>

          {/* Mandatory Reason Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="correct-reason"
                className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                Mandatory Correction Reason <span className="text-rose-500">*</span>
              </label>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  charCount === 0
                    ? 'text-slate-400 dark:text-slate-500'
                    : charCount < 5
                    ? 'text-amber-600 dark:text-amber-400'
                    : charCount <= 500
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {charCount} / 500 characters
              </span>
            </div>

            <textarea
              id="correct-reason"
              rows={3}
              placeholder="e.g. Student provided approved medical slip verified by the department coordinator."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 p-3 text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition shadow-2xs resize-none"
            />

            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                Minimum 5 characters. All changes and teacher identities are audited and time-stamped.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!isReasonValid || !isStatusChanged || isSubmitting}
              isLoading={isSubmitting}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Save Attendance Correction
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
