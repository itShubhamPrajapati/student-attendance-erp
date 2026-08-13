import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Printer,
  ShieldCheck,
  Building2,
  BookOpen,
  User,
  ExternalLink,
} from 'lucide-react';
import { AttendanceProof } from '../types';
import { Badge } from './Badge';
import { Button } from './Button';

interface AttendanceProofCardProps {
  proof: AttendanceProof;
  onDownloadPDF?: () => void;
  isDownloadingPDF?: boolean;
  hideActions?: boolean;
  className?: string;
}

export const AttendanceProofCard: React.FC<AttendanceProofCardProps> = ({
  proof,
  onDownloadPDF,
  isDownloadingPDF = false,
  hideActions = false,
  className = '',
}) => {
  const isLate = proof.attendance_status === 'LATE';
  const isAbsent = proof.attendance_status === 'ABSENT';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Printable Receipt Container */}
      <div
        id="attendance-proof-receipt"
        className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden print:shadow-none print:border print:border-slate-300 print:rounded-xl print:m-0"
      >
        {/* Top Institutional Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-7 relative overflow-hidden print:bg-slate-900 print:text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                  {proof.college_name || 'Academic Institution'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white">
                Official Attendance Receipt
              </h2>
              <p className="text-xs text-slate-400">
                Authoritative verification token issued for academic record
              </p>
            </div>

            {/* Proof Public ID Stamp */}
            <div className="flex flex-col items-start sm:items-end bg-slate-800/80 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-700/50 sm:border-0 max-w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Proof Identifier
              </span>
              <span className="font-mono text-xs sm:text-base font-extrabold text-indigo-300 tracking-wider break-all">
                {proof.public_id}
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
                <ShieldCheck className="w-3 h-3" /> Real-time Verified
              </span>
            </div>
          </div>
        </div>

        {/* Status Callout Banner */}
        <div
          className={`px-6 py-3.5 border-y flex items-center justify-between gap-3 text-xs sm:text-sm font-bold ${
            isLate
              ? 'bg-amber-50/90 border-amber-200 text-amber-900'
              : isAbsent
              ? 'bg-rose-50/90 border-rose-200 text-rose-900'
              : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isLate ? (
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            ) : isAbsent ? (
              <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            )}
            <div>
              <span className="uppercase text-[10px] tracking-wider block font-bold opacity-75">
                Attendance Status
              </span>
              <span className="font-extrabold font-heading text-sm sm:text-base">
                {proof.status_label || proof.attendance_status}
              </span>
            </div>
          </div>

          <Badge
            variant={isLate ? 'warning' : isAbsent ? 'error' : 'success'}
            className="text-xs px-2.5 py-1 font-bold"
          >
            {proof.attendance_status}
          </Badge>
        </div>

        {/* Receipt Content Body */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* Section 1: Student Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              Student Profile & Enrollment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Student Name
                </span>
                <span className="font-bold text-slate-900 font-heading text-sm mt-0.5 block">
                  {proof.student_name}
                </span>
                <span className="text-[11px] text-slate-400">{proof.email}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Roll Number
                </span>
                <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                  {proof.roll_number}
                </span>
                <span className="text-[11px] text-slate-500">{proof.department}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Class & Cohort
                </span>
                <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                  {proof.class_name}
                </span>
                <span className="text-[11px] text-slate-500">
                  Semester {proof.semester} ({proof.section})
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Course & Session Attendance Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Lecture & Session Attendance Log
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Course / Subject
                  </span>
                  <p className="font-bold text-slate-900 font-heading text-sm">
                    {proof.subject_name}
                  </p>
                  <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                    Code: {proof.subject_code}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Faculty Instructor
                  </span>
                  <span className="font-medium text-slate-800">{proof.teacher_name}</span>
                  {proof.teacher_department && (
                    <span className="text-[11px] text-slate-400 block">
                      {proof.teacher_department}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Session Date
                    </span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {proof.session_date}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Lecture Time
                    </span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {proof.session_start_time} – {proof.session_end_time}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Recorded Timestamp:
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {proof.attendance_marked_at
                        ? new Date(proof.attendance_marked_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Late Grace Period:</span>
                    <span className="font-medium">{proof.late_threshold_minutes} Minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Digital Verification & QR Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-slate-50 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Institutional Verification System</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                This digital attendance proof is cryptographically tied to the authoritative
                database attendance ledger. Anyone can verify this receipt by scanning the QR code or visiting the public verification portal.
              </p>
              <div className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1 flex-wrap pt-1">
                <span className="font-semibold text-slate-700">Verification URL:</span>
                <a
                  href={proof.verification_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-indigo-600 hover:underline inline-flex items-center gap-1 break-all"
                >
                  <span>{proof.verification_url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>

            {/* Embedded QR Code */}
            <div className="bg-white p-3 rounded-2xl border border-indigo-200/80 shadow-xs flex flex-col items-center flex-shrink-0">
              <QRCodeSVG
                value={proof.verification_url}
                size={110}
                level="M"
                includeMargin={false}
              />
              <span className="text-[9px] font-bold tracking-wider uppercase text-slate-400 mt-1.5">
                Scan to Verify
              </span>
            </div>
          </div>

          {/* Official Footer Note */}
          <div className="text-center pt-2 border-t border-slate-100 space-y-1">
            <p className="text-[11px] text-slate-400">
              Generated: {new Date(proof.generated_at).toUTCString()} &bull; System Version 4.0
            </p>
            <p className="text-[10px] text-slate-400 italic">
              This digital attendance receipt is generated from the official attendance system. No physical signature is required.
            </p>
          </div>
        </div>
      </div>

      {/* Action Toolbar (Hidden in Print, Responsive Stack on Mobile) */}
      {!hideActions && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 print:hidden">
          <Button
            variant="outline"
            size="md"
            className="w-full sm:w-auto min-h-[44px]"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Receipt
          </Button>

          {onDownloadPDF && (
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto min-h-[44px] font-bold"
              onClick={onDownloadPDF}
              isLoading={isDownloadingPDF}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download PDF Receipt
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
