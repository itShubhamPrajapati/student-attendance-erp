import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  XCircle,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AttendanceSession, SessionAttendanceDetails } from '../types';
import {
  apiGetTeacherSessionDetails,
  apiEndAttendanceSession,
  apiGetSessionAttendanceRecords,
} from '../services/api';

export const TeacherAttendanceSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [details, setDetails] = useState<SessionAttendanceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isExpiredOrEnded, setIsExpiredOrEnded] = useState(false);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Derive QR Scan URL from configured VITE_APP_URL or current window origin
  const appBaseUrl =
    (import.meta.env.VITE_APP_URL ? import.meta.env.VITE_APP_URL.trim().replace(/\/+$/, '') : '') ||
    window.location.origin;

  const qrScanUrl = session
    ? `${appBaseUrl}/attendance/scan?token=${encodeURIComponent(session.session_token)}`
    : '';

  // Fetch session details and attendees
  const fetchSessionData = useCallback(async () => {
    if (!sessionId) return;
    try {
      const [sessionRes, detailsRes] = await Promise.all([
        apiGetTeacherSessionDetails(sessionId),
        apiGetSessionAttendanceRecords(sessionId).catch(() => null),
      ]);

      if (sessionRes.data) {
        setSession(sessionRes.data);
        if (detailsRes?.data) {
          setDetails(detailsRes.data);
        }

        // Calculate remaining seconds against server expiry
        const expiryTime = new Date(sessionRes.data.expires_at).getTime();
        const now = Date.now();
        const diffSecs = Math.max(0, Math.floor((expiryTime - now) / 1000));
        setSecondsRemaining(diffSecs);

        if (!sessionRes.data.is_active || diffSecs <= 0) {
          setIsExpiredOrEnded(true);
        } else {
          setIsExpiredOrEnded(false);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load attendance session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionData();

    // Auto-refresh attendees feed every 3.5 seconds while session is active
    pollTimerRef.current = setInterval(() => {
      if (!isExpiredOrEnded) {
        fetchSessionData();
      }
    }, 3500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchSessionData, isExpiredOrEnded]);

  // Countdown timer effect
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
      setIsExpiredOrEnded(true);
      await fetchSessionData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to end session');
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

  const presentRecords = details?.records.filter((r) => r.status === 'PRESENT') || [];

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" label="Initializing live QR attendance session..." />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4 text-center">
        <Card className="p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">Session Unavailable</h3>
            <p className="text-xs text-slate-500 mt-1">{error || 'Attendance session not found.'}</p>
          </div>
          <div className="pt-2">
            <Link to="/teacher">
              <Button size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to Teacher Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Navigation */}
      <PageHeader
        title="Live QR Attendance Session"
        description="Display this dynamic QR code on a screen or projector. Students scan the code to verify attendance in real time."
        badge={
          <Badge
            variant={!session.is_active || isExpiredOrEnded ? 'neutral' : 'warning'}
            withDot={session.is_active && !isExpiredOrEnded}
          >
            {!session.is_active
              ? 'Session Ended'
              : isExpiredOrEnded
              ? 'Session Expired'
              : 'Live Check-in Active'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/teacher">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Dashboard
              </Button>
            </Link>
            <Link to={`/teacher/attendance/${session.id}/records`}>
              <Button size="sm" variant="outline" leftIcon={<Users className="w-3.5 h-3.5" />}>
                View Full Roster
              </Button>
            </Link>
          </div>
        }
      />

      {/* Main QR Display & Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: QR Code Card (7 Cols) */}
        <Card className="lg:col-span-7 p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-5 bg-white border-slate-200/80 shadow-md">
          {/* Metadata Banner */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 text-left">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Course Subject</span>
              <h3 className="text-base font-bold text-slate-900 font-heading">{session.subject_name}</h3>
              <p className="text-xs font-mono font-semibold text-indigo-600">{session.subject_code}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Class Batch</span>
              <p className="text-xs font-bold text-slate-800">{session.class_name}</p>
              <p className="text-[11px] text-slate-500 font-medium">
                Sem {session.semester} &bull; Section {session.section}
              </p>
            </div>
          </div>

          {/* Large QR Display */}
          <div className="relative p-5 rounded-3xl bg-slate-50 border border-slate-200/70 shadow-inner flex flex-col items-center justify-center">
            <div
              className={`p-4 rounded-2xl bg-white shadow-xs transition duration-300 ${
                !session.is_active || isExpiredOrEnded ? 'opacity-30 blur-[2px] grayscale' : ''
              }`}
            >
              <QRCodeSVG
                value={qrScanUrl}
                size={260}
                level="H"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#0F172A"
              />
            </div>

            {/* Expired / Ended Overlay */}
            {(!session.is_active || isExpiredOrEnded) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs rounded-3xl text-white space-y-2">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
                <h4 className="text-base font-bold font-heading">
                  {!session.is_active ? 'Attendance Session Ended' : 'Attendance Session Expired'}
                </h4>
                <p className="text-xs text-slate-200 max-w-xs text-center">
                  Students can no longer submit attendance for this QR code.
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 max-w-md">
            Students must log into their student portal and point their mobile camera at this QR code to log attendance.
          </p>

          {/* Session Actions */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 w-full border-t border-slate-100">
            {session.is_active && !isExpiredOrEnded ? (
              <Button
                variant="danger"
                size="md"
                onClick={handleEndSession}
                isLoading={ending}
                leftIcon={<XCircle className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                End Attendance Session Now
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/teacher">
                  <Button size="sm" variant="primary" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                    Start Another Session
                  </Button>
                </Link>
                <Link to={`/teacher/attendance/${session.id}/records`}>
                  <Button size="sm" variant="outline">
                    View Attendance Report
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Right: Live Timer, Attendee Counter & Real-Time Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Timer Card */}
          <Card
            className={`p-5 text-center shadow-xs border transition-all ${
              !session.is_active || isExpiredOrEnded
                ? 'bg-slate-50 border-slate-200'
                : secondsRemaining < 60
                ? 'bg-rose-50/70 border-rose-200 animate-pulse'
                : secondsRemaining < 120
                ? 'bg-amber-50/70 border-amber-200'
                : 'bg-indigo-50/60 border-indigo-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              <Clock className="w-4 h-4" />
              <span>Time Remaining</span>
            </div>
            <div
              className={`font-mono text-4xl font-extrabold tracking-tight font-heading ${
                !session.is_active || isExpiredOrEnded
                  ? 'text-slate-400'
                  : secondsRemaining < 60
                  ? 'text-rose-600'
                  : 'text-indigo-900'
              }`}
            >
              {!session.is_active || isExpiredOrEnded ? '00:00' : formatTime(secondsRemaining)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {!session.is_active
                ? 'Attendance was manually concluded'
                : isExpiredOrEnded
                ? 'Session time limit elapsed'
                : `Started at ${new Date(session.started_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`}
            </p>
          </Card>

          {/* 2. Attendance Counter Metric Card */}
          <Card className="p-5 bg-white border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 font-heading">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Attendance Count</span>
              </div>
              <Badge variant="success" withDot>
                Live Feed
              </Badge>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-bold text-slate-900 font-heading">
                  {details?.present_count ?? session.present_count}
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  {' '}
                  / {details?.total_students ?? session.total_students} Students
                </span>
              </div>
              <span className="text-lg font-bold text-indigo-600 font-mono">
                {details?.percentage ?? session.percentage}%
              </span>
            </div>

            {/* Simple Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, details?.percentage ?? session.percentage)}%` }}
              />
            </div>
          </Card>

          {/* 3. Live Check-in Stream Feed */}
          <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-800 font-heading">Recent Check-ins</h4>
              <span className="text-[10px] font-mono text-slate-400">Auto-refreshing</span>
            </div>

            {presentRecords.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                Awaiting student QR scans...
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {presentRecords.slice(0, 10).map((rec) => (
                  <div
                    key={rec.student_id}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs animate-in fade-in"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-900 font-heading truncate max-w-[130px]">
                          {rec.name}
                        </p>
                        <span className="font-mono text-[10px] text-indigo-600">{rec.roll_number}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {rec.marked_at
                        ? new Date(rec.marked_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : 'Present'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
