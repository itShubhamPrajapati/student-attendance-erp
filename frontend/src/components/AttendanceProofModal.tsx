import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { AttendanceProof } from '../types';
import {
  apiGetStudentAttendanceProof,
  apiDownloadStudentAttendanceProofPDF,
  apiGetTeacherAttendanceProof,
  apiDownloadTeacherAttendanceProofPDF,
  apiGetAdminAttendanceProof,
  apiDownloadAdminAttendanceProofPDF,
} from '../services/api';
import { AttendanceProofCard } from './AttendanceProofCard';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';

interface AttendanceProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceId: string | null;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export const AttendanceProofModal: React.FC<AttendanceProofModalProps> = ({
  isOpen,
  onClose,
  attendanceId,
  role,
}) => {
  const [proof, setProof] = useState<AttendanceProof | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const fetchProof = useCallback(async () => {
    if (!attendanceId) return;
    setLoading(true);
    setError(null);

    try {
      let res;
      if (role === 'STUDENT') {
        res = await apiGetStudentAttendanceProof(attendanceId);
      } else if (role === 'TEACHER') {
        res = await apiGetTeacherAttendanceProof(attendanceId);
      } else {
        res = await apiGetAdminAttendanceProof(attendanceId);
      }
      setProof(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve attendance proof');
    } finally {
      setLoading(false);
    }
  }, [attendanceId, role]);

  useEffect(() => {
    if (isOpen && attendanceId) {
      fetchProof();
    } else {
      setProof(null);
      setError(null);
    }
  }, [isOpen, attendanceId, fetchProof]);

  const handleDownloadPDF = async () => {
    if (!attendanceId || !proof) return;
    setDownloadingPDF(true);
    try {
      if (role === 'STUDENT') {
        await apiDownloadStudentAttendanceProofPDF(attendanceId, proof.public_id);
      } else if (role === 'TEACHER') {
        await apiDownloadTeacherAttendanceProofPDF(attendanceId, proof.public_id);
      } else {
        await apiDownloadAdminAttendanceProofPDF(attendanceId, proof.public_id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF receipt');
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (!isOpen || !attendanceId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible">
        {/* Modal Top Header (Hidden in Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60 print:hidden">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-heading">
              Digital Attendance Proof
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Official institutional record and real-time verification receipt
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <LoadingSpinner size="lg" label="Retrieving and verifying digital attendance proof..." />
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <Button size="sm" variant="outline" onClick={fetchProof}>
                Retry
              </Button>
            </div>
          ) : proof ? (
            <AttendanceProofCard
              proof={proof}
              onDownloadPDF={handleDownloadPDF}
              isDownloadingPDF={downloadingPDF}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
