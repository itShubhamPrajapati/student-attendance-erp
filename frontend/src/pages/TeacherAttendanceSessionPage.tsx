import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Clock,
  Users,
  AlertTriangle,
  ArrowLeft,
  XCircle,
  RefreshCw,
  Search,
  Lock,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { LiveAttendanceSessionData } from '../types';
import {
  apiGetTeacherLiveSessionData,
  apiEndAttendanceSession,
} from '../services/api';

export const TeacherAttendanceSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [sessionData, setSessionData] = useState<LiveAttendanceSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isExpiredOrEnded, setIsExpiredOrEnded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const [ending, setEnding] = useState(false);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Derive QR Scan URL from configured VITE_APP_URL or current window origin
  const appBaseUrl =
    (import.meta.env.VITE_APP_URL ? import.meta.env.VITE_APP_URL.trim().replace(/\/+$/, '') : '') ||
    window.location.origin;

  const qrScanUrl = sessionData
    ? `${appBaseUrl}/attendance/scan?token=${encodeURIComponent(sessionData.session_token)}`
    : '';

  // Core data fetching function (for initial load and periodic polling)
  const fetchLiveData = useCallback(
    async (isManualRefresh = false) => {
      if (!sessionId) return;
      if (isManualRefresh) setIsRefreshing(true);

      try {
        const res = await apiGetTeacherLiveSessionData(sessionId);
        if (res.data) {
          setSessionData(res.data);
          setLastUpdated(new Date());
          setPollError(null);

          // Calculate remaining seconds against server expiry
          const expiryTime = new Date(res.data.qr_expires_at).getTime();
          const now = Date.now();
          const diffSecs = Math.max(0, Math.floor((expiryTime - now) / 1000));
          setSecondsRemaining(diffSecs);

          if (!res.data.is_active || diffSecs <= 0 || res.data.is_expired) {
            setIsExpiredOrEnded(true);
          } else {
            setIsExpiredOrEnded(false);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unable to refresh live attendance';
        if (!sessionData) {
          setInitialError(msg);
        } else {
          // Non-blocking error during active session polling
          setPollError(msg);
        }
      } finally {
        setLoading(false);
        if (isManualRefresh) setIsRefreshing(false);
      }
    },
    [sessionId, sessionData]
  );

  // Initial Load
  useEffect(() => {
    fetchLiveData();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Visibility-Aware Polling Interval (every 3.5s while active)
  useEffect(() => {
    if (isExpiredOrEnded || !sessionData?.is_active) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    const startPolling = () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchLiveData();
        }
      }, 3500);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveData();
        startPolling();
      } else if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchLiveData, isExpiredOrEnded, sessionData?.is_active]);

  // Countdown timer 1-second ticker effect
  useEffect(() => {
    if (isExpiredOrEnded || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsExpiredOrEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isExpiredOrEnded, secondsRemaining]);

  // Handle Manual Session Termination
  const handleEndSession = async () => {
    if (!sessionId) return;
    setEnding(true);
    try {
      await apiEndAttendanceSession(sessionId);
      setShowEndModal(false);
      setIsExpiredOrEnded(true);
      await fetchLiveData(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to end attendance session');
    } finally {
      setEnding(false);
    }
  };

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filter present students list by search query
  const filteredStudents = useMemo(() => {
    if (!sessionData?.students) return [];
    if (!searchQuery.trim()) return sessionData.students;
    const q = searchQuery.toLowerCase();
    return sessionData.students.filter(
      (st) =>
        st.name.toLowerCase().includes(q) ||
        st.roll_number.toLowerCase().includes(q) ||
        st.email.toLowerCase().includes(q)
    );
  }, [sessionData?.students, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" label="Initializing live QR attendance session..." />
      </div>
    );
  }

  if (initialError || !sessionData) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4 text-center">
        <Card className="p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">Session Unavailable</h3>
            <p className="text-xs text-slate-500 mt-1">{initialError || 'Attendance session not found.'}</p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <Link to="/teacher/attendance/history">
              <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Sessions
              </Button>
            </Link>
            <Link to="/teacher">
              <Button size="sm" variant="primary">
                Teacher Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isLive = sessionData.is_active && !isExpiredOrEnded;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with Navigation & Live Badge */}
      <PageHeader
        title="Live QR Attendance Session"
        description={`Display this dynamic QR code on screen. Students scan with mobile camera to log real-time attendance for ${sessionData.class_name}.`}
        badge={
          isLive ? (
            <Badge variant="success" withDot>
              ● ATTENDANCE ACTIVE
            </Badge>
          ) : sessionData.is_expired || isExpiredOrEnded ? (
            <Badge variant="neutral">
              🔒 QR EXPIRED
            </Badge>
          ) : (
            <Badge variant="warning">
              ⏹ SESSION CONCLUDED
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/teacher/attendance/history">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Sessions
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLiveData(true)}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            {isLive ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowEndModal(true)}
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
              >
                End Attendance
              </Button>
            ) : (
              <Link to={`/teacher/attendance/${sessionData.session_id}/records`}>
                <Button variant="primary" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />}>
                  View Attendance Records
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / MAIN COLUMN: QR Code & Expiration Box (7 Cols) */}
        <Card className="lg:col-span-7 p-6 sm:p-7 flex flex-col items-center justify-center text-center space-y-5 bg-white border-slate-200/80 shadow-md">
          {/* Metadata Banner */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 text-left">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Course Subject</span>
              <h3 className="text-base font-bold text-slate-900 font-heading">{sessionData.subject_name}</h3>
              <p className="text-xs font-mono font-semibold text-indigo-600">{sessionData.subject_code}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Class Batch</span>
              <p className="text-xs font-bold text-slate-800">{sessionData.class_name}</p>
              <p className="text-[11px] text-slate-500 font-medium">
                Sem {sessionData.semester} &bull; Section {sessionData.section}
              </p>
            </div>
          </div>

          {/* Large QR Display Container */}
          <div className="relative p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-inner flex flex-col items-center justify-center w-full max-w-[340px]">
            <div
              className={`p-4 rounded-2xl bg-white shadow-xs transition duration-300 ${
                !isLive ? 'opacity-20 blur-[2px] grayscale' : ''
              }`}
            >
              <QRCodeSVG
                value={qrScanUrl}
                size={250}
                level="H"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#0F172A"
              />
            </div>

            {/* Expired / Ended Overlay */}
            {!isLive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-5 bg-slate-900/70 backdrop-blur-xs rounded-3xl text-white space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold font-heading">
                    {!sessionData.is_active ? 'Attendance Session Concluded' : 'QR Code Expired'}
                  </h4>
                  <p className="text-xs text-slate-300 max-w-xs text-center mt-1">
                    Student attendance recording is closed for this session token.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 w-full px-4">
                  <Link to={`/teacher/attendance/${sessionData.session_id}/records`} className="w-full">
                    <Button size="sm" variant="primary" className="w-full text-xs">
                      View Attendance Records
                    </Button>
                  </Link>
                  <Link to="/teacher" className="w-full">
                    <Button size="sm" variant="outline" className="w-full text-xs bg-white/10 hover:bg-white/20 border-white/20 text-white">
                      Start New Session
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* QR Countdown & Live Status Box */}
          <div className="w-full p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>QR Status:</span>
              <span className={isLive ? 'text-emerald-700 font-bold' : 'text-slate-500 font-semibold'}>
                {isLive ? '● ACTIVE' : !sessionData.is_active ? 'COMPLETED' : 'EXPIRED'}
              </span>
            </div>

            <div className="text-xs text-slate-600 font-medium">
              {isLive ? (
                <span>
                  QR expires in:{' '}
                  <strong
                    className={`font-mono text-sm ${
                      secondsRemaining < 60
                        ? 'text-rose-600 font-bold animate-pulse'
                        : secondsRemaining < 120
                        ? 'text-amber-600 font-bold'
                        : 'text-indigo-900 font-bold'
                    }`}
                  >
                    {formatTime(secondsRemaining)}
                  </strong>
                </span>
              ) : (
                <span className="text-slate-400 font-mono text-xs">00:00 (Check-ins Closed)</span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-md">
            Students must scan this QR code with their mobile device logged into the student portal.
          </p>

          {/* Bottom Session Action Controls */}
          {isLive && (
            <div className="w-full pt-2 border-t border-slate-100 flex justify-center">
              <Button
                variant="danger"
                size="md"
                onClick={() => setShowEndModal(true)}
                leftIcon={<XCircle className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                End Attendance Session Now
              </Button>
            </div>
          )}
        </Card>

        {/* RIGHT / SUMMARY COLUMN: Counters, Progress & Live Student Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Summary KPI & Progress Card */}
          <Card className="p-5 bg-white border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 font-heading">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Attendance Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isLive ? (
                  <Badge variant="success" withDot className="text-[10px]">
                    Live Polling
                  </Badge>
                ) : (
                  <Badge variant="neutral" className="text-[10px]">
                    Final Count
                  </Badge>
                )}
              </div>
            </div>

            {/* Attendance Big Number Metrics */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Students Present
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 font-heading">
                    {sessionData.present_count}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">
                    / {sessionData.total_students}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Attendance Rate
                </span>
                <span className="text-2xl font-extrabold text-indigo-600 font-heading font-mono">
                  {sessionData.attendance_percentage}%
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, sessionData.attendance_percentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>{sessionData.present_count} Marked Present</span>
                <span>{sessionData.absent_count} Pending / Absent</span>
              </div>
            </div>

            {/* Session Duration & Started Info */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Duration: {sessionData.duration_minutes} min</span>
              </div>
              <span className="font-mono text-slate-400">
                Started {new Date(sessionData.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </Card>

          {/* 2. Live Student Attendance List Card */}
          <Card className="p-0 overflow-hidden bg-white border-slate-200/80 shadow-xs">
            {/* Header with Search */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-heading">
                    Live Attendance ({sessionData.present_count})
                  </h4>
                  {isLive && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                {lastUpdated && (
                  <span className="text-[10px] font-mono text-slate-400">
                    Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Non-blocking Poll Error Notice */}
              {pollError && (
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-[11px] text-amber-800">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>Unable to refresh live feed</span>
                  </div>
                  <button
                    onClick={() => fetchLiveData(true)}
                    className="font-bold underline hover:text-amber-900"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition"
                />
              </div>
            </div>

            {/* List Stream (Sorted Newest First) */}
            <div className="p-3 max-h-80 overflow-y-auto divide-y divide-slate-100 space-y-1.5">
              {sessionData.students.length === 0 ? (
                <div className="py-10 text-center space-y-2 px-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 font-heading">No students checked in yet</h5>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                      Students will appear here automatically in real time when they scan the QR code.
                    </p>
                  </div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No present students match "{searchQuery}".
                </div>
              ) : (
                filteredStudents.map((st) => (
                  <div
                    key={st.student_id}
                    className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-50 transition flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-[11px]">
                        ✓
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 font-heading truncate max-w-[140px] sm:max-w-[180px]">
                          {st.name}
                        </p>
                        <span className="font-mono text-[10px] text-indigo-600 font-medium">
                          {st.roll_number}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/50">
                        PRESENT
                      </span>
                      <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                        {st.marked_at
                          ? new Date(st.marked_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal for Ending Session */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <Card className="max-w-md w-full p-6 space-y-4 bg-white shadow-2xl border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">End Attendance Session?</h3>
                <p className="text-xs text-slate-500">Conclude active QR check-ins</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to conclude attendance for <strong>{sessionData.subject_name}</strong> (
              {sessionData.class_name})? Once ended, students will no longer be able to scan the QR code.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Current Present Count:</span>
              <span className="font-bold text-slate-900">
                {sessionData.present_count} / {sessionData.total_students} ({sessionData.attendance_percentage}%)
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEndModal(false)}
                disabled={ending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleEndSession}
                isLoading={ending}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Yes, End Session
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
