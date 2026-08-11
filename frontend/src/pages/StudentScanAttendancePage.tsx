import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Zap,
  Clock,
  WifiOff,
} from 'lucide-react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MarkAttendanceResponse } from '../types';
import { apiMarkAttendance } from '../services/api';

interface ErrorStateDetails {
  title: string;
  message: string;
  type: 'duplicate' | 'expired' | 'ended' | 'wrong_class' | 'invalid' | 'network' | 'generic';
}

export const StudentScanAttendancePage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [successData, setSuccessData] = useState<MarkAttendanceResponse | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorStateDetails | null>(null);
  const [manualToken, setManualToken] = useState('');

  const qrReaderRef = useRef<Html5Qrcode | null>(null);
  const scannedProcessedRef = useRef(false);

  // Check URL query token if student clicked/scanned from mobile link
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken && !scannedProcessedRef.current) {
      scannedProcessedRef.current = true;
      submitToken(urlToken);
    }
  }, [searchParams]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = async () => {
    try {
      if (qrReaderRef.current && qrReaderRef.current.isScanning) {
        await qrReaderRef.current.stop();
        await qrReaderRef.current.clear();
      }
    } catch {
      // Ignored cleanup error
    } finally {
      setIsScanning(false);
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    setErrorDetails(null);
    setSuccessData(null);
    scannedProcessedRef.current = false;

    try {
      if (!qrReaderRef.current) {
        qrReaderRef.current = new Html5Qrcode('qr-reader');
      }

      setIsScanning(true);

      const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };

      await qrReaderRef.current.start(
        { facingMode: 'environment' },
        qrConfig,
        (decodedText) => {
          // Extract token from full URL or use raw string
          if (!scannedProcessedRef.current) {
            scannedProcessedRef.current = true;
            stopCamera();

            let tokenToSubmit = decodedText;
            try {
              if (decodedText.includes('token=')) {
                const url = new URL(decodedText);
                tokenToSubmit = url.searchParams.get('token') || decodedText;
              }
            } catch {
              // Raw token
            }

            submitToken(tokenToSubmit);
          }
        },
        () => {
          // Scanning in progress
        }
      );
    } catch (err: unknown) {
      setIsScanning(false);
      const msg = err instanceof Error ? err.message : 'Camera permission or device error';
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
        setCameraError('Camera permission was denied. Please allow camera access in browser settings to scan attendance.');
      } else {
        setCameraError('Unable to open camera. You can also paste the session token below to verify attendance.');
      }
    }
  };

  // Submit session token to backend
  const submitToken = async (token: string) => {
    const clean = token.trim();
    if (!clean || verifying) return;

    setVerifying(true);
    setErrorDetails(null);
    setSuccessData(null);

    try {
      const res = await apiMarkAttendance(clean);
      setSuccessData(res.data);
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : 'Failed to verify attendance';
      const lower = rawMsg.toLowerCase();

      if (lower.includes('already been marked') || lower.includes('duplicate')) {
        setErrorDetails({
          type: 'duplicate',
          title: 'Attendance Already Marked',
          message: 'Your attendance for this lecture has already been recorded.',
        });
      } else if (lower.includes('expired')) {
        setErrorDetails({
          type: 'expired',
          title: 'QR Code Expired',
          message: 'This attendance session has expired and is no longer accepting scans.',
        });
      } else if (lower.includes('ended')) {
        setErrorDetails({
          type: 'ended',
          title: 'Attendance Session Ended',
          message: 'This attendance session has been ended by the faculty teacher.',
        });
      } else if (lower.includes('not enrolled') || lower.includes('not assigned') || lower.includes('wrong class')) {
        setErrorDetails({
          type: 'wrong_class',
          title: 'Class Enrollment Mismatch',
          message: 'You are not enrolled in the academic class for this session.',
        });
      } else if (lower.includes('invalid') || lower.includes('not found')) {
        setErrorDetails({
          type: 'invalid',
          title: 'Invalid QR Code',
          message: 'The scanned QR code or session token is invalid or unrecognized.',
        });
      } else if (
        lower.includes('unable to connect') ||
        lower.includes('network') ||
        lower.includes('failed to fetch') ||
        lower.includes('networkerror')
      ) {
        setErrorDetails({
          type: 'network',
          title: 'Connection Error',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
        });
      } else {
        setErrorDetails({
          type: 'generic',
          title: 'Attendance Not Recorded',
          message: rawMsg || 'Unable to record attendance. Please try again.',
        });
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto px-2 sm:px-0">
      <PageHeader
        title="Scan Attendance QR"
        description="Point your device camera at the attendance QR code displayed on your faculty teacher's screen."
        badge={
          <Badge variant="success" withDot>
            Live Camera Ready
          </Badge>
        }
        actions={
          <Link to="/student">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Dashboard
            </Button>
          </Link>
        }
      />

      {/* Success Celebration Card (Supports On-Time PRESENT and LATE Attendance) */}
      {successData && (
        <Card
          className={`p-6 sm:p-8 text-center space-y-4 shadow-sm animate-in zoom-in-95 ${
            successData.status === 'LATE'
              ? 'bg-amber-50/70 border-amber-300/80'
              : 'bg-emerald-50/60 border-emerald-200'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-md ${
              successData.status === 'LATE'
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {successData.status === 'LATE' ? (
              <Clock className="w-9 h-9" />
            ) : (
              <CheckCircle2 className="w-9 h-9" />
            )}
          </div>

          <div>
            {successData.status === 'LATE' ? (
              <>
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full mb-2 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  Recorded (Late Attendance)
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 font-heading">
                  Attendance Recorded (Late)
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Your scan was received after the session's on-time cutoff. Per academic guidelines, <strong className="text-slate-800">late attendance still counts as ATTENDED</strong> toward your attendance requirement.
                </p>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full mb-2 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified On-Time
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 font-heading">
                  Attendance Marked Successfully!
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Your on-time attendance has been verified and recorded for today's lecture session.
                </p>
              </>
            )}
          </div>

          <div
            className={`p-4 rounded-2xl bg-white text-left space-y-2 text-xs border ${
              successData.status === 'LATE' ? 'border-amber-200' : 'border-emerald-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Course Subject:</span>
              <span className="font-bold text-slate-900 font-heading">{successData.subject_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Classroom Batch:</span>
              <span className="font-medium text-slate-800">{successData.class_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Recorded Status:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  successData.status === 'LATE'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {successData.status === 'LATE' ? 'LATE (Attended)' : 'PRESENT (On-Time)'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-mono text-[11px]">
              <span className="text-slate-500">Recorded At:</span>
              <span
                className={`font-semibold ${
                  successData.status === 'LATE' ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {new Date(successData.marked_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to="/student" className="w-full sm:w-auto">
              <Button size="md" variant="primary" className="w-full sm:w-auto" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Dashboard
              </Button>
            </Link>
            <Button
              size="md"
              variant="outline"
              onClick={() => {
                setSuccessData(null);
                startCamera();
              }}
            >
              Scan Another Session
            </Button>
          </div>
        </Card>
      )}

      {/* Categorized Error Card */}
      {errorDetails && !verifying && (
        <Card
          className={`p-6 text-center space-y-3 shadow-sm animate-in fade-in ${
            errorDetails.type === 'duplicate'
              ? 'bg-amber-50/60 border-amber-200'
              : errorDetails.type === 'expired'
              ? 'bg-amber-50/60 border-amber-200'
              : 'bg-rose-50/60 border-rose-200'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
              errorDetails.type === 'duplicate' || errorDetails.type === 'expired'
                ? 'bg-amber-100 text-amber-700'
                : errorDetails.type === 'network'
                ? 'bg-rose-100 text-rose-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {errorDetails.type === 'expired' ? (
              <Clock className="w-6 h-6" />
            ) : errorDetails.type === 'network' ? (
              <WifiOff className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3
              className={`text-sm font-bold font-heading ${
                errorDetails.type === 'duplicate' || errorDetails.type === 'expired'
                  ? 'text-amber-900'
                  : 'text-rose-900'
              }`}
            >
              {errorDetails.title}
            </h3>
            <p
              className={`text-xs mt-1 ${
                errorDetails.type === 'duplicate' || errorDetails.type === 'expired'
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {errorDetails.message}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setErrorDetails(null);
                startCamera();
              }}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Try Again
            </Button>
            <Link to="/student">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Verifying Loader */}
      {verifying && (
        <Card className="p-8 text-center space-y-3 bg-white border-indigo-100 shadow-sm animate-in fade-in">
          <LoadingSpinner size="lg" label="Verifying QR attendance with server..." />
          <p className="text-xs text-slate-500 font-mono">Validating class enrollment & server time</p>
        </Card>
      )}

      {/* Main Camera Scanning Card */}
      {!successData && !verifying && (
        <Card className="p-5 sm:p-6 bg-white border-slate-200/80 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-heading">Mobile Camera Scanner</h4>
                <p className="text-[11px] text-slate-400">Position QR code within the frame</p>
              </div>
            </div>
            {isScanning && (
              <Badge variant="success" withDot className="text-[10px]">
                Camera Active
              </Badge>
            )}
          </div>

          {/* Camera Viewport Container */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-square max-w-sm mx-auto flex flex-col items-center justify-center text-white">
            <div id="qr-reader" className="w-full h-full" />

            {!isScanning && (
              <div className="p-6 text-center space-y-3 z-10">
                <QrCode className="w-12 h-12 text-indigo-400 mx-auto opacity-70" />
                <p className="text-xs text-slate-300">Click below to activate camera and scan attendance QR code.</p>
                <Button size="sm" onClick={startCamera} leftIcon={<Camera className="w-3.5 h-3.5" />}>
                  Start Camera
                </Button>
              </div>
            )}
          </div>

          {/* Camera Permission Error Notice */}
          {cameraError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{cameraError}</span>
                <div className="pt-1">
                  <Button variant="outline" size="sm" onClick={startCamera}>
                    Retry Camera
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Accessible Fallback Token Input */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Or Enter Session Token
            </span>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Paste session token (e.g. from screen link)..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="text-xs font-mono py-2"
              />
              <Button
                size="sm"
                onClick={() => submitToken(manualToken)}
                disabled={!manualToken.trim()}
                leftIcon={<Zap className="w-3.5 h-3.5" />}
              >
                Verify
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
