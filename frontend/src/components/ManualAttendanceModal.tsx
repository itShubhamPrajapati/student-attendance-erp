import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  User,
  GraduationCap,
  Clock,
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { AttendanceStatus } from '../types';
import { apiMarkAttendanceManually } from '../services/api';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  session: {
    id: string;
    subject_name: string;
    subject_code: string;
    class_name: string;
  };
  students: Array<{
    student_id: string;
    name: string;
    roll_number: string;
    email: string;
    status: AttendanceStatus;
  }>;
  initialStudentId?: string;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  session,
  students,
  initialStudentId,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [status, setStatus] = useState<AttendanceStatus>('PRESENT');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedStudentId(initialStudentId || (students.length > 0 ? students[0].student_id : ''));
      setStatus('PRESENT');
      setReason('');
      setErrorMessage(null);
    }
  }, [isOpen, initialStudentId, students]);

  if (!isOpen) return null;

  const trimmedReason = reason.trim();
  const charCount = trimmedReason.length;
  const isReasonValid = charCount >= 5 && charCount <= 500;

  const selectedStudent = students.find((s) => s.student_id === selectedStudentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setErrorMessage('Please select a student.');
      return;
    }
    if (!isReasonValid) {
      if (charCount < 5) {
        setErrorMessage('A detailed reason of at least 5 characters is mandatory.');
      } else {
        setErrorMessage('Reason cannot exceed 500 characters.');
      }
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiMarkAttendanceManually({
        session_id: session.id,
        student_id: selectedStudentId,
        status,
        reason: trimmedReason,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to record manual attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-attendance-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between border-b border-indigo-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="manual-attendance-title" className="text-base font-bold font-heading">
                Manual Attendance Marking
              </h3>
              <p className="text-xs text-indigo-200">
                {session.subject_name} ({session.subject_code}) &bull; {session.class_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition"
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
                <p className="font-semibold">Unable to record attendance</p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Student Selector / Info */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Select Student
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3 py-2.5 text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs font-medium"
            >
              {students.map((st) => (
                <option key={st.student_id} value={st.student_id}>
                  Roll #{st.roll_number} — {st.name} ({st.status})
                </option>
              ))}
            </select>
            {selectedStudent && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.name}</span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">&bull; {selectedStudent.email}</span>
                </div>
                <Badge
                  variant={selectedStudent.status === 'PRESENT' ? 'success' : selectedStudent.status === 'LATE' ? 'warning' : 'neutral'}
                  className="text-[10px]"
                >
                  Currently {selectedStudent.status}
                </Badge>
              </div>
            )}
          </div>

          {/* Attendance Status Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Attendance Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('PRESENT')}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border font-bold transition text-xs ${
                  status === 'PRESENT'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>PRESENT</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('LATE')}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border font-bold transition text-xs ${
                  status === 'LATE'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/20'
                    : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>LATE</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('ABSENT')}
                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border font-bold transition text-xs ${
                  status === 'ABSENT'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>ABSENT</span>
              </button>
            </div>
          </div>

          {/* Mandatory Reason Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="manual-reason"
                className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Mandatory Explanatory Reason <span className="text-rose-500">*</span>
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
              id="manual-reason"
              rows={3}
              placeholder="e.g. Student was physically present; QR code camera scanner malfunctioned on their device."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 p-3 text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs resize-none"
            />

            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                Minimum 5 characters. This reason is permanently recorded in the immutable audit log.
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
              disabled={!isReasonValid || isSubmitting || !selectedStudentId}
              isLoading={isSubmitting}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
            >
              Save Attendance Record
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
