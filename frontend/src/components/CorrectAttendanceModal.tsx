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
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
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
  currentStatus: 'PRESENT' | 'ABSENT';
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
  const [targetStatus, setTargetStatus] = useState<'PRESENT' | 'ABSENT'>('PRESENT');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize to opposite status
      setTargetStatus(currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT');
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
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
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
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">Unable to correct attendance</p>
                <p className="text-[11px] text-rose-600">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Student Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 font-heading text-sm">{student.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Roll: #{student.roll_number}</p>
                </div>
              </div>
              <Badge
                variant={currentStatus === 'PRESENT' ? 'success' : 'neutral'}
                className="text-[10px] font-bold"
              >
                Recorded: {currentStatus}
              </Badge>
            </div>
          </div>

          {/* Status Change Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Status Change Transition
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetStatus('PRESENT')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold transition text-xs ${
                  targetStatus === 'PRESENT'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Change to PRESENT</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetStatus('ABSENT')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold transition text-xs ${
                  targetStatus === 'ABSENT'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                    : 'bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Change to ABSENT</span>
              </button>
            </div>

            {/* Visual Transition Badge */}
            <div className="mt-2.5 p-2 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-center gap-2 text-xs font-semibold">
              <span className="text-slate-600">Transition:</span>
              <span
                className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                  currentStatus === 'PRESENT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {currentStatus}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
              <span
                className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                  targetStatus === 'PRESENT'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {targetStatus}
              </span>
            </div>
          </div>

          {/* Mandatory Reason Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="correct-reason"
                className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                Mandatory Correction Reason <span className="text-rose-500">*</span>
              </label>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  charCount === 0
                    ? 'text-slate-400'
                    : charCount < 5
                    ? 'text-amber-600'
                    : charCount <= 500
                    ? 'text-emerald-600'
                    : 'text-rose-600'
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
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-800 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition shadow-2xs resize-none"
            />

            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500">
              <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                Minimum 5 characters. All changes and teacher identities are audited and time-stamped.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
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
