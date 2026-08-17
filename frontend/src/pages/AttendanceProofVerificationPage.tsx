import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  User,
  BookOpen,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import { AttendanceProofVerification } from '../types';
import { apiVerifyAttendanceProof } from '../services/api';

export const AttendanceProofVerificationPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const [data, setData] = useState<AttendanceProofVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState(publicId || '');

  const verifyCode = useCallback(async (code: string) => {
    if (!code || !code.trim()) return;
    setLoading(true);
    try {
      const res = await apiVerifyAttendanceProof(code.trim());
      setData(res.data);
    } catch {
      setData({
        valid: false,
        verification_status: 'INVALID',
        public_id: code,
        verified_at: new Date().toISOString(),
        message: 'The attendance proof could not be verified. Invalid or unrecognized identifier.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (publicId) {
      setSearchCode(publicId);
      verifyCode(publicId);
    } else {
      setLoading(false);
    }
  }, [publicId, verifyCode]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      verifyCode(searchCode.trim());
    }
  };

  const isLate = data?.attendance_status === 'LATE';
  const isAbsent = data?.attendance_status === 'ABSENT';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Back to Home Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold font-heading text-[#464554] dark:text-slate-400 hover:text-[#131b2e] dark:hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal Home
        </Link>
        <span className="text-[11px] text-[#464554] dark:text-slate-400 font-medium font-heading">
          Public Attendance Verification Portal
        </span>
      </div>

      {/* Main Verification Card */}
      {loading ? (
        <Card className="p-8 bg-white dark:bg-[#111726] border-slate-200 dark:border-slate-800 shadow-xs">
          <LoadingState variant="page" message="Verifying attendance record against authoritative institutional ledger..." />
        </Card>
      ) : data?.valid ? (
        /* VALID PROOF STATE */
        <Card className="overflow-hidden bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 shadow-lg rounded-3xl">
          {/* Green Verified Header */}
          <div className="bg-gradient-to-r from-[#006c49] to-[#00885d] p-6 sm:p-7 text-white space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-full bg-white/20">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </span>
              <span className="text-xs font-bold font-heading uppercase tracking-widest text-emerald-100">
                Institutional Verification
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white">
              Attendance Proof Verified
            </h1>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              This attendance record has been validated against the official institutional database and is confirmed authentic.
            </p>
          </div>

          {/* Verified Body */}
          <div className="p-6 sm:p-7 space-y-6">
            {/* Status & Proof ID Strip */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#171f33] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold font-heading uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Public Proof ID
                </span>
                <span className="font-mono text-base font-extrabold text-[#4648d4] dark:text-[#c0c1ff]">
                  {data.public_id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={isLate ? 'warning' : isAbsent ? 'error' : 'tertiary'}
                  withDot
                  className="text-xs px-2.5 py-1 font-bold font-heading"
                >
                  {data.status_label || data.attendance_status}
                </Badge>
              </div>
            </div>

            {/* Student Details Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold font-heading text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <User className="w-3.5 h-3.5 text-[#4648d4] dark:text-indigo-400" />
                Verified Student Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#171f33] border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-heading uppercase block">
                    Student Name
                  </span>
                  <span className="font-bold text-[#131b2e] dark:text-white font-heading text-sm mt-0.5 block">
                    {data.student_name}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#171f33] border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-heading uppercase block">
                    Roll Number
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                    {data.roll_number}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#171f33] border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-heading uppercase block">
                    Class / Batch
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {data.class_name}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#171f33] border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-heading uppercase block">
                    Department
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {data.department}
                  </span>
                </div>
              </div>
            </div>

            {/* Session Details Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold font-heading text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#4648d4] dark:text-indigo-400" />
                Lecture &amp; Attendance Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#171f33] border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-heading uppercase block">
                    Course / Subject
                  </span>
                  <span className="font-bold text-[#131b2e] dark:text-white font-heading text-sm mt-0.5 block">
                    {data.subject_name}
                  </span>
                  <span className="text-[11px] font-mono text-[#4648d4] dark:text-indigo-400 font-semibold">
                    Code: {data.subject_code}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#171f33] border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#464554] dark:text-slate-400">Session Date:</span>
                    <span className="font-semibold text-[#131b2e] dark:text-slate-200">{data.session_date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#464554] dark:text-slate-400">Marked At:</span>
                    <span className="font-mono font-semibold text-[#131b2e] dark:text-slate-200">
                      {data.attendance_marked_at
                        ? new Date(data.attendance_marked_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#464554] dark:text-slate-400">Status:</span>
                    <span className="font-bold text-[#131b2e] dark:text-white">{data.status_label || data.attendance_status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Institution Note */}
            <div className="p-3.5 rounded-2xl bg-[#eaedff]/60 dark:bg-[#171f33]/60 border border-indigo-100 dark:border-indigo-950 text-xs text-[#464554] dark:text-slate-300 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#4648d4] dark:text-indigo-400 flex-shrink-0" />
              <span>
                Verified on <strong>{new Date(data.verified_at).toUTCString()}</strong>. Issued by{' '}
                <strong>{data.college_name || 'Lumina Academic Institution'}</strong>.
              </span>
            </div>
          </div>
        </Card>
      ) : (
        /* INVALID PROOF STATE */
        <Card className="overflow-hidden bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 shadow-lg rounded-3xl">
          <div className="bg-gradient-to-r from-rose-600 to-red-700 p-6 sm:p-7 text-white space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-full bg-white/20">
                <XCircle className="w-5 h-5 text-white" />
              </span>
              <span className="text-xs font-bold font-heading uppercase tracking-widest text-rose-100">
                Verification Failed
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white">
              Attendance Proof Not Valid
            </h1>
            <p className="text-xs text-rose-100/90 leading-relaxed">
              The provided attendance proof identifier could not be verified. It may be invalid, misspelled, expired, or non-existent in our records.
            </p>
          </div>

          <div className="p-6 sm:p-7 space-y-5 text-xs text-[#464554] dark:text-slate-300">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300 space-y-1">
              <span className="font-bold font-heading block">Queried Proof Code:</span>
              <span className="font-mono text-sm font-bold text-rose-700 dark:text-rose-400">{searchCode || '—'}</span>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 pt-1">
                Checked at: {new Date().toUTCString()}
              </p>
            </div>

            {/* Manual Verification Form */}
            <form onSubmit={handleManualSearch} className="space-y-3 pt-2">
              <label className="block text-xs font-bold font-heading text-[#131b2e] dark:text-slate-300">
                Try searching with another Attendance Proof Code:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. ATT-2026-F98AK2L4M8NP"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="flex-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 font-mono text-[#131b2e] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4]"
                />
                <Button type="submit" variant="primary" size="sm" leftIcon={<Search className="w-3.5 h-3.5" />}>
                  Verify
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
};
