import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Clock,
  ArrowLeft,
  XCircle,
  RefreshCw,
  Search,
  Lock,
  FileText,
  History,
  CheckCircle2,
  RotateCw,
  UserX,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AttendanceSessionAuditHistoryModal } from '../components/AttendanceSessionAuditHistoryModal';
import { AttendanceSession, LiveAttendanceSessionData } from '../types';
import {
  apiGetTeacherSessionDetails,
  apiGetTeacherLiveSessionData,
  apiEndAttendanceSession,
  apiUpdateLateAttendanceSettings,
  apiFinalizeTeacherSession,
} from '../services/api';

export const TeacherAttendanceSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [sessionData, setSessionData] = useState<LiveAttendanceSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [, setPollError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isExpiredOrEnded, setIsExpiredOrEnded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const [ending, setEnding] = useState(false);

  // Session Finalization & Audit State
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeReason, setFinalizeReason] = useState('');
  const [finalizing, setFinalizing] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Late Threshold Management State
  const [savingLateThreshold, setSavingLateThreshold] = useState(false);
  const [lateThresholdSuccess, setLateThresholdSuccess] = useState<string | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Derive QR Scan URL from configured VITE_APP_URL or current window origin
  const appBaseUrl =
    (import.meta.env.VITE_APP_URL ? import.meta.env.VITE_APP_URL.trim().replace(/\/+$/, '') : '') ||
    window.location.origin;

  const qrScanUrl = session?.session_token
    ? `${appBaseUrl}/attendance/scan?token=${encodeURIComponent(session.session_token)}`
    : '';

  // Core data fetching function (for periodic live telemetry polling)
  const fetchLiveData = useCallback(
    async (isManualRefresh = false) => {
      if (!sessionId) return;
      if (isManualRefresh) setIsRefreshing(true);

      try {
        const res = await apiGetTeacherLiveSessionData(sessionId);
        if (res.data) {
          setSessionData(res.data);
          setPollError(null);

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
        const msg = err instanceof Error ? err.message : 'Live attendance updates temporarily unavailable';
        setPollError(msg);
      } finally {
        if (isManualRefresh) setIsRefreshing(false);
      }
    },
    [sessionId]
  );

  // Initial Load
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      if (!sessionId) return;
      setLoading(true);
      setInitialError(null);
      try {
        const sessionRes = await apiGetTeacherSessionDetails(sessionId);
        if (!sessionRes.data) {
          throw new Error('Attendance session not found.');
        }

        if (isMounted) {
          setSession(sessionRes.data);
          const expiryTime = new Date(sessionRes.data.expires_at).getTime();
          const now = Date.now();
          const diffSecs = Math.max(0, Math.floor((expiryTime - now) / 1000));
          setSecondsRemaining(diffSecs);
          if (!sessionRes.data.is_active || diffSecs <= 0 || sessionRes.data.is_expired) {
            setIsExpiredOrEnded(true);
          } else {
            setIsExpiredOrEnded(false);
          }
        }

        try {
          const liveRes = await apiGetTeacherLiveSessionData(sessionId);
          if (liveRes.data && isMounted) {
            setSessionData(liveRes.data);
          }
        } catch {
          // Poll will handle retry
        }
      } catch (err: unknown) {
        if (isMounted) {
          setInitialError(err instanceof Error ? err.message : 'Unable to load attendance session');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // Polling loop every 3.5 seconds
  useEffect(() => {
    if (loading || initialError || !sessionId) return;

    pollTimerRef.current = setInterval(() => {
      fetchLiveData(false);
    }, 3500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loading, initialError, sessionId, fetchLiveData]);

  // Local second-by-second countdown ticker
  useEffect(() => {
    if (secondsRemaining <= 0) {
      setIsExpiredOrEnded(true);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsExpiredOrEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const handleEndSession = async () => {
    if (!sessionId) return;
    setEnding(true);
    try {
      await apiEndAttendanceSession(sessionId);
      setShowEndModal(false);
      setIsExpiredOrEnded(true);
      fetchLiveData(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to end attendance session');
    } finally {
      setEnding(false);
    }
  };

  const handleFinalizeSession = async () => {
    if (!sessionId) return;
    setFinalizing(true);
    try {
      const res = await apiFinalizeTeacherSession(sessionId, {
        reason: finalizeReason.trim() || undefined,
      });
      if (res.data) {
        setSession((prev) => (prev ? { ...prev, finalization_status: 'FINALIZED', is_active: false } : null));
        setSessionData((prev) => (prev ? { ...prev, finalization_status: 'FINALIZED', is_active: false } : null));
      }
      setShowFinalizeModal(false);
      setIsExpiredOrEnded(true);
      fetchLiveData(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to finalize attendance session');
    } finally {
      setFinalizing(false);
    }
  };

  const handleSaveLateThreshold = async (newThreshold: number) => {
    if (!sessionId) return;
    setSavingLateThreshold(true);
    setLateThresholdSuccess(null);
    try {
      await apiUpdateLateAttendanceSettings(sessionId, {
        late_threshold_minutes: newThreshold,
      });
      setLateThresholdSuccess(`Late attendance threshold set to ${newThreshold} minutes.`);
      fetchLiveData(true);
      setTimeout(() => setLateThresholdSuccess(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update late threshold');
    } finally {
      setSavingLateThreshold(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isFinalized = session?.finalization_status === 'FINALIZED' || sessionData?.finalization_status === 'FINALIZED';
  const isLive = !isFinalized && session?.is_active && !isExpiredOrEnded;
  const presentCount = sessionData?.present_count ?? session?.present_count ?? 0;
  const lateCount = sessionData?.late_count ?? session?.late_count ?? 0;
  const totalStudents = sessionData?.total_students ?? session?.total_students ?? 0;
  const attendedCount = presentCount + lateCount;
  const absentCount =
    sessionData?.absent_count ?? session?.absent_count ?? Math.max(0, totalStudents - attendedCount);
  const studentsList = sessionData?.students ?? [];

  // Filter students list
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentsList;
    const q = searchQuery.toLowerCase();
    return studentsList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
    );
  }, [studentsList, searchQuery]);

  const currentLateThreshold =
    sessionData?.late_threshold_minutes ?? session?.late_threshold_minutes ?? 10;
  const sessionStartedTime = session ? new Date(session.started_at).getTime() : Date.now();
  const lateCutoffTime = sessionStartedTime + currentLateThreshold * 60 * 1000;
  const currentTime = Date.now();
  const isLateWindowActive = currentTime > lateCutoffTime;
  const onTimeRemainingSecs = Math.max(0, Math.floor((lateCutoffTime - currentTime) / 1000));

  // Progress ring percentage
  const progressRatio = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (progressRatio / 100) * circumference;

  if (loading) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <LoadingSpinner size="lg" label="Initializing live dynamic QR attendance engine..." />
      </div>
    );
  }

  if (initialError || !session) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card className="p-6 text-center space-y-4 bg-white dark:bg-[#111726] border-rose-200">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-rose-900 font-heading">Unable to Load Attendance Session</h3>
          <p className="text-xs text-slate-500">{initialError || 'Session not found'}</p>
          <Link to="/teacher">
            <Button size="sm" variant="primary">Teacher Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-0">
      {/* Header */}
      <PageHeader
        title="Live QR Attendance Session"
        description={`Display this dynamic QR code on screen. Students scan with their camera to log real-time attendance for ${session.class_name}.`}
        badge={
          isFinalized ? (
            <Badge variant="neutral" className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300">
              🔒 ATTENDANCE FINALIZED
            </Badge>
          ) : isLive ? (
            <Badge variant="tertiary" withDot>
              ● ATTENDANCE ACTIVE
            </Badge>
          ) : (
            <Badge variant="warning">
              ⏹ SESSION CONCLUDED
            </Badge>
          )
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/teacher/attendance/history">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Sessions
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuditModal(true)}
              leftIcon={<History className="w-3.5 h-3.5 text-[#4648d4]" />}
            >
              Session Audit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLiveData(true)}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            {isLive && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowEndModal(true)}
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
              >
                End Attendance
              </Button>
            )}
            {!isFinalized && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFinalizeModal(true)}
                leftIcon={<Lock className="w-3.5 h-3.5 text-purple-600" />}
                className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950"
              >
                Finalize Session
              </Button>
            )}
            <Link to={`/teacher/attendance/${session.id}/records`}>
              <Button variant="primary" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />}>
                Roster Records
              </Button>
            </Link>
          </div>
        }
      />

      {/* Main Grid: QR Viewport + Live Stats & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Dynamic QR Area matching Stitch Mobile #f7f451e5 (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5 sm:p-7 flex flex-col items-center justify-center text-center space-y-4 bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 shadow-md relative overflow-hidden">
            {/* Top Info Banner */}
            <div className="w-full flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-left">
              <div>
                <span className="text-[10px] uppercase font-bold font-heading tracking-wider text-slate-400">Course Subject</span>
                <h3 className="text-base font-bold text-[#131b2e] dark:text-white font-heading">{session.subject_name}</h3>
                <p className="text-xs font-mono font-semibold text-[#4648d4] dark:text-indigo-400">{session.subject_code}</p>
              </div>
              {/* Countdown Pill Badge matching Stitch Mobile #f7f451e5 */}
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700">
                <RotateCw className="w-3.5 h-3.5 text-[#4648d4] animate-spin" />
                <span className="font-mono text-xs font-bold text-[#4648d4] dark:text-indigo-300">
                  {isLive ? formatTime(secondsRemaining) : '00:00'}
                </span>
              </div>
            </div>

            {/* High-Contrast QR Viewport with Pulse Border */}
            <div className="relative p-5 rounded-3xl bg-slate-50 dark:bg-[#171f33] border-2 border-indigo-200/80 dark:border-indigo-800/80 shadow-lg flex flex-col items-center justify-center w-full max-w-[320px] transition-all">
              <div
                className={`p-3 rounded-2xl bg-white shadow-xs transition duration-300 ${
                  !isLive ? 'opacity-20 blur-[2px] grayscale' : ''
                }`}
              >
                <QRCodeSVG
                  value={qrScanUrl}
                  size={240}
                  level="H"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#0F172A"
                />
              </div>

              {/* Expired / Ended Overlay */}
              {!isLive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-5 bg-[#090d16]/90 backdrop-blur-xs rounded-3xl text-white space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold font-heading">
                      {!session.is_active ? 'Attendance Session Concluded' : 'QR Code Expired'}
                    </h4>
                    <p className="text-xs text-slate-300 max-w-xs text-center mt-1">
                      Student attendance recording is closed for this session token.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-[#464554] dark:text-slate-400 max-w-xs">
              Ask students to scan this code with their mobile device camera. It refreshes automatically.
            </p>

            {/* End Session Button if live */}
            {isLive && (
              <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => setShowEndModal(true)}
                  leftIcon={<XCircle className="w-4 h-4" />}
                  className="w-full font-bold"
                >
                  End Session
                </Button>
              </div>
            )}
          </Card>

          {/* Late Attendance Configuration Card */}
          <Card className="p-4 sm:p-5 bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold font-heading text-[#131b2e] dark:text-white uppercase tracking-wider">
                  Late Window Threshold
                </h4>
              </div>
              {isLive && (
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                  {isLateWindowActive ? 'LATE ACTIVE' : `ON-TIME (${formatTime(onTimeRemainingSecs)})`}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[0, 5, 10, 15, 30].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSaveLateThreshold(val)}
                  disabled={savingLateThreshold}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold font-heading transition cursor-pointer ${
                    currentLateThreshold === val
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {val === 0 ? 'Strict (0m)' : `${val} min`}
                </button>
              ))}
            </div>

            {lateThresholdSuccess && (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl">
                {lateThresholdSuccess}
              </p>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Live Stats Grid & Live Feed matching Stitch Mobile #f7f451e5 (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Present Circular Progress Card */}
            <Card className="p-4 bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col items-center justify-center relative col-span-2 sm:col-span-1">
              <span className="text-xs font-bold font-heading text-slate-400 absolute top-3.5 left-3.5">
                Present
              </span>
              <div className="relative w-24 h-24 mt-4 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-slate-100 dark:text-slate-800 stroke-current"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    strokeWidth="8"
                  />
                  <circle
                    className="text-[#4648d4] stroke-current transition-all duration-500"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-heading text-2xl font-black text-[#131b2e] dark:text-white">
                    {presentCount}
                  </span>
                  <span className="text-[11px] text-slate-400 font-heading">/ {totalStudents}</span>
                </div>
              </div>
            </Card>

            {/* Mini Stats: Late & Absent */}
            <div className="flex flex-col gap-2.5 col-span-2 sm:col-span-1">
              {/* Late Card */}
              <Card className="p-3.5 bg-amber-500/10 border-amber-500/20 rounded-xl flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                  <Clock className="w-4 h-4" />
                  <span className="font-heading font-bold text-xs">Late</span>
                </div>
                <span className="font-heading text-2xl font-black text-amber-800 dark:text-amber-200 mt-1">
                  {lateCount}
                </span>
              </Card>

              {/* Absent Card */}
              <Card className="p-3.5 bg-rose-500/10 border-rose-500/20 rounded-xl flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                  <UserX className="w-4 h-4" />
                  <span className="font-heading font-bold text-xs">Absent</span>
                </div>
                <span className="font-heading text-2xl font-black text-rose-800 dark:text-rose-200 mt-1">
                  {absentCount}
                </span>
              </Card>
            </div>
          </div>

          {/* Live Feed List matching Stitch Mobile #f7f451e5 */}
          <Card className="p-4 bg-white dark:bg-[#111726] border-slate-200/90 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-heading font-bold text-xs text-[#131b2e] dark:text-white uppercase tracking-wider">
                Live Feed
              </h3>
              <span className="text-[10px] font-bold font-heading text-[#4648d4] dark:text-indigo-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4648d4] animate-ping" />
                Live Telemetry
              </span>
            </div>

            {/* Search Input for student check-ins */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search checked-in student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {/* Attendee Items */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {filteredStudents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  {isLive ? 'Waiting for first student scan...' : 'No attendance recorded.'}
                </p>
              ) : (
                filteredStudents.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 dark:bg-[#171f33]/80 hover:bg-slate-100 dark:hover:bg-[#1e2840] transition text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#4648d4]/15 text-[#4648d4] dark:text-indigo-300 font-bold font-heading flex items-center justify-center text-[10px]">
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#131b2e] dark:text-white font-heading">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{s.roll_number}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.status === 'LATE'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {s.status}
                      </span>
                      {s.status === 'LATE' ? (
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Audit History Modal */}
      {showAuditModal && (
        <AttendanceSessionAuditHistoryModal
          isOpen={showAuditModal}
          onClose={() => setShowAuditModal(false)}
          sessionId={session.id}
          subjectName={session.subject_name}
          classNameStr={session.class_name}
        />
      )}

      {/* End Session Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#111726] border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Conclude QR Session?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ending this session will immediately invalidate the active QR token and freeze check-ins.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowEndModal(false)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleEndSession} isLoading={ending}>Confirm End</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Finalize Session Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#111726] border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-heading text-lg font-bold text-purple-900 dark:text-purple-300">Finalize Attendance Session</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Finalizing will lock all attendance records permanently for academic auditing.
            </p>
            <input
              type="text"
              placeholder="Optional reason for audit log..."
              value={finalizeReason}
              onChange={(e) => setFinalizeReason(e.target.value)}
              className="w-full p-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowFinalizeModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleFinalizeSession} isLoading={finalizing} className="bg-purple-600 hover:bg-purple-700 text-white">
                Finalize
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
