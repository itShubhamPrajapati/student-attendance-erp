import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { QrCode, Lock, Mail, AlertTriangle, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../auth/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRolePreview, setSelectedRolePreview] = useState<'ADMIN' | 'TEACHER' | 'STUDENT'>('ADMIN');

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect to the user's role dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
        return;
      }

      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'TEACHER') {
        navigate('/teacher', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const authenticatedUser = await login(cleanEmail, password);
      if (authenticatedUser.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (authenticatedUser.role === 'TEACHER') {
        navigate('/teacher', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : '';
      if (rawMsg.toLowerCase().includes('invalid') || rawMsg.toLowerCase().includes('unauthorized') || rawMsg.includes('401')) {
        setErrorMessage('Email or password is incorrect. Please verify your credentials and try again.');
      } else if (rawMsg.toLowerCase().includes('fetch') || rawMsg.toLowerCase().includes('network')) {
        setErrorMessage('Unable to connect to the authentication server. Please check your network connection.');
      } else {
        setErrorMessage('Unable to sign in. Please verify your credentials or try again in a few moments.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (role: 'ADMIN' | 'TEACHER' | 'STUDENT') => {
    setSelectedRolePreview(role);
    setErrorMessage(null);
    if (role === 'ADMIN') {
      setEmail('admin@example.com');
      setPassword('ChangeThisPassword123');
    } else if (role === 'TEACHER') {
      setEmail('teacher@example.com');
      setPassword('teacher123');
    } else {
      setEmail('student@example.com');
      setPassword('student123');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 px-4 py-8">
      {/* Return Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to System Overview</span>
      </Link>

      <Card className="shadow-soft-lg border-slate-200/90 dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <QrCode className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold font-heading text-slate-900 dark:text-white">Sign In to Attendance Portal</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            College Field Project — Academic Attendance Management
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Role Preview & Auto-fill Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Demo Role
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Click to pre-fill</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              {(['ADMIN', 'TEACHER', 'STUDENT'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleFillDemo(role)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg capitalize transition cursor-pointer ${
                    selectedRolePreview === role
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {role.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="College Email Address"
              type="email"
              placeholder="e.g. admin@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              id="password"
              label="Password"
              isPassword
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            {/* Error Message Display */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in" role="alert">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold block">Authentication Error</span>
                  <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300">{errorMessage}</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
            >
              Sign In to Account
            </Button>
          </form>

          {/* Quick Notice */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Admin seed credentials: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">admin@example.com</code></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Banner */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
        <span>GORM & PostgreSQL JWT Authentication</span>
      </div>
    </div>
  );
};
